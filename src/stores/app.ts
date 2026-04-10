import { create } from 'zustand';
import type { Repo, MdFile } from '../db';
import { db } from '../db';

interface AppState {
  repos: Repo[];
  setRepos: (repos: Repo[]) => void;
  updateRepo: (fullName: string, updates: Partial<Repo>) => void;

  fileTree: Map<string, MdFile[]>; // repoFullName -> files
  setFileTree: (repoFullName: string, files: MdFile[]) => void;
  clearFileTree: () => void;

  currentFileId: string | null;
  setCurrentFileId: (id: string | null) => void;

  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  leftSidebarWidth: number;
  rightSidebarWidth: number;
  setLeftSidebarWidth: (w: number) => void;
  setRightSidebarWidth: (w: number) => void;

  syncingRepos: Set<string>;
  setSyncing: (fullName: string, syncing: boolean) => void;
}

function persistWidth(key: string, value: number) {
  db.config.put({ key, value: String(value) });
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
  clearFileTree: () => set({ fileTree: new Map() }),

  currentFileId: null,
  setCurrentFileId: (id) => set({ currentFileId: id }),

  leftSidebarOpen: true,
  rightSidebarOpen: true,
  setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
  setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
  toggleLeftSidebar: () =>
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () =>
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

  leftSidebarWidth: 240,
  rightSidebarWidth: 280,
  setLeftSidebarWidth: (w) => {
    set({ leftSidebarWidth: w });
    persistWidth('left-sidebar-width', w);
  },
  setRightSidebarWidth: (w) => {
    set({ rightSidebarWidth: w });
    persistWidth('right-sidebar-width', w);
  },

  syncingRepos: new Set(),
  setSyncing: (fullName, syncing) =>
    set((state) => {
      const next = new Set(state.syncingRepos);
      if (syncing) next.add(fullName);
      else next.delete(fullName);
      return { syncingRepos: next };
    }),
}));
