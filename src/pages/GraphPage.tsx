import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { db } from '../db';
import { useThemeStore } from '../stores/theme';
import {
  type GraphData, type RenderContext,
  CANVAS_BG_DARK, CANVAS_BG_LIGHT, REPO_COLORS_LIGHT, REPO_COLORS_DARK,
  nodeDisplayName, nodeToRoute, dedupeLinks, buildNeighborMap,
  renderNode, paintPointerArea, linkColor, linkWidth,
} from '../lib/graph-utils';

export default function GraphPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [repoColors, setRepoColors] = useState<Map<string, string>>(new Map());
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseGraphPos = useRef<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const neighbors = useMemo(() => buildNeighborMap(data.links), [data]);

  useEffect(() => {
    (async () => {
      const files = await db.files.toArray();
      const links = await db.links.toArray();

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

      const nodeMap = new Map<string, (typeof data.nodes)[0]>();
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
        if (link.targetFileId && nodeMap.has(link.sourceFileId) && nodeMap.has(link.targetFileId)) {
          graphLinks.push({ source: link.sourceFileId, target: link.targetFileId });
        }
      }

      setData({ nodes: Array.from(nodeMap.values()), links: dedupeLinks(graphLinks) });
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
    (node: any) => {
      const route = nodeToRoute(node.id as string);
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
          <span className="text-xs font-medium">Graph view</span>
          {hasData && (
            <span className="text-xs text-muted-foreground">
              {data.nodes.length} notes &middot; {data.links.length} links
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
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative"
        style={{ background: isDark ? CANVAS_BG_DARK : CANVAS_BG_LIGHT }}
      >
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <p>No files synced yet.</p>
            <Link to="/settings" className="text-primary hover:underline text-sm">Go to Settings</Link>
          </div>
        )}
        {hasData && dimensions && (
          <ForceGraph2D
            ref={fgRef}
            graphData={data as any}
            width={dimensions.width}
            height={dimensions.height}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D) =>
              renderNode(node, ctx, { ...rc, mouseGraphPos: mouseGraphPos.current })
            }
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) =>
              paintPointerArea(node, color, ctx, mouseGraphPos.current, true)
            }
            nodeLabel={(node: any) => node.name}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: any) => setHoverNode(node?.id ?? null)}
            linkColor={(link: any) => linkColor(link, { ...rc, mouseGraphPos: mouseGraphPos.current })}
            linkWidth={(link: any) => linkWidth(link, hoverNode)}
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
