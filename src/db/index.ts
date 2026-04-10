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
