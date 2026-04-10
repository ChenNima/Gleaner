import { db } from '../db';
import type { MdFile } from '../db';

export interface SearchResult {
  file: MdFile;
  /** Which field matched: 'title' ranks higher */
  matchField: 'title' | 'content';
  /** ~120 char snippet around the first match in content */
  snippet: string;
}

/**
 * Search cached markdown files by title and content.
 * Case-insensitive substring matching. Title matches rank first.
 */
export async function searchFiles(query: string, limit = 30): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const q = query.trim().toLowerCase();

  // Get all files from active repos
  const repos = await db.repos.toArray();
  const activeRepoNames = new Set(repos.map((r) => r.fullName));
  const allFiles = await db.files.toArray();
  const files = allFiles.filter((f) => activeRepoNames.has(f.repoFullName));

  const titleMatches: SearchResult[] = [];
  const contentMatches: SearchResult[] = [];

  for (const file of files) {
    const titleLower = file.title.toLowerCase();
    if (titleLower.includes(q)) {
      titleMatches.push({
        file,
        matchField: 'title',
        snippet: generateSnippet(file.content, q),
      });
      continue;
    }

    if (file.content) {
      const contentLower = file.content.toLowerCase();
      const idx = contentLower.indexOf(q);
      if (idx !== -1) {
        contentMatches.push({
          file,
          matchField: 'content',
          snippet: generateSnippet(file.content, q),
        });
      }
    }
  }

  // Title matches first, then content matches — both sorted alphabetically
  titleMatches.sort((a, b) => a.file.title.localeCompare(b.file.title));
  contentMatches.sort((a, b) => a.file.title.localeCompare(b.file.title));

  return [...titleMatches, ...contentMatches].slice(0, limit);
}

/**
 * Generate a ~120 character snippet around the first match position.
 * Falls back to the beginning of the content.
 */
function generateSnippet(content: string | null, query: string): string {
  if (!content) return '';

  const SNIPPET_LEN = 120;
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query);

  if (idx === -1) {
    // No match in content — return start
    return content.length <= SNIPPET_LEN
      ? content.replace(/\n/g, ' ')
      : content.slice(0, SNIPPET_LEN).replace(/\n/g, ' ') + '…';
  }

  // Center the window on the match
  const halfWindow = Math.floor((SNIPPET_LEN - query.length) / 2);
  let start = Math.max(0, idx - halfWindow);
  let end = Math.min(content.length, start + SNIPPET_LEN);

  // Adjust start forward to a word boundary if we're in the middle of a word
  if (start > 0) {
    const spaceIdx = content.indexOf(' ', start);
    if (spaceIdx !== -1 && spaceIdx < idx) {
      start = spaceIdx + 1;
    }
  }

  // Adjust end backward to a word boundary
  if (end < content.length) {
    const spaceIdx = content.lastIndexOf(' ', end);
    if (spaceIdx > idx + query.length) {
      end = spaceIdx;
    }
  }

  let snippet = content.slice(start, end).replace(/\n/g, ' ');
  if (start > 0) snippet = '…' + snippet;
  if (end < content.length) snippet = snippet + '…';

  return snippet;
}
