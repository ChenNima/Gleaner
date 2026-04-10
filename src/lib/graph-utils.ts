import type { MdFile } from '../db';

// --- Types ---

export interface GraphNode {
  id: string;
  name: string;
  repoFullName: string;
  degree: number;
  isCurrent?: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// --- Constants ---

export const NODE_R = 5;
export const GRAVITY_RADIUS = 120;
export const MAX_SCALE = 2.8;
export const CANVAS_BG_DARK = '#191a2e';
export const CANVAS_BG_LIGHT = '#f5f5f0';

export const REPO_COLORS_LIGHT = [
  '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];
export const REPO_COLORS_DARK = [
  '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa',
  '#f472b6', '#22d3ee', '#fb923c', '#2dd4bf', '#818cf8',
];

// --- Helpers ---

/** Build a display name: "filename (title)" or just "filename" */
export function nodeDisplayName(file: MdFile): string {
  const fileName = file.path.split('/').pop()?.replace(/\.md$/i, '') ?? file.path;
  const extractedTitle = file.title && file.title !== fileName ? file.title : null;
  return extractedTitle ? `${fileName} (${extractedTitle})` : fileName;
}

/** Navigate to a file from a graph node */
export function nodeToRoute(nodeId: string): string | null {
  const parts = nodeId.split('::');
  if (parts.length !== 2) return null;
  const [fullName, filePath] = parts;
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo || !filePath) return null;
  return `/repo/${owner}/${repo}/${filePath}`;
}

/** Dedupe links by source→target key */
export function dedupeLinks(links: GraphLink[]): GraphLink[] {
  const set = new Set<string>();
  const result: GraphLink[] = [];
  for (const link of links) {
    const key = `${link.source}→${link.target}`;
    if (!set.has(key)) {
      set.add(key);
      result.push(link);
    }
  }
  return result;
}

/** Build adjacency map for hover highlighting */
export function buildNeighborMap(links: GraphLink[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const link of links) {
    const s = typeof link.source === 'string' ? link.source : (link.source as any).id;
    const t = typeof link.target === 'string' ? link.target : (link.target as any).id;
    if (!map.has(s)) map.set(s, new Set());
    if (!map.has(t)) map.set(t, new Set());
    map.get(s)!.add(t);
    map.get(t)!.add(s);
  }
  return map;
}

// --- Rendering ---

export interface RenderContext {
  isDark: boolean;
  mouseGraphPos: { x: number; y: number } | null;
  hoverNode: string | null;
  neighbors: Map<string, Set<string>>;
  repoColors: Map<string, string>;
  enableGravity: boolean;
  /** Compact mode for small containers (sidebar) — smaller nodes and fonts */
  compact?: boolean;
}

export function renderNode(
  node: any,
  ctx: CanvasRenderingContext2D,
  rc: RenderContext
) {
  const x = node.x as number;
  const y = node.y as number;
  const isCurrent = node.isCurrent as boolean;
  const isHover = node.id === rc.hoverNode;
  const color = rc.repoColors.get(node.repoFullName as string)
    ?? (isCurrent ? (rc.isDark ? '#38bdf8' : '#0ea5e9') : (rc.isDark ? '#64748b' : '#94a3b8'));

  const compact = rc.compact ?? false;
  const nodeR = compact ? 1.5 : 3;
  const baseFont = compact ? 0.9 : 1.8;
  const gravityR = compact ? 50 : GRAVITY_RADIUS;
  const maxS = compact ? 2 : MAX_SCALE;

  // Highlight logic
  const lit = !rc.hoverNode || isHover || (rc.neighbors.get(rc.hoverNode)?.has(node.id as string) ?? false);
  const dimmed = rc.hoverNode && !lit;

  // Gravity lens scale
  let scale = 1;
  if (rc.enableGravity && rc.mouseGraphPos) {
    const dx = x - rc.mouseGraphPos.x;
    const dy = y - rc.mouseGraphPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < gravityR) {
      const t = 1 - dist / gravityR;
      scale = 1 + (maxS - 1) * t * t;
    }
  }

  const r = (isCurrent ? nodeR + 1 : nodeR) * scale;

  // Glow
  if (isHover || isCurrent) {
    ctx.beginPath();
    ctx.arc(x, y, r + 3 * scale, 0, 2 * Math.PI, false);
    ctx.fillStyle = color + '20';
    ctx.fill();
    if (isHover) {
      ctx.beginPath();
      ctx.arc(x, y, r + 1.5 * scale, 0, 2 * Math.PI, false);
      ctx.fillStyle = color + '35';
      ctx.fill();
    }
  }

  // Dot
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI, false);
  if (dimmed) {
    ctx.fillStyle = rc.isDark ? 'rgba(100,116,139,0.15)' : 'rgba(148,163,184,0.2)';
  } else {
    ctx.fillStyle = isHover ? color : color + (rc.hoverNode && lit ? 'ee' : 'aa');
  }
  ctx.fill();

  // Label — always short filename only, full name via tooltip
  if (!dimmed) {
    let label = node.name as string;
    const parenIdx = label.indexOf(' (');
    if (parenIdx > 0) label = label.substring(0, parenIdx);
    const maxLen = compact ? 18 : 24;
    if (label.length > maxLen) label = label.substring(0, maxLen - 2) + '…';
    const fontSize = (isHover ? baseFont + 1.2 : baseFont) * Math.max(scale, 1);
    const bold = isHover || isCurrent || scale > 1.3;
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (isHover || isCurrent) {
      ctx.fillStyle = rc.isDark ? '#f8fafc' : '#0f172a';
    } else if (scale > 1.1) {
      ctx.fillStyle = rc.isDark ? '#e2e8f0' : '#1e293b';
    } else {
      ctx.fillStyle = rc.isDark ? '#94a3b8' : '#475569';
    }
    ctx.fillText(label, x, y + r + 1.5);
  }
}

export function paintPointerArea(
  node: any,
  color: string,
  ctx: CanvasRenderingContext2D,
  mouseGraphPos: { x: number; y: number } | null,
  enableGravity: boolean,
  compact?: boolean
) {
  const nodeR = compact ? 3 : NODE_R;
  const gravityR = compact ? 80 : GRAVITY_RADIUS;
  const maxS = compact ? 2.2 : MAX_SCALE;
  let s = 1;
  if (enableGravity && mouseGraphPos) {
    const dx = node.x - mouseGraphPos.x;
    const dy = node.y - mouseGraphPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < gravityR) {
      const t = 1 - dist / gravityR;
      s = 1 + (maxS - 1) * t * t;
    }
  }
  ctx.beginPath();
  ctx.arc(node.x, node.y, (nodeR + 3) * s, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  ctx.fill();
}

export function linkColor(
  link: any,
  rc: RenderContext
): string {
  if (!rc.hoverNode) return rc.isDark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.15)';
  const s = typeof link.source === 'string' ? link.source : link.source.id;
  const t = typeof link.target === 'string' ? link.target : link.target.id;
  if (s === rc.hoverNode || t === rc.hoverNode) {
    return rc.isDark ? 'rgba(56,189,248,0.5)' : 'rgba(14,165,233,0.45)';
  }
  return rc.isDark ? 'rgba(148,163,184,0.04)' : 'rgba(100,116,139,0.05)';
}

export function linkWidth(link: any, hoverNode: string | null): number {
  if (!hoverNode) return 0.6;
  const s = typeof link.source === 'string' ? link.source : link.source.id;
  const t = typeof link.target === 'string' ? link.target : link.target.id;
  return (s === hoverNode || t === hoverNode) ? 1.5 : 0.3;
}
