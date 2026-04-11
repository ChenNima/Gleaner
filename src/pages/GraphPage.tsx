import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ForceGraph2D from 'react-force-graph-2d';
import { getActiveFiles, getActiveLinks } from '../db';
import { useThemeStore } from '../stores/theme';
import {
  type GraphNode, type GraphLink, type RenderContext,
  CANVAS_BG_DARK, CANVAS_BG_LIGHT, REPO_COLORS_LIGHT, REPO_COLORS_DARK,
  EXTERNAL_COLOR_LIGHT, EXTERNAL_COLOR_DARK,
  nodeDisplayName, nodeToRoute, dedupeLinks, buildNeighborMap,
  renderNode, paintPointerArea, linkColor, linkWidth,
  buildGroups,
} from '../lib/graph-utils';

interface D3Force {
  strength: (n: number) => D3Force;
  distanceMax: (n: number) => D3Force;
  distance: (n: number) => D3Force;
}

interface ForceGraphRef {
  d3Force: (name: string) => D3Force | undefined;
  zoomToFit: (ms: number, padding: number) => void;
  screen2GraphCoords: (x: number, y: number) => { x: number; y: number };
}

/** GraphNode with canvas coordinates added at runtime by force-graph */
type PositionedNode = GraphNode & { x: number; y: number };

/** Link where source/target may be mutated from string to object by force-graph */
type RuntimeLink = GraphLink | { source: string | { id: string }; target: string | { id: string } };

export default function GraphPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rawData, setRawData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [repoColors, setRepoColors] = useState<Map<string, string>>(new Map());
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const fgRef = useRef<ForceGraphRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseGraphPos = useRef<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [showExternalLinks, setShowExternalLinks] = useState(false);
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());

  // Build groups for color assignment, then filter by visibility
  const { data, groups } = useMemo(() => {
    let filteredNodes = rawData.nodes;
    let filteredLinks = rawData.links;
    if (!showExternalLinks) {
      const extIds = new Set(rawData.nodes.filter((n) => n.isExternal).map((n) => n.id));
      filteredNodes = rawData.nodes.filter((n) => !n.isExternal);
      filteredLinks = rawData.links.filter((l) => !extIds.has(l.source) && !extIds.has(l.target));
    }
    // Assign groupId + color to nodes
    const nodesCopy = filteredNodes.map((n) => ({ ...n }));
    // Rebuild links as fresh string-only copies (force graph mutates source/target to objects)
    const linksCopy = filteredLinks.map((l) => ({
      source: typeof l.source === 'string' ? l.source : (l.source as unknown as { id: string }).id,
      target: typeof l.target === 'string' ? l.target : (l.target as unknown as { id: string }).id,
    }));
    const grps = buildGroups(nodesCopy, linksCopy, repoColors, isDark);

    // Filter out hidden groups' nodes
    const hiddenNodeIds = new Set<string>();
    for (const g of grps) {
      if (hiddenGroups.has(g.id)) {
        for (const nid of g.nodeIds) hiddenNodeIds.add(nid);
      }
    }
    const visibleNodes = nodesCopy.filter((n) => !hiddenNodeIds.has(n.id));
    const visibleNodeSet = new Set(visibleNodes.map((n) => n.id));
    const visibleLinks = linksCopy.filter((l) => visibleNodeSet.has(l.source) && visibleNodeSet.has(l.target));

    // Remove orphaned external nodes (lost all connections due to group hiding)
    const connectedIds = new Set<string>();
    for (const l of visibleLinks) { connectedIds.add(l.source); connectedIds.add(l.target); }
    const finalNodes = visibleNodes.filter((n) => !n.isExternal || connectedIds.has(n.id));

    return { data: { nodes: finalNodes, links: visibleLinks }, groups: grps };
  }, [rawData, repoColors, isDark, showExternalLinks, hiddenGroups]);

  const neighbors = useMemo(() => buildNeighborMap(data.links), [data]);

  useEffect(() => {
    (async () => {
      const files = await getActiveFiles();
      const links = await getActiveLinks();

      const palette = isDark ? REPO_COLORS_DARK : REPO_COLORS_LIGHT;
      const repos = [...new Set(files.map((f) => f.repoFullName))];
      const colorMap = new Map<string, string>();
      repos.forEach((r, i) => colorMap.set(r, palette[i % palette.length]));
      setRepoColors(colorMap);

      const degreeMap = new Map<string, number>();
      for (const link of links) {
        degreeMap.set(link.sourceFileId, (degreeMap.get(link.sourceFileId) ?? 0) + 1);
        if (link.targetFileId) degreeMap.set(link.targetFileId, (degreeMap.get(link.targetFileId) ?? 0) + 1);
      }

      const nodeMap = new Map<string, GraphNode>();
      for (const file of files) {
        nodeMap.set(file.id, {
          id: file.id,
          name: nodeDisplayName(file),
          repoFullName: file.repoFullName,
          degree: degreeMap.get(file.id) ?? 0,
        });
      }

      const graphLinks = [];
      for (const link of links) {
        if (link.isExternal && link.targetUrl && nodeMap.has(link.sourceFileId)) {
          const extId = `external::${link.targetUrl}`;
          if (!nodeMap.has(extId)) {
            nodeMap.set(extId, {
              id: extId, name: link.targetTitle, repoFullName: '',
              degree: 0, isExternal: true, url: link.targetUrl,
            });
          }
          graphLinks.push({ source: link.sourceFileId, target: extId });
        } else if (link.targetFileId && nodeMap.has(link.sourceFileId) && nodeMap.has(link.targetFileId)) {
          graphLinks.push({ source: link.sourceFileId, target: link.targetFileId });
        }
      }

      setRawData({ nodes: Array.from(nodeMap.values()), links: dedupeLinks(graphLinks) });
    })();
  }, [isDark]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-80).distanceMax(200);
      fgRef.current.d3Force('link')?.distance(40);
    }
  }, [data]);

  // Track mouse in graph coords
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMouseMove = (e: MouseEvent) => {
      if (fgRef.current?.screen2GraphCoords) {
        const rect = el.getBoundingClientRect();
        mouseGraphPos.current = fgRef.current.screen2GraphCoords(e.clientX - rect.left, e.clientY - rect.top);
      }
    };
    const onMouseLeave = () => { mouseGraphPos.current = null; };
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    return () => { el.removeEventListener('mousemove', onMouseMove); el.removeEventListener('mouseleave', onMouseLeave); };
  }, []);

  // Container sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setDimensions({ width: w, height: h });
    };
    const interval = setInterval(() => {
      measure();
      if (el.clientWidth > 0 && el.clientHeight > 0) clearInterval(interval);
    }, 50);
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => { clearInterval(interval); ro.disconnect(); };
  }, []);

  const handleNodeClick = useCallback(
    (node: PositionedNode) => {
      if (node.isExternal && node.url) {
        window.open(node.url, '_blank', 'noopener');
        return;
      }
      const route = nodeToRoute(node.id);
      if (route) navigate(route);
    },
    [navigate]
  );

  const rc: RenderContext = {
    isDark, mouseGraphPos: mouseGraphPos.current, hoverNode,
    neighbors, repoColors, enableGravity: true,
  };

  const hasData = data.nodes.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-8 px-3 border-b bg-background/80 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{t('graph.title')}</span>
          {hasData && (
            <span className="text-xs text-muted-foreground">
              {data.nodes.length} {t('graph.notes')} &middot; {data.links.length} {t('graph.links')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {[...repoColors.entries()].map(([repo, color]) => (
            <div key={repo} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{repo.split('/')[1]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rotate-45" style={{ backgroundColor: isDark ? EXTERNAL_COLOR_DARK : EXTERNAL_COLOR_LIGHT }} />
            <span className="text-muted-foreground">{t('graph.external')}</span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative"
        style={{ background: isDark ? CANVAS_BG_DARK : CANVAS_BG_LIGHT }}
      >
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <p>{t('graph.noFiles')}</p>
            <Link to="/settings" className="text-primary hover:underline text-sm">{t('graph.goToSettings')}</Link>
          </div>
        )}
        {/* Control panel */}
        {rawData.nodes.length > 0 && (
          <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur border rounded-lg p-2 max-h-56 overflow-y-auto text-xs shadow-sm min-w-[140px]">
            <label className="flex items-center gap-1.5 px-1 py-0.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showExternalLinks}
                onChange={(e) => setShowExternalLinks(e.target.checked)}
                className="w-3 h-3 rounded"
              />
              <span className="text-muted-foreground">{t('graph.externalLinks')}</span>
            </label>
            {groups.length > 0 && (
              <>
                <div className="border-t mt-1 pt-1">
                  {groups.map((g) => {
                    const isVisible = !hiddenGroups.has(g.id);
                    return (
                      <label
                        key={g.id}
                        className="flex items-center gap-1.5 w-full px-1 py-0.5 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => {
                            setHiddenGroups((prev) => {
                              const next = new Set(prev);
                              if (isVisible) next.add(g.id); else next.delete(g.id);
                              return next;
                            });
                          }}
                          className="w-3 h-3 rounded"
                        />
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: g.color, opacity: isVisible ? 1 : 0.3 }}
                        />
                        <span className={isVisible ? '' : 'text-muted-foreground line-through'}>
                          {g.label}
                        </span>
                        <span className="ml-auto text-muted-foreground">{g.nodeIds.length}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
        {hasData && dimensions && (
          <ForceGraph2D
            ref={fgRef as never}
            graphData={data as never}
            width={dimensions.width}
            height={dimensions.height}
            nodeCanvasObjectMode={() => 'replace'}
            nodeCanvasObject={(node: PositionedNode, ctx: CanvasRenderingContext2D) =>
              renderNode(node, ctx, { ...rc, mouseGraphPos: mouseGraphPos.current })
            }
            nodePointerAreaPaint={(node: PositionedNode, color: string, ctx: CanvasRenderingContext2D) =>
              paintPointerArea(node, color, ctx, mouseGraphPos.current, true)
            }
            nodeLabel={(node: PositionedNode) => node.name}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: PositionedNode | null) => setHoverNode(node?.id ?? null)}
            linkColor={(link: RuntimeLink) => linkColor(link, { ...rc, mouseGraphPos: mouseGraphPos.current })}
            linkWidth={(link: RuntimeLink) => linkWidth(link, hoverNode)}
            linkDirectionalParticles={0}
            backgroundColor="transparent"
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.25}
            warmupTicks={50}
            cooldownTicks={200}
            autoPauseRedraw={false}
            onEngineStop={() => fgRef.current?.zoomToFit(400, 60)}
          />
        )}
      </div>
    </div>
  );
}
