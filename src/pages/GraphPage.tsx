import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { ArrowLeft } from 'lucide-react';
import { db } from '../db';
import { ThemeToggle } from '../components/ThemeToggle';

interface GraphNode {
  id: string;
  name: string;
  repoFullName: string;
  val: number; // degree
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const REPO_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

export default function GraphPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [repoColors, setRepoColors] = useState<Map<string, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    (async () => {
      const files = await db.files.toArray();
      const links = await db.links.toArray();

      // Build color map
      const repos = [...new Set(files.map((f) => f.repoFullName))];
      const colorMap = new Map<string, string>();
      repos.forEach((r, i) => colorMap.set(r, REPO_COLORS[i % REPO_COLORS.length]));
      setRepoColors(colorMap);

      // Build degree map
      const degreeMap = new Map<string, number>();
      for (const link of links) {
        degreeMap.set(link.sourceFileId, (degreeMap.get(link.sourceFileId) ?? 0) + 1);
        if (link.targetFileId) {
          degreeMap.set(link.targetFileId, (degreeMap.get(link.targetFileId) ?? 0) + 1);
        }
      }

      const nodeMap = new Map<string, GraphNode>();
      for (const file of files) {
        nodeMap.set(file.id, {
          id: file.id,
          name: file.title || file.path.split('/').pop()?.replace(/\.md$/i, '') || file.path,
          repoFullName: file.repoFullName,
          val: (degreeMap.get(file.id) ?? 0) + 1,
        });
      }

      const graphLinks: GraphLink[] = [];
      for (const link of links) {
        if (link.targetFileId && nodeMap.has(link.sourceFileId) && nodeMap.has(link.targetFileId)) {
          graphLinks.push({
            source: link.sourceFileId,
            target: link.targetFileId,
          });
        }
      }

      setData({
        nodes: Array.from(nodeMap.values()),
        links: graphLinks,
      });
    })();
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      const [owner, repo] = node.repoFullName.split('/');
      const path = node.id.split('::')[1];
      if (owner && repo && path) {
        navigate(`/repo/${owner}/${repo}/${path}`);
      }
    },
    [navigate]
  );

  const nodeColor = useCallback(
    (node: GraphNode) => repoColors.get(node.repoFullName) ?? '#888',
    [repoColors]
  );

  if (data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-muted-foreground">
        <p>No files synced yet. Sync some repositories first.</p>
        <Link to="/settings" className="text-primary hover:underline text-sm">
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between h-11 px-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded hover:bg-accent text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">Knowledge Graph</span>
          <span className="text-xs text-muted-foreground">
            {data.nodes.length} nodes, {data.links.length} links
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-2 text-xs">
            {[...repoColors.entries()].map(([repo, color]) => (
              <div key={repo} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground">{repo.split('/')[1]}</span>
              </div>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div ref={containerRef} className="flex-1 bg-background">
        <ForceGraph2D
          graphData={data as any}
          width={dimensions.width}
          height={dimensions.height}
          nodeLabel={(node: any) => `${node.name}\n${node.repoFullName}`}
          nodeColor={nodeColor as any}
          nodeRelSize={4}
          nodeVal={(node: any) => node.val}
          onNodeClick={handleNodeClick as any}
          linkColor={() => 'rgba(150,150,150,0.3)'}
          linkWidth={0.5}
          backgroundColor="transparent"
        />
      </div>
    </div>
  );
}
