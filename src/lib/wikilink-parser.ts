import { db } from '../db';
import type { WikiLink, MdFile } from '../db';

const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

/**
 * Extract wikilink targets from markdown content
 */
export function extractWikilinks(content: string): string[] {
  const targets: string[] = [];
  let match;
  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    targets.push(match[1].trim());
  }
  return targets;
}

/**
 * Parse wikilinks from a file and write to the links table
 */
export async function parseAndStoreLinks(file: MdFile): Promise<void> {
  if (!file.content) return;

  const targets = extractWikilinks(file.content);

  // Remove old links for this file
  await db.links.where('sourceFileId').equals(file.id).delete();

  if (targets.length === 0) return;

  const links: WikiLink[] = targets.map((targetTitle) => ({
    sourceFileId: file.id,
    targetTitle,
    targetFileId: null, // resolved later
  }));

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
  const titleMap = new Map<string, MdFile[]>();

  for (const file of allFiles) {
    const title = fileTitle(file).toLowerCase();
    const existing = titleMap.get(title) ?? [];
    existing.push(file);
    titleMap.set(title, existing);
  }

  const allLinks = await db.links.toArray();

  for (const link of allLinks) {
    const target = link.targetTitle.toLowerCase();
    const candidates = titleMap.get(target);

    if (!candidates || candidates.length === 0) {
      if (link.targetFileId !== null) {
        await db.links.update(link.id!, { targetFileId: null });
      }
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
 * Get backlinks for a file
 */
export async function getBacklinks(fileId: string): Promise<{ source: MdFile; context: string }[]> {
  const links = await db.links.where('targetFileId').equals(fileId).toArray();

  const results: { source: MdFile; context: string }[] = [];
  for (const link of links) {
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
