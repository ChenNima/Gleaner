import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ForceGraph2D from 'react-force-graph-2d';
import { db, getActiveRepoNames } from '../db';
import { useThemeStore } from '../stores/theme';
import { useAppStore } from '../stores/app';
import {
  type GraphNode, type GraphLink, type RenderContext,
  CANVAS_BG_DARK, CANVAS_BG_LIGHT,
  nodeDisplayName, nodeToRoute, dedupeLinks,
  renderNode, paintPointerArea,
} from '../lib/graph-utils';

interface LocalGraphProps {
  fileId: string | null;
}

export function LocalGraph({ fileId }: LocalGraphProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const fgRef = useRef<{
    screen2GraphCoords?: (x: number, y: number) => { x: number; y: number };
    zoomToFit: (ms: number, padding: number) => void;
    d3Force: (name: string, force?: unknown) => unknown;
    d3ReheatSimulation: () => void;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseGraphPos = useRef<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [depth, setDepth] = useState(1);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const syncVersion = useAppStore((s) => s.syncVersion);

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

  // Track mouse for gravity lens
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

  // Load local graph data — refreshes on file change, depth change, or sync/profile switch
  useEffect(() => {
    if (!fileId) { setData({ nodes: [], links: [] }); return; }

    (async () => {
      const activeRepos = await getActiveRepoNames();

      // BFS to collect nodes up to `depth` hops from the current file
      const visitedFileIds = new Set<string>();
      visitedFileIds.add(fileId);
      const graphLinks: GraphLink[] = [];
      const externalNodeMap = new Map<string, GraphNode>();

      let frontier = [fileId];
      for (let d = 0; d < depth && frontier.length > 0; d++) {
        const nextFrontier: string[] = [];

        for (const currentId of frontier) {
          const outgoing = await db.links.where('sourceFileId').equals(currentId).toArray();
          const incoming = await db.links.where('targetFileId').equals(currentId).toArray();

          for (const link of outgoing) {
            if (link.isExternal && link.targetUrl) {
              const extId = `external::${link.targetUrl}`;
              if (!externalNodeMap.has(extId)) {
                externalNodeMap.set(extId, {
                  id: extId, name: link.targetTitle, repoFullName: '',
                  degree: 0, isExternal: true, url: link.targetUrl,
                });
              }
              graphLinks.push({ source: currentId, target: extId });
            } else if (link.targetFileId) {
              const targetRepo = link.targetFileId.split('::')[0];
              if (activeRepos.has(targetRepo)) {
                graphLinks.push({ source: currentId, target: link.targetFileId });
                if (!visitedFileIds.has(link.targetFileId)) {
                  visitedFileIds.add(link.targetFileId);
                  nextFrontier.push(link.targetFileId);
                }
              }
            }
          }
          for (const link of incoming) {
            const sourceRepo = link.sourceFileId.split('::')[0];
            if (activeRepos.has(sourceRepo)) {
              graphLinks.push({ source: link.sourceFileId, target: currentId });
              if (!visitedFileIds.has(link.sourceFileId)) {
                visitedFileIds.add(link.sourceFileId);
                nextFrontier.push(link.sourceFileId);
              }
            }
          }
        }
        frontier = nextFrontier;
      }

      const nodes: GraphNode[] = [...externalNodeMap.values()];
      for (const id of visitedFileIds) {
        const file = await db.files.get(id);
        if (file) {
          nodes.push({
            id: file.id,
            name: nodeDisplayName(file),
            repoFullName: file.repoFullName,
            degree: 0,
            isCurrent: file.id === fileId,
          });
        }
      }

      // Filter out links referencing non-existent nodes (prevents ghost nodes in ForceGraph2D)
      const nodeIds = new Set(nodes.map((n) => n.id));
      const safeLinks = dedupeLinks(graphLinks).filter(
        (l) => nodeIds.has(l.source) && nodeIds.has(l.target)
      );

      setData({ nodes, links: safeLinks });
    })();
  }, [fileId, depth, syncVersion]);

  // Configure asymmetric forces based on container aspect ratio
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !dimensions || data.nodes.length === 0) return;

    const { width, height } = dimensions;
    const aspect = width / height; // < 1 for tall narrow containers

    type SimNode = Record<string, number>;
    const makeAxisForce = (axis: 'x' | 'y', strength: number) => {
      const vel = axis === 'x' ? 'vx' : 'vy';
      let nodes: SimNode[] = [];
      const force = (alpha: number) => {
        for (const node of nodes) {
          node[vel] += (0 - (node[axis] ?? 0)) * strength * alpha;
        }
      };
      force.initialize = (n: SimNode[]) => { nodes = n; };
      return force;
    };

    if (aspect < 0.8) {
      // Tall narrow container: compress X, allow Y spread
      const xStrength = Math.min(0.08 / aspect, 0.3);
      const yStrength = Math.max(0.08 * aspect, 0.01);
      fg.d3Force('x', makeAxisForce('x', xStrength));
      fg.d3Force('y', makeAxisForce('y', yStrength));
    } else {
      // Roughly square or wide: remove asymmetric forces
      fg.d3Force('x', null);
      fg.d3Force('y', null);
    }

    (fg.d3Force('charge') as { strength: (n: number) => void } | undefined)?.strength(-30);
    fg.d3ReheatSimulation();
  }, [dimensions, data]);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.isExternal && node.url) {
        window.open(node.url, '_blank', 'noopener');
        return;
      }
      const route = nodeToRoute(node.id);
      if (route) navigate(route);
    },
    [navigate]
  );

  const { t } = useTranslation();

  let overlay: string | null = null;
  if (!fileId) overlay = t('localGraph.noFile');
  else if (data.nodes.length === 0) overlay = t('localGraph.noConnections');

  const rc: RenderContext = {
    isDark,
    mouseGraphPos: mouseGraphPos.current,
    hoverNode: null,
    neighbors: new Map(),
    repoColors: new Map(),
    enableGravity: true,
    compact: true,
  };

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ background: isDark ? CANVAS_BG_DARK : CANVAS_BG_LIGHT }}>
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          {overlay}
        </div>
      )}
      {/* Depth control */}
      {fileId && (
        <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur rounded px-1.5 py-0.5 text-[10px] text-muted-foreground">
          <span>{t('localGraph.depth')}</span>
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              className={`w-4 h-4 rounded text-center leading-4 transition-colors ${
                depth === d
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      {!overlay && dimensions && (
        <ForceGraph2D
          ref={fgRef as React.RefObject<never>}
          graphData={data as unknown as { nodes: object[]; links: object[] }}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={(node, ctx) =>
            renderNode(node as unknown as GraphNode & { x: number; y: number }, ctx, { ...rc, mouseGraphPos: mouseGraphPos.current })
          }
          nodePointerAreaPaint={(node, color, ctx) =>
            paintPointerArea(node as unknown as GraphNode & { x: number; y: number }, color, ctx, mouseGraphPos.current, true, true)
          }
          nodeLabel={(node) => (node as unknown as GraphNode).name}
          onNodeClick={(node) => handleNodeClick(node as unknown as GraphNode)}
          linkColor={() => isDark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.3)'}
          linkWidth={0.8}
          backgroundColor="transparent"
          cooldownTicks={60}
          d3AlphaDecay={0.05}
          d3VelocityDecay={0.3}
          autoPauseRedraw={false}
          onEngineStop={() => fgRef.current?.zoomToFit(300, 20)}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      )}
    </div>
  );
}
