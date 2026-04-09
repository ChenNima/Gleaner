import { create } from 'zustand';
import type { Repo, MdFile } from '../db';

interface AppState {
  repos: Repo[];
  setRepos: (repos: Repo[]) => void;
  updateRepo: (fullName: string, updates: Partial<Repo>) => void;

  fileTree: Map<string, MdFile[]>; // repoFullName -> files
  setFileTree: (repoFullName: string, files: MdFile[]) => void;

  currentFileId: string | null;
  setCurrentFileId: (id: string | null) => void;

  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  syncingRepos: Set<string>;
  setSyncing: (fullName: string, syncing: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  repos: [],
  setRepos: (repos) => set({ repos }),
  updateRepo: (fullName, updates) =>
    set((state) => ({
      repos: state.repos.map((r) =>
        r.fullName === fullName ? { ...r, ...updates } : r
      ),
    })),

  fileTree: new Map(),
  setFileTree: (repoFullName, files) =>
    set((state) => {
      const next = new Map(state.fileTree);
      next.set(repoFullName, files);
      return { fileTree: next };
    }),

  currentFileId: null,
  setCurrentFileId: (id) => set({ currentFileId: id }),

  leftSidebarOpen: true,
  rightSidebarOpen: true,
  toggleLeftSidebar: () =>
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () =>
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

  syncingRepos: new Set(),
  setSyncing: (fullName, syncing) =>
    set((state) => {
      const next = new Set(state.syncingRepos);
      if (syncing) next.add(fullName);
      else next.delete(fullName);
      return { syncingRepos: next };
    }),
}));
