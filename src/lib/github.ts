import { getAuthHeaders } from './auth';
import {
  RepoNotFoundError,
  RateLimitError,
  NetworkError,
} from './errors';

const API_BASE = 'https://api.github.com';

export interface TreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface RepoTreeResult {
  sha: string; // tree SHA
  entries: TreeEntry[];
  truncated: boolean;
}

export interface RepoInfo {
  defaultBranch: string;
  fullName: string;
}

async function ghFetch(url: string, accept?: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: accept ?? 'application/vnd.github+json',
    ...(await getAuthHeaders()),
  };

  let response: Response;
  try {
    response = await fetch(url, { headers });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 404) {
    throw new RepoNotFoundError(url);
  }

  if (response.status === 403 || response.status === 429) {
    const resetHeader = response.headers.get('X-RateLimit-Reset');
    const resetTimestamp = resetHeader ? parseInt(resetHeader, 10) : Math.floor(Date.now() / 1000) + 3600;
    throw new RateLimitError(resetTimestamp);
  }

  if (!response.ok) {
    throw new NetworkError(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

/**
 * Get repository info (default branch, full name)
 */
export async function getRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const response = await ghFetch(`${API_BASE}/repos/${owner}/${repo}`);
  const data = await response.json();
  return {
    defaultBranch: data.default_branch,
    fullName: data.full_name,
  };
}

/**
 * Get the full file tree of a repo using REST Trees API (recursive)
 */
export async function getRepoTree(
  owner: string,
  repo: string,
  treeSha: string
): Promise<RepoTreeResult> {
  const response = await ghFetch(
    `${API_BASE}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`
  );
  const data = await response.json();
  return {
    sha: data.sha,
    entries: data.tree as TreeEntry[],
    truncated: data.truncated ?? false,
  };
}

/**
 * Get the latest commit SHA for the default branch
 */
export async function getLatestCommitSha(
  owner: string,
  repo: string,
  branch: string
): Promise<string> {
  const response = await ghFetch(
    `${API_BASE}/repos/${owner}/${repo}/commits/${branch}`
  );
  const data = await response.json();
  return data.sha;
}

/**
 * Get the tree SHA from a commit
 */
export async function getCommitTreeSha(
  owner: string,
  repo: string,
  commitSha: string
): Promise<string> {
  const response = await ghFetch(
    `${API_BASE}/repos/${owner}/${repo}/git/commits/${commitSha}`
  );
  const data = await response.json();
  return data.tree.sha;
}

/**
 * Get raw file content
 */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string> {
  const url = ref
    ? `${API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
    : `${API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  const response = await ghFetch(url, 'application/vnd.github.raw');
  return response.text();
}

/**
 * Parse "owner/repo" string
 */
export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const parts = fullName.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repo format: "${fullName}". Expected "owner/repo".`);
  }
  return { owner: parts[0], repo: parts[1] };
}

/**
 * Full incremental sync flow for a single repo:
 * 1. Get repo info (default branch)
 * 2. Get latest commit SHA
 * 3. Get tree SHA from commit
 * 4. Compare with local treeSha
 * 5. If different, get full tree and return new/changed .md files
 */
export async function syncRepoTree(
  owner: string,
  repo: string,
  localTreeSha: string | null
): Promise<{
  treeSha: string;
  mdFiles: TreeEntry[];
  changed: boolean;
}> {
  const info = await getRepoInfo(owner, repo);
  const commitSha = await getLatestCommitSha(owner, repo, info.defaultBranch);
  const treeSha = await getCommitTreeSha(owner, repo, commitSha);

  if (treeSha === localTreeSha) {
    return { treeSha, mdFiles: [], changed: false };
  }

  const tree = await getRepoTree(owner, repo, treeSha);
  const mdFiles = tree.entries.filter(
    (e) => e.type === 'blob' && e.path.endsWith('.md')
  );

  return { treeSha, mdFiles, changed: true };
}
