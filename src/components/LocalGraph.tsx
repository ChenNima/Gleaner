import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ForceGraph2D from 'react-force-graph-2d';
import { db, getActiveRepoNames } from '../db';
import { useThemeStore } from '../stores/theme';
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
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseGraphPos = useRef<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

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

  // Load local graph data
  useEffect(() => {
    if (!fileId) { setData({ nodes: [], links: [] }); return; }

    (async () => {
      const activeRepos = await getActiveRepoNames();
      const outgoing = await db.links.where('sourceFileId').equals(fileId).toArray();
      const incoming = await db.links.where('targetFileId').equals(fileId).toArray();

      const neighborIds = new Set<string>();
      neighborIds.add(fileId);
      const graphLinks: GraphLink[] = [];

      const externalNodes: GraphNode[] = [];
      for (const link of outgoing) {
        if (link.isExternal && link.targetUrl) {
          const extId = `external::${link.targetUrl}`;
          externalNodes.push({
            id: extId, name: link.targetTitle, repoFullName: '',
            degree: 0, isExternal: true, url: link.targetUrl,
          });
          graphLinks.push({ source: fileId, target: extId });
        } else if (link.targetFileId) {
          // Only include if target belongs to active profile's repos
          const targetRepo = link.targetFileId.split('::')[0];
          if (activeRepos.has(targetRepo)) {
            neighborIds.add(link.targetFileId);
            graphLinks.push({ source: fileId, target: link.targetFileId });
          }
        }
      }
      for (const link of incoming) {
        // Only include if source belongs to active profile's repos
        const sourceRepo = link.sourceFileId.split('::')[0];
        if (activeRepos.has(sourceRepo)) {
          neighborIds.add(link.sourceFileId);
          graphLinks.push({ source: link.sourceFileId, target: fileId });
        }
      }

      const nodes: GraphNode[] = [...externalNodes];
      for (const id of neighborIds) {
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

      setData({ nodes, links: dedupeLinks(graphLinks) });
    })();
  }, [fileId]);

  const handleNodeClick = useCallback(
    (node: any) => {
      if (node.isExternal && node.url) {
        window.open(node.url, '_blank', 'noopener');
        return;
      }
      const route = nodeToRoute(node.id as string);
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
      {!overlay && dimensions && (
        <ForceGraph2D
          ref={fgRef}
          graphData={data as any}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D) =>
            renderNode(node, ctx, { ...rc, mouseGraphPos: mouseGraphPos.current })
          }
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) =>
            paintPointerArea(node, color, ctx, mouseGraphPos.current, true, true)
          }
          nodeLabel={(node: any) => node.name}
          onNodeClick={handleNodeClick}
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
