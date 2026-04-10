import Dexie, { type Table } from 'dexie';

export interface ConfigEntry {
  key: string;
  value: string;
}

export interface Repo {
  fullName: string;
  label: string;
  treeSha: string | null;
  syncStatus: 'idle' | 'syncing' | 'done' | 'error';
  syncError: string | null;
  totalFiles: number;
  cachedFiles: number;
  lastSyncAt: string | null;
}

export interface MdFile {
  id: string; // "owner/repo::path/to/file.md"
  repoFullName: string;
  path: string;
  sha: string;
  content: string | null;
  title: string;
  backlinkContext: string | null;
  lastSyncAt: string;
}

export interface WikiLink {
  id?: number;
  sourceFileId: string;
  targetTitle: string;
  targetFileId: string | null;
  isExternal?: boolean;
  targetUrl?: string | null;
}

export interface Profile {
  id: string;
  name: string;
  type: 'local' | 'github';
  yamlContent: string | null;
  githubRepo: string | null;
  createdAt: string;
  updatedAt: string;
}

class GleanerDB extends Dexie {
  config!: Table<ConfigEntry, string>;
  repos!: Table<Repo, string>;
  files!: Table<MdFile, string>;
  links!: Table<WikiLink, number>;
  profiles!: Table<Profile, string>;

  constructor() {
    super('gleaner');
    this.version(1).stores({
      config: '&key',
      repos: '&fullName, label',
      files: '&id, repoFullName, path, sha',
      links: '++id, sourceFileId, targetTitle, targetFileId',
    });
    this.version(2).stores({
      config: '&key',
      repos: '&fullName, label',
      files: '&id, repoFullName, path, sha',
      links: '++id, sourceFileId, targetTitle, targetFileId, isExternal',
    });
    this.version(3).stores({
      config: '&key',
      repos: '&fullName, label',
      files: '&id, repoFullName, path, sha',
      links: '++id, sourceFileId, targetTitle, targetFileId, isExternal',
      profiles: '&id, name',
    });
  }
}

export const db = new GleanerDB();

/** Get file IDs that belong to currently active repos */
export async function getActiveRepoNames(): Promise<Set<string>> {
  const repos = await db.repos.toArray();
  return new Set(repos.map((r) => r.fullName));
}

/** Get files belonging to currently active repos only */
export async function getActiveFiles(): Promise<MdFile[]> {
  const activeRepos = await getActiveRepoNames();
  const files = await db.files.toArray();
  return files.filter((f) => activeRepos.has(f.repoFullName));
}

/** Get links where source file belongs to active repos */
export async function getActiveLinks(): Promise<WikiLink[]> {
  const activeRepos = await getActiveRepoNames();
  const links = await db.links.toArray();
  return links.filter((l) => activeRepos.has(l.sourceFileId.split('::')[0]));
}
