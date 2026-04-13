import { db, getActiveRepoNames, getActiveFiles } from '../db';
import type { WikiLink, MdFile } from '../db';
import { extractFrontmatter } from './frontmatter';

/**
 * Convert a heading string to a slug matching rehype-slug's output.
 */
export function headingToSlug(heading: string): string {
  return heading.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

// Captures: group1=target (file part, may be empty), group2=heading, group3=alias
const WIKILINK_REGEX = /\[\[([^\]|#]*?)(?:#([^\]|]*?))?(?:\|([^\]]+))?\]\]/g;
const MD_LINK_REGEX = /\[([^\]]+)\]\(([^)]+\.md(?:#[^)]*)?)\)/g;
const EXTERNAL_LINK_REGEX = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;

export interface ParsedWikilink {
  target: string;   // file part only (no #heading), already trimmed
  heading: string;   // heading part (without #), empty string if none
  alias: string;     // display text, empty string if none
}

/**
 * Extract wikilink targets from markdown content.
 * Returns only the file-name portion (no #heading) for backward compatibility.
 */
export function extractWikilinks(content: string): string[] {
  return extractParsedWikilinks(content).map((w) => w.target).filter(Boolean);
}

/**
 * Extract structured wikilink data from markdown content.
 */
export function extractParsedWikilinks(content: string): ParsedWikilink[] {
  const results: ParsedWikilink[] = [];
  let match;
  const re = new RegExp(WIKILINK_REGEX.source, WIKILINK_REGEX.flags);
  while ((match = re.exec(content)) !== null) {
    results.push({
      target: (match[1] ?? '').trim(),
      heading: (match[2] ?? '').trim(),
      alias: (match[3] ?? '').trim(),
    });
  }
  return results;
}

/**
 * Strip .md suffix (case-insensitive) from a wikilink target.
 */
function stripMdExtension(name: string): string {
  return name.replace(/\.md$/i, '');
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

const FRONTMATTER_URL_KEYS = new Set(['url', 'link', 'source_url', 'href']);

/**
 * Extract URLs from YAML frontmatter fields
 */
export function extractFrontmatterLinks(content: string): { title: string; url: string }[] {
  const { meta } = extractFrontmatter(content);
  if (!meta) return [];

  const results: { title: string; url: string }[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (!FRONTMATTER_URL_KEYS.has(key.toLowerCase())) continue;
    if (typeof value !== 'string') continue;
    if (!value.startsWith('http://') && !value.startsWith('https://')) continue;
    const title = domainFromUrl(value);
    results.push({ title, url: value });
  }
  return results;
}

/**
 * Parse wikilinks and standard markdown links from a file and write to the links table
 */
export async function parseAndStoreLinks(file: MdFile): Promise<void> {
  if (!file.content) return;

  // Remove old links for this file
  await db.links.where('sourceFileId').equals(file.id).delete();

  const links: WikiLink[] = [];

  // Extract wikilinks — store only the file-name portion as targetTitle
  const parsed = extractParsedWikilinks(file.content);
  for (const w of parsed) {
    if (!w.target) continue; // [[#heading]] only — no file target to store
    links.push({ sourceFileId: file.id, targetTitle: w.target, targetFileId: null });
  }

  // Extract standard markdown links and resolve to file IDs immediately
  const mdLinkPaths = extractMarkdownLinks(file.content, file.path);
  for (const targetPath of mdLinkPaths) {
    const targetFileId = `${file.repoFullName}::${targetPath}`;
    const title = targetPath.split('/').pop()?.replace(/\.md$/i, '') ?? targetPath;
    links.push({ sourceFileId: file.id, targetTitle: title, targetFileId: targetFileId });
  }

  // Extract external links from markdown body
  const extLinks = extractExternalLinks(file.content);
  const seenUrls = new Set<string>();
  for (const ext of extLinks) {
    seenUrls.add(ext.url);
    links.push({
      sourceFileId: file.id,
      targetTitle: ext.title,
      targetFileId: null,
      isExternal: true,
      targetUrl: ext.url,
    });
  }

  // Extract external links from frontmatter metadata
  const fmLinks = extractFrontmatterLinks(file.content);
  for (const fm of fmLinks) {
    if (seenUrls.has(fm.url)) continue;
    seenUrls.add(fm.url);
    links.push({
      sourceFileId: file.id,
      targetTitle: fm.title,
      targetFileId: null,
      isExternal: true,
      targetUrl: fm.url,
    });
  }

  if (links.length === 0) return;
  await db.links.bulkAdd(links);
}

/**
 * Pre-built index for O(1) wikilink resolution.
 */
interface FileIndex {
  fileIdSet: Set<string>;
  /** lowercase filename (without .md) → files */
  nameMap: Map<string, MdFile[]>;
  /** lowercase frontmatter title → files */
  titleMap: Map<string, MdFile[]>;
  /** lowercase path suffix (without .md) → files, e.g. "getting-started/quick start" */
  pathSuffixMap: Map<string, MdFile[]>;
}

function buildFileIndex(allFiles: MdFile[]): FileIndex {
  const fileIdSet = new Set(allFiles.map((f) => f.id));
  const nameMap = new Map<string, MdFile[]>();
  const titleMap = new Map<string, MdFile[]>();
  const pathSuffixMap = new Map<string, MdFile[]>();

  for (const file of allFiles) {
    // Index by filename
    const fileName = stripMdExtension(file.path.split('/').pop() ?? '').toLowerCase();
    pushToMap(nameMap, fileName, file);

    // Index by frontmatter title
    if (file.title) {
      pushToMap(titleMap, file.title.toLowerCase(), file);
    }

    // Index by all path suffixes for path-based matching
    const normalized = stripMdExtension(file.path).toLowerCase();
    const parts = normalized.split('/');
    // Full path and every suffix with at least one directory component
    for (let i = 0; i < parts.length; i++) {
      pushToMap(pathSuffixMap, parts.slice(i).join('/'), file);
    }
  }

  return { fileIdSet, nameMap, titleMap, pathSuffixMap };
}

function pushToMap(map: Map<string, MdFile[]>, key: string, file: MdFile): void {
  const arr = map.get(key);
  if (arr) arr.push(file);
  else map.set(key, [file]);
}

/**
 * Look up a wikilink target using a pre-built index. O(1) per lookup.
 */
function findMatchingFileIndexed(
  index: FileIndex,
  rawTarget: string,
  sourceRepo: string | null,
): MdFile | null {
  const target = stripMdExtension(rawTarget).toLowerCase();
  if (!target) return null;

  let candidates: MdFile[];

  if (target.includes('/')) {
    candidates = index.pathSuffixMap.get(target) ?? [];
  } else {
    // Merge name + title matches, dedupe
    const byName = index.nameMap.get(target) ?? [];
    const byTitle = index.titleMap.get(target) ?? [];
    if (byTitle.length === 0) {
      candidates = byName;
    } else if (byName.length === 0) {
      candidates = byTitle;
    } else {
      const seen = new Set<string>();
      candidates = [];
      for (const f of byName) { seen.add(f.id); candidates.push(f); }
      for (const f of byTitle) { if (!seen.has(f.id)) candidates.push(f); }
    }
  }

  return pickBestCandidate(candidates, sourceRepo);
}

/**
 * Resolve all unresolved wikilinks globally.
 * Builds an index first for O(N+M) total instead of O(N×M).
 */
export async function resolveAllLinks(): Promise<void> {
  const activeFiles = await getActiveFiles();
  const index = buildFileIndex(activeFiles);

  const activeRepos = await getActiveRepoNames();
  const allLinks = await db.links.toArray();

  for (const link of allLinks) {
    // Skip external links — they don't resolve to files
    if (link.isExternal) continue;

    // Only resolve links whose source belongs to an active repo
    const sourceRepo = link.sourceFileId.split('::')[0];
    if (!activeRepos.has(sourceRepo)) continue;

    // If targetFileId is already set (from standard markdown links), verify it exists
    if (link.targetFileId) {
      if (!index.fileIdSet.has(link.targetFileId)) {
        await db.links.update(link.id!, { targetFileId: null });
      }
      continue;
    }

    const resolved = findMatchingFileIndexed(index, link.targetTitle, sourceRepo);

    if (resolved && link.targetFileId !== resolved.id) {
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
 * Resolve a single wikilink target to a file ID.
 * Supports: strip .md, path-suffix matching, filename + frontmatter title dual match.
 */
export async function resolveWikilink(
  targetTitle: string,
  sourceRepoFullName?: string
): Promise<MdFile | null> {
  const allFiles = await db.files.toArray();
  return findMatchingFile(allFiles, targetTitle, sourceRepoFullName ?? null);
}

/**
 * Among candidates: prefer same repo, then shortest path.
 */
function pickBestCandidate(candidates: MdFile[], sourceRepo: string | null): MdFile | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  if (sourceRepo) {
    const sameRepo = candidates.filter((f) => f.repoFullName === sourceRepo);
    if (sameRepo.length === 1) return sameRepo[0];
    if (sameRepo.length > 1) {
      return sameRepo.sort((a, b) => a.path.length - b.path.length)[0];
    }
  }

  return candidates.sort((a, b) => a.path.length - b.path.length)[0];
}

/**
 * Core matching logic for resolveWikilink (single lookup, no pre-built index).
 * Uses linear scan — fine for one-off calls, use findMatchingFileIndexed for batch.
 */
function findMatchingFile(
  allFiles: MdFile[],
  rawTarget: string,
  sourceRepo: string | null,
): MdFile | null {
  const target = stripMdExtension(rawTarget).toLowerCase();
  if (!target) return null;

  let candidates: MdFile[];

  if (target.includes('/')) {
    const suffix = '/' + target;
    candidates = allFiles.filter((f) => {
      const normalized = stripMdExtension(f.path).toLowerCase();
      return normalized === target || normalized.endsWith(suffix);
    });
  } else {
    candidates = allFiles.filter((f) => {
      const fileName = stripMdExtension(f.path.split('/').pop() ?? '').toLowerCase();
      if (fileName === target) return true;
      if (f.title && f.title.toLowerCase() === target) return true;
      return false;
    });
  }

  return pickBestCandidate(candidates, sourceRepo);
}
