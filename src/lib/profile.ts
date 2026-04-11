import yaml from 'js-yaml';
import { db } from '../db';
import type { Profile, Repo } from '../db';
import { fetchAndParseConfig, type RepoConfig } from './config';
export type { RepoConfig } from './config';
import { normalizeRepoSlug } from './github';
import { syncAllRepos } from './sync';
import { useAppStore } from '../stores/app';

const ACTIVE_PROFILE_KEY = 'active-profile-id';

// AbortController for cancelling in-flight syncs
let currentSyncAbort: AbortController | null = null;

/** Get all profiles */
export async function getProfiles(): Promise<Profile[]> {
  return db.profiles.toArray();
}

/** Get the active profile */
export async function getActiveProfile(): Promise<Profile | null> {
  const entry = await db.config.get(ACTIVE_PROFILE_KEY);
  if (!entry) return null;
  return (await db.profiles.get(entry.value)) ?? null;
}

/** Get active profile ID */
export async function getActiveProfileId(): Promise<string | null> {
  const entry = await db.config.get(ACTIVE_PROFILE_KEY);
  return entry?.value ?? null;
}

/** Create a new profile */
export async function createProfile(
  name: string,
  type: 'local' | 'github'
): Promise<Profile> {
  const now = new Date().toISOString();
  const profile: Profile = {
    id: crypto.randomUUID(),
    name,
    type,
    yamlContent: type === 'local' ? 'repos: []\n' : null,
    githubRepo: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.profiles.put(profile);
  return profile;
}

/** Update a profile */
export async function updateProfile(
  id: string,
  updates: Partial<Pick<Profile, 'name' | 'type' | 'yamlContent' | 'githubRepo'>>
): Promise<void> {
  await db.profiles.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

/** Delete a profile (cannot delete last one) */
export async function deleteProfile(id: string): Promise<void> {
  const count = await db.profiles.count();
  if (count <= 1) throw new Error('Cannot delete the last profile');

  await db.profiles.delete(id);

  // If deleted the active profile, switch to the first remaining
  const activeId = await getActiveProfileId();
  if (activeId === id) {
    const first = await db.profiles.toCollection().first();
    if (first) await setActiveProfile(first.id);
  }
}

/** Set the active profile (does not trigger sync) */
export async function setActiveProfile(id: string): Promise<void> {
  await db.config.put({ key: ACTIVE_PROFILE_KEY, value: id });
}

/** Get RepoConfig[] from a profile */
export async function getRepoConfigs(profile: Profile): Promise<RepoConfig[]> {
  if (profile.type === 'github') {
    if (!profile.githubRepo) return [];
    return fetchAndParseConfig(profile.githubRepo);
  }
  if (!profile.yamlContent) return [];
  return parseLocalYaml(profile.yamlContent);
}

/** Parse repos from a profile's config */
export async function getReposFromProfile(profile: Profile): Promise<Repo[]> {
  const repoConfigs = await getRepoConfigs(profile);

  return repoConfigs.map((rc) => ({
    fullName: rc.url,
    label: rc.label,
    treeSha: null,
    syncStatus: 'idle' as const,
    syncError: null,
    totalFiles: 0,
    cachedFiles: 0,
    lastSyncAt: null,
  }));
}

/** Parse local YAML content into RepoConfig[] */
export function parseLocalYaml(yamlContent: string): RepoConfig[] {
  const parsed = yaml.load(yamlContent) as Record<string, unknown> | undefined;
  if (!parsed || !Array.isArray(parsed.repos)) return [];

  return (parsed.repos as Record<string, unknown>[])
    .filter((r: Record<string, unknown>) => r && r.url)
    .map((r: Record<string, unknown>) => {
      const rc: RepoConfig = {
        url: normalizeRepoSlug(r.url as string),
        label: (r.label as string) ?? (r.url as string),
      };
      if (r.branch && typeof r.branch === 'string') rc.branch = r.branch;
      if (r.commit && typeof r.commit === 'string' && r.commit !== 'latest') rc.commit = r.commit;
      if (Array.isArray(r.includePaths)) rc.includePaths = r.includePaths.filter((p: unknown) => typeof p === 'string');
      if (Array.isArray(r.excludePaths)) rc.excludePaths = r.excludePaths.filter((p: unknown) => typeof p === 'string');
      return rc;
    });
}

/** Generate YAML from RepoConfig[] */
export function repoConfigsToYaml(configs: RepoConfig[]): string {
  return yaml.dump({
    repos: configs.map((c) => {
      const entry: Record<string, unknown> = { url: c.url, label: c.label };
      if (c.branch) entry.branch = c.branch;
      if (c.commit && c.commit !== 'latest' && c.commit !== 'pin') entry.commit = c.commit;
      else if (c.commit === 'pin') entry.commit = 'pin';
      if (c.includePaths && c.includePaths.length > 0) entry.includePaths = c.includePaths;
      if (c.excludePaths && c.excludePaths.length > 0) entry.excludePaths = c.excludePaths;
      return entry;
    }),
  });
}

/** Import repos from a GitHub config repo's gleaner.yaml */
export async function importFromGithub(repoFullName: string): Promise<RepoConfig[]> {
  const configs = await fetchAndParseConfig(repoFullName);
  return configs;
}

/** Import repos from a YAML file content string */
export function importFromYamlString(content: string): RepoConfig[] {
  return parseLocalYaml(content);
}

/** Export current config as a downloadable YAML file */
export function exportAsYamlFile(configs: RepoConfig[]) {
  const yamlStr = repoConfigsToYaml(configs);
  const blob = new Blob([yamlStr], { type: 'application/x-yaml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gleaner.yaml';
  a.click();
  URL.revokeObjectURL(url);
}


/**
 * Switch to a different profile:
 * 1. Abort any in-flight sync
 * 2. Set active profile
 * 3. Load repos from profile config
 * 4. Clear + replace repos in DB
 * 5. Trigger syncAllRepos
 */
export async function switchProfile(id: string): Promise<void> {
  // 1. Abort in-flight sync
  if (currentSyncAbort) {
    currentSyncAbort.abort();
    currentSyncAbort = null;
  }

  // 2. Set active
  await setActiveProfile(id);
  const profile = await db.profiles.get(id);
  if (!profile) throw new Error('Profile not found');

  // 3. Load repos from profile
  const repoConfigs = await getRepoConfigs(profile);
  const newRepos = repoConfigs.map((rc) => ({
    fullName: rc.url,
    label: rc.label,
    treeSha: null,
    syncStatus: 'idle' as const,
    syncError: null,
    totalFiles: 0,
    cachedFiles: 0,
    lastSyncAt: null,
  }));

  // 4. Merge with existing cache (preserve treeSha/cachedFiles for shared repos)
  const existing = await db.repos.toArray();
  const existingMap = new Map(existing.map((r) => [r.fullName, r]));

  const merged = newRepos.map((r) => {
    const prev = existingMap.get(r.fullName);
    if (prev) {
      return {
        ...r,
        treeSha: prev.treeSha,
        totalFiles: prev.totalFiles,
        cachedFiles: prev.cachedFiles,
        lastSyncAt: prev.lastSyncAt,
      };
    }
    return r;
  });

  await db.repos.clear();
  await db.repos.bulkPut(merged);
  useAppStore.getState().setRepos(merged);

  // Refresh file tree from cache
  for (const repo of merged) {
    const files = await db.files.where('repoFullName').equals(repo.fullName).toArray();
    useAppStore.getState().setFileTree(repo.fullName, files);
  }

  // 5. Background sync with abort support
  currentSyncAbort = new AbortController();
  syncAllRepos((repo) => {
    useAppStore.getState().updateRepo(repo.fullName, repo);
  }, repoConfigs);
}

/**
 * Re-sync the active profile's repos using saved configs.
 * Preserves existing cache — only fetches changes.
 */
export async function refreshActiveProfile(): Promise<void> {
  if (currentSyncAbort) {
    currentSyncAbort.abort();
    currentSyncAbort = null;
  }

  const profile = await getActiveProfile();
  if (!profile) return;

  const repoConfigs = await getRepoConfigs(profile);

  currentSyncAbort = new AbortController();
  syncAllRepos((repo) => {
    useAppStore.getState().updateRepo(repo.fullName, repo);
  }, repoConfigs);
}

/**
 * Migrate existing config to profile system.
 * Called once on first boot after upgrade to v3.
 */
export async function migrateToProfiles(): Promise<void> {
  const profileCount = await db.profiles.count();
  if (profileCount > 0) return; // Already migrated

  const configRepo = await db.config.get('config-repo');
  const now = new Date().toISOString();

  let profile: Profile;
  if (configRepo?.value) {
    profile = {
      id: crypto.randomUUID(),
      name: 'Default',
      type: 'github',
      yamlContent: null,
      githubRepo: configRepo.value,
      createdAt: now,
      updatedAt: now,
    };
  } else {
    profile = {
      id: crypto.randomUUID(),
      name: 'Default',
      type: 'local',
      yamlContent: 'repos: []\n',
      githubRepo: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  await db.profiles.put(profile);
  await setActiveProfile(profile.id);
}
