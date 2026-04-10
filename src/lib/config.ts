import yaml from 'js-yaml';
import { db } from '../db';
import { getFileContent, parseRepoFullName } from './github';
import { ConfigParseError, ConfigNotFoundError, RepoNotFoundError } from './errors';
import type { Repo } from '../db';

const CONFIG_REPO_KEY = 'config-repo';
const CONFIG_FILE = 'gleaner.yaml';

export interface RepoConfig {
  url: string;
  label: string;
}

interface GleanerConfig {
  repos: RepoConfig[];
}

export async function getConfigRepo(): Promise<string | null> {
  const entry = await db.config.get(CONFIG_REPO_KEY);
  return entry?.value ?? null;
}

export async function setConfigRepo(fullName: string): Promise<void> {
  await db.config.put({ key: CONFIG_REPO_KEY, value: fullName });
}

function parseRepoUrl(url: string): string {
  // Support formats: "github.com/owner/repo", "https://github.com/owner/repo", "owner/repo"
  const cleaned = url
    .replace(/^https?:\/\//, '')
    .replace(/^github\.com\//, '')
    .replace(/\.git$/, '')
    .trim();
  return cleaned;
}

export async function fetchAndParseConfig(configRepoFullName: string): Promise<RepoConfig[]> {
  const { owner, repo } = parseRepoFullName(configRepoFullName);

  let content: string;
  try {
    content = await getFileContent(owner, repo, CONFIG_FILE);
  } catch (err) {
    if (err instanceof RepoNotFoundError) {
      throw new ConfigNotFoundError(configRepoFullName);
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new ConfigParseError(msg);
  }

  if (!parsed || typeof parsed !== 'object' || !('repos' in parsed)) {
    throw new ConfigParseError('Missing "repos" key in gleaner.yaml');
  }

  const config = parsed as GleanerConfig;
  if (!Array.isArray(config.repos)) {
    throw new ConfigParseError('"repos" must be an array');
  }

  return config.repos.map((r, i) => {
    if (!r.url) {
      throw new ConfigParseError(`Entry ${i}: missing "url" field`);
    }
    return {
      url: parseRepoUrl(r.url),
      label: r.label ?? r.url,
    };
  });
}

export async function syncConfig(): Promise<Repo[]> {
  const configRepo = await getConfigRepo();
  if (!configRepo) {
    throw new Error('No config repo configured. Go to Settings.');
  }

  const repoConfigs = await fetchAndParseConfig(configRepo);

  const repos: Repo[] = repoConfigs.map((rc) => ({
    fullName: rc.url,
    label: rc.label,
    treeSha: null,
    syncStatus: 'idle' as const,
    syncError: null,
    totalFiles: 0,
    cachedFiles: 0,
    lastSyncAt: null,
  }));

  // Merge with existing repos to preserve sync state
  const existing = await db.repos.toArray();
  const existingMap = new Map(existing.map((r) => [r.fullName, r]));

  const merged = repos.map((r) => {
    const prev = existingMap.get(r.fullName);
    if (prev) {
      return { ...r, treeSha: prev.treeSha, totalFiles: prev.totalFiles, cachedFiles: prev.cachedFiles, lastSyncAt: prev.lastSyncAt };
    }
    return r;
  });

  // Replace all repos
  await db.repos.clear();
  await db.repos.bulkPut(merged);

  return merged;
}
