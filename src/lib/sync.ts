import { db } from '../db';
import type { Repo, MdFile } from '../db';
import type { RepoConfig } from './config';
import { syncRepoTree, getFileContent, parseRepoFullName } from './github';
import { RateLimitError } from './errors';
import { parseAndStoreLinks, resolveAllLinks } from './wikilink-parser';
import { useAppStore } from '../stores/app';

type ProgressCallback = (repo: Repo) => void;

function filterByPaths(
  mdFiles: { path: string; sha: string }[],
  includePaths?: string[],
  excludePaths?: string[]
): { path: string; sha: string }[] {
  let filtered = mdFiles;
  if (includePaths && includePaths.length > 0) {
    filtered = filtered.filter((f) => includePaths.some((p) => f.path.startsWith(p)));
  }
  if (excludePaths && excludePaths.length > 0) {
    filtered = filtered.filter((f) => !excludePaths.some((p) => f.path.startsWith(p)));
  }
  return filtered;
}

/**
 * Sync a single repo: fetch tree, identify .md files, background-cache content
 */
async function syncSingleRepo(
  repo: Repo,
  onProgress?: ProgressCallback,
  config?: RepoConfig
): Promise<void> {
  const { owner, repo: repoName } = parseRepoFullName(repo.fullName);

  // Update status to syncing
  await db.repos.update(repo.fullName, { syncStatus: 'syncing', syncError: null });
  const updatedRepo = { ...repo, syncStatus: 'syncing' as const, syncError: null };
  onProgress?.(updatedRepo);

  // "pin" sentinel means "auto-lock on next sync" — treat as latest for this sync
  const effectiveCommit = config?.commit === 'pin' ? undefined : config?.commit;

  // Fetch tree and check for changes
  const result = await syncRepoTree(owner, repoName, repo.treeSha, {
    branch: config?.branch,
    commit: effectiveCommit,
  });

  // Apply path filtering
  const filteredMdFiles = filterByPaths(result.mdFiles, config?.includePaths, config?.excludePaths);

  if (!result.changed) {
    // Still load cached file tree into store (needed after page refresh)
    const cachedFiles = await db.files.where('repoFullName').equals(repo.fullName).toArray();
    useAppStore.getState().setFileTree(repo.fullName, cachedFiles);

    await db.repos.update(repo.fullName, { syncStatus: 'done', lastSyncAt: new Date().toISOString() });
    onProgress?.({ ...updatedRepo, syncStatus: 'done', lastSyncAt: new Date().toISOString() });
    return;
  }

  // Update tree SHA and total file count
  const totalFiles = filteredMdFiles.length;
  await db.repos.update(repo.fullName, { treeSha: result.treeSha, totalFiles });
  onProgress?.({ ...updatedRepo, treeSha: result.treeSha, totalFiles });

  // Get existing files for this repo to check which need updating
  const existingFiles = await db.files.where('repoFullName').equals(repo.fullName).toArray();
  const existingMap = new Map(existingFiles.map((f) => [f.path, f]));

  // Identify new/changed files
  const toFetch: { path: string; sha: string }[] = [];
  const newFileRecords: MdFile[] = [];

  for (const entry of filteredMdFiles) {
    const existing = existingMap.get(entry.path);
    const fileId = `${repo.fullName}::${entry.path}`;
    const title = entry.path.split('/').pop()?.replace(/\.md$/i, '') ?? entry.path;

    if (!existing || existing.sha !== entry.sha) {
      toFetch.push({ path: entry.path, sha: entry.sha });
      newFileRecords.push({
        id: fileId,
        repoFullName: repo.fullName,
        path: entry.path,
        sha: entry.sha,
        content: null,
        title,
        backlinkContext: null,
        lastSyncAt: new Date().toISOString(),
      });
    }
  }

  // Remove deleted files
  const currentPaths = new Set(filteredMdFiles.map((e) => e.path));
  const toDelete = existingFiles.filter((f) => !currentPaths.has(f.path));
  for (const f of toDelete) {
    await db.files.delete(f.id);
    await db.links.where('sourceFileId').equals(f.id).delete();
  }

  // Insert/update file metadata (content=null, will be fetched in background)
  for (const record of newFileRecords) {
    await db.files.put(record);
  }

  // Also ensure unchanged files are in the store
  for (const entry of filteredMdFiles) {
    const fileId = `${repo.fullName}::${entry.path}`;
    const exists = await db.files.get(fileId);
    if (!exists) {
      const title = entry.path.split('/').pop()?.replace(/\.md$/i, '') ?? entry.path;
      await db.files.put({
        id: fileId,
        repoFullName: repo.fullName,
        path: entry.path,
        sha: entry.sha,
        content: null,
        title,
        backlinkContext: null,
        lastSyncAt: new Date().toISOString(),
      });
    }
  }

  // Update file tree in store
  const allFiles = await db.files.where('repoFullName').equals(repo.fullName).toArray();
  useAppStore.getState().setFileTree(repo.fullName, allFiles);

  // Background fetch content for new/changed files
  let cachedCount = allFiles.filter((f) => f.content !== null).length;

  let i = 0;
  while (i < toFetch.length) {
    const item = toFetch[i];
    try {
      const content = await getFileContent(owner, repoName, item.path);
      const fileId = `${repo.fullName}::${item.path}`;
      const backlinkContext = content.slice(0, 100);
      const titleFromContent = extractTitleFromContent(content) ??
        item.path.split('/').pop()?.replace(/\.md$/i, '') ?? item.path;

      await db.files.update(fileId, { content, backlinkContext, title: titleFromContent });

      // Parse wikilinks
      const file = await db.files.get(fileId);
      if (file) {
        await parseAndStoreLinks(file);
      }

      cachedCount++;
      await db.repos.update(repo.fullName, { cachedFiles: cachedCount });
      onProgress?.({ ...updatedRepo, cachedFiles: cachedCount, totalFiles });

      // Yield to main thread
      await new Promise((r) => setTimeout(r, 10));
      i++;
    } catch (err) {
      if (err instanceof RateLimitError) {
        // Pause and wait for rate limit reset, then retry same file
        const waitMs = Math.max(0, err.resetAt.getTime() - Date.now()) + 1000;
        await new Promise((r) => setTimeout(r, Math.min(waitMs, 60000)));
        // Don't increment i — retry same file
        continue;
      }
      // Skip individual file errors, continue with others
      console.warn(`Failed to fetch ${item.path}:`, err);
      i++;
    }
  }

  // Resolve all links after content is fetched
  await resolveAllLinks();

  // Mark done
  await db.repos.update(repo.fullName, {
    syncStatus: 'done',
    cachedFiles: cachedCount,
    lastSyncAt: new Date().toISOString(),
  });

  // Refresh file tree
  const finalFiles = await db.files.where('repoFullName').equals(repo.fullName).toArray();
  useAppStore.getState().setFileTree(repo.fullName, finalFiles);

  onProgress?.({
    ...updatedRepo,
    syncStatus: 'done',
    cachedFiles: cachedCount,
    lastSyncAt: new Date().toISOString(),
  });
}

/**
 * Sync all repos. Each repo is synced independently — one failure doesn't block others.
 */
export async function syncAllRepos(onProgress?: ProgressCallback, configs?: RepoConfig[]): Promise<void> {
  const repos = await db.repos.toArray();
  useAppStore.getState().setRepos(repos);

  const configMap = new Map<string, RepoConfig>();
  if (configs) {
    for (const c of configs) configMap.set(c.url, c);
  }

  for (const repo of repos) {
    try {
      await syncSingleRepo(repo, onProgress, configMap.get(repo.fullName));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await db.repos.update(repo.fullName, {
        syncStatus: 'error',
        syncError: errorMsg,
      });
      onProgress?.({ ...repo, syncStatus: 'error', syncError: errorMsg });
    }
  }

  // Refresh store with final state
  const finalRepos = await db.repos.toArray();
  useAppStore.getState().setRepos(finalRepos);
  useAppStore.getState().bumpSyncVersion();
}

function extractTitleFromContent(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}
