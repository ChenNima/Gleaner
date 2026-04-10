import { db, getActiveRepoNames } from '../db';
import type { WikiLink, MdFile } from '../db';

const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const MD_LINK_REGEX = /\[([^\]]+)\]\(([^)]+\.md(?:#[^)]*)?)\)/g;
const EXTERNAL_LINK_REGEX = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;

/**
 * Extract wikilink targets from markdown content
 */
export function extractWikilinks(content: string): string[] {
  const targets: string[] = [];
  let match;
  const re = new RegExp(WIKILINK_REGEX.source, WIKILINK_REGEX.flags);
  while ((match = re.exec(content)) !== null) {
    targets.push(match[1].trim());
  }
  return targets;
}

/**
 * Extract standard markdown links to .md files: [text](path.md)
 * Returns resolved paths relative to repo root.
 */
export function extractMarkdownLinks(content: string, sourcePath: string): string[] {
  const targets: string[] = [];
  const re = new RegExp(MD_LINK_REGEX.source, MD_LINK_REGEX.flags);
  let match;
  while ((match = re.exec(content)) !== null) {
    const href = match[2].split('#')[0]; // strip anchor
    if (!href || href.startsWith('http://') || href.startsWith('https://')) continue;
    const resolved = resolveRelativePath(sourcePath, href);
    if (resolved) targets.push(resolved);
  }
  return [...new Set(targets)]; // dedupe
}

/**
 * Resolve a relative path from a source file to an absolute repo path.
 * e.g. sourcePath="docs/ARCHITECTURE.md", href="./SEARCH.md" → "docs/SEARCH.md"
 *      sourcePath="README.md", href="docs/ARCHITECTURE.md" → "docs/ARCHITECTURE.md"
 */
function resolveRelativePath(sourcePath: string, href: string): string | null {
  // Decode URL-encoded characters (e.g. %20 → space) so paths match DB entries
  const decodedHref = decodeURIComponent(href);
  const sourceDir = sourcePath.includes('/') ? sourcePath.substring(0, sourcePath.lastIndexOf('/')) : '';
  const parts = (sourceDir ? sourceDir + '/' + decodedHref : decodedHref).split('/');
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (resolved.length === 0) return null; // invalid path
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return resolved.join('/');
}

/**
 * Extract external links: [text](https://...)
 */
export function extractExternalLinks(content: string): { title: string; url: string }[] {
  const results: { title: string; url: string }[] = [];
  const seen = new Set<string>();
  const re = new RegExp(EXTERNAL_LINK_REGEX.source, EXTERNAL_LINK_REGEX.flags);
  let match;
  while ((match = re.exec(content)) !== null) {
    const url = match[2];
    if (seen.has(url)) continue;
    seen.add(url);
    const title = match[1].trim() || domainFromUrl(url);
    results.push({ title, url });
  }
  return results;
}

function domainFromUrl(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

/**
 * Parse wikilinks and standard markdown links from a file and write to the links table
 */
export async function parseAndStoreLinks(file: MdFile): Promise<void> {
  if (!file.content) return;

  // Remove old links for this file
  await db.links.where('sourceFileId').equals(file.id).delete();

  const links: WikiLink[] = [];

  // Extract wikilinks
  const wikiTargets = extractWikilinks(file.content);
  for (const targetTitle of wikiTargets) {
    links.push({ sourceFileId: file.id, targetTitle, targetFileId: null });
  }

  // Extract standard markdown links and resolve to file IDs immediately
  const mdLinkPaths = extractMarkdownLinks(file.content, file.path);
  for (const targetPath of mdLinkPaths) {
    const targetFileId = `${file.repoFullName}::${targetPath}`;
    const title = targetPath.split('/').pop()?.replace(/\.md$/i, '') ?? targetPath;
    links.push({ sourceFileId: file.id, targetTitle: title, targetFileId: targetFileId });
  }

  // Extract external links
  const extLinks = extractExternalLinks(file.content);
  for (const ext of extLinks) {
    links.push({
      sourceFileId: file.id,
      targetTitle: ext.title,
      targetFileId: null,
      isExternal: true,
      targetUrl: ext.url,
    });
  }

  if (links.length === 0) return;
  await db.links.bulkAdd(links);
}

/**
 * Resolve all unresolved wikilinks globally.
 * Strategy:
 * 1. Exact title match (case-insensitive)
 * 2. Cross-repo global search
 * 3. If multiple matches, prefer same repo
 */
export async function resolveAllLinks(): Promise<void> {
  const allFiles = await db.files.toArray();
  const fileIdSet = new Set(allFiles.map((f) => f.id));
  const titleMap = new Map<string, MdFile[]>();

  for (const file of allFiles) {
    const title = fileTitle(file).toLowerCase();
    const existing = titleMap.get(title) ?? [];
    existing.push(file);
    titleMap.set(title, existing);
  }

  const allLinks = await db.links.toArray();

  for (const link of allLinks) {
    // Skip external links — they don't resolve to files
    if (link.isExternal) continue;

    // If targetFileId is already set (from standard markdown links), verify it exists
    if (link.targetFileId) {
      if (!fileIdSet.has(link.targetFileId)) {
        await db.links.update(link.id!, { targetFileId: null });
      }
      continue;
    }

    // Resolve by title (for wikilinks)
    const target = link.targetTitle.toLowerCase();
    const candidates = titleMap.get(target);

    if (!candidates || candidates.length === 0) {
      continue;
    }

    // Prefer same repo
    const sourceRepo = link.sourceFileId.split('::')[0];
    const sameRepo = candidates.find((f) => f.repoFullName === sourceRepo);
    const resolved = sameRepo ?? candidates[0];

    if (link.targetFileId !== resolved.id) {
      await db.links.update(link.id!, { targetFileId: resolved.id });
    }
  }
}

/**
 * Get external links from a file
 */
export async function getExternalLinks(fileId: string): Promise<{ title: string; url: string }[]> {
  const links = await db.links.where('sourceFileId').equals(fileId).toArray();
  return links
    .filter((l) => l.isExternal && l.targetUrl)
    .map((l) => ({ title: l.targetTitle, url: l.targetUrl! }));
}

/**
 * Get backlinks for a file (filtered to active profile's repos)
 */
export async function getBacklinks(fileId: string): Promise<{ source: MdFile; context: string }[]> {
  const activeRepos = await getActiveRepoNames();
  const links = await db.links.where('targetFileId').equals(fileId).toArray();

  const results: { source: MdFile; context: string }[] = [];
  for (const link of links) {
    const sourceRepo = link.sourceFileId.split('::')[0];
    if (!activeRepos.has(sourceRepo)) continue;
    const source = await db.files.get(link.sourceFileId);
    if (source) {
      results.push({
        source,
        context: source.backlinkContext ?? source.title,
      });
    }
  }

  return results;
}

/**
 * Get outgoing links for a file (filtered to active profile's repos)
 */
export async function getOutgoingLinks(fileId: string): Promise<{ target: MdFile; title: string }[]> {
  const activeRepos = await getActiveRepoNames();
  const links = await db.links.where('sourceFileId').equals(fileId).toArray();

  const seen = new Set<string>();
  const results: { target: MdFile; title: string }[] = [];
  for (const link of links) {
    if (!link.targetFileId || seen.has(link.targetFileId)) continue;
    const targetRepo = link.targetFileId.split('::')[0];
    if (!activeRepos.has(targetRepo)) continue;
    seen.add(link.targetFileId);
    const target = await db.files.get(link.targetFileId);
    if (target) {
      results.push({ target, title: link.targetTitle });
    }
  }

  return results;
}

/**
 * Resolve a single wikilink target to a file ID
 */
export async function resolveWikilink(
  targetTitle: string,
  sourceRepoFullName?: string
): Promise<MdFile | null> {
  const allFiles = await db.files.toArray();
  const target = targetTitle.toLowerCase();

  const matches = allFiles.filter(
    (f) => fileTitle(f).toLowerCase() === target
  );

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Prefer same repo
  if (sourceRepoFullName) {
    const sameRepo = matches.find((f) => f.repoFullName === sourceRepoFullName);
    if (sameRepo) return sameRepo;
  }

  return matches[0];
}

function fileTitle(file: MdFile): string {
  if (file.title) return file.title;
  const name = file.path.split('/').pop() ?? file.path;
  return name.replace(/\.md$/i, '');
}
