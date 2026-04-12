import { db } from '../db';
import { useAppStore } from '../stores/app';
import { parseAndStoreLinks, resolveAllLinks } from './wikilink-parser';
import { migrateToProfiles, getProfiles, getActiveProfile } from './profile';

let hydrated = false;

/**
 * Hydrate Zustand store from IndexedDB on app boot.
 * Safe to call multiple times — only runs once.
 */
export async function hydrateStoreFromDB(): Promise<void> {
  if (hydrated) return;
  hydrated = true;

  // Migrate to profile system if needed (v3)
  await migrateToProfiles();

  // Load profiles into store
  const profiles = await getProfiles();
  const activeProfile = await getActiveProfile();
  useAppStore.getState().setProfiles(profiles);
  if (activeProfile) useAppStore.getState().setActiveProfileId(activeProfile.id);

  // Restore sidebar widths
  const leftW = await db.config.get('left-sidebar-width');
  const rightW = await db.config.get('right-sidebar-width');
  if (leftW) useAppStore.getState().setLeftSidebarWidth(Number(leftW.value));
  if (rightW) useAppStore.getState().setRightSidebarWidth(Number(rightW.value));

  const repos = await db.repos.toArray();
  if (repos.length > 0) {
    useAppStore.getState().setRepos(repos);
    for (const repo of repos) {
      const files = await db.files.where('repoFullName').equals(repo.fullName).toArray();
      useAppStore.getState().setFileTree(repo.fullName, files);
    }
  }

  // Check if links need re-parsing (e.g. parser was updated)
  const PARSER_VERSION = '3';
  const allFiles = await db.files.toArray();
  const filesWithContent = allFiles.filter((f) => f.content !== null);
  const linkCount = await db.links.count();
  const storedVersion = await db.config.get('parser-version');
  const needsReparse = (filesWithContent.length > 0 && linkCount === 0)
    || (storedVersion?.value !== PARSER_VERSION && filesWithContent.length > 0);

  if (needsReparse) {
    await db.links.clear();
    for (const file of filesWithContent) {
      await parseAndStoreLinks(file);
    }
    await resolveAllLinks();
    await db.config.put({ key: 'parser-version', value: PARSER_VERSION });
  }
}

/** Reset hydration flag (for use after "Reset All Data"). */
export function resetHydration(): void {
  hydrated = false;
}
