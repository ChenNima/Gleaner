import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:5173';

/**
 * Seed test data. Strategy:
 * 1. Navigate to /graph (uses Layout, never redirects away)
 * 2. Delete the gleaner DB while on the origin
 * 3. Reload so Dexie recreates schema
 * 4. Inject test data via raw IndexedDB
 * 5. Reload again so app reads seeded data
 */
async function setupWithTestData(page: Page) {
  // Navigate to /graph — it renders Layout and won't redirect
  await page.goto(`${BASE}/graph`);
  await page.waitForTimeout(500);

  // Delete the DB (Dexie will recreate on next load)
  await page.evaluate(() =>
    new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('gleaner');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    })
  );

  // Reload so Dexie creates fresh DB
  await page.goto(`${BASE}/graph`);
  await page.waitForTimeout(1500);

  // Inject test data
  await page.evaluate(async () => {
    const now = new Date().toISOString();

    const dbs = await indexedDB.databases();
    const info = dbs.find((d) => d.name === 'gleaner');
    if (!info?.version) throw new Error('gleaner DB not found');

    const idb = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('gleaner', info.version);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    function putAll(storeName: string, items: Record<string, unknown>[]) {
      return new Promise<void>((resolve, reject) => {
        const tx = idb.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        for (const item of items) store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    await putAll('profiles', [{
      id: 'test-profile', name: 'Test', type: 'local',
      yamlContent: 'repos:\n  - url: test-owner/test-repo\n    label: Test Repo\n',
      githubRepo: null, createdAt: now, updatedAt: now,
    }]);

    await putAll('config', [{ key: 'active-profile-id', value: 'test-profile' }]);

    await putAll('repos', [{
      fullName: 'test-owner/test-repo', label: 'Test Repo', treeSha: 'abc123',
      syncStatus: 'done', syncError: null, totalFiles: 3, cachedFiles: 3, lastSyncAt: now,
    }]);

    await putAll('files', [
      {
        id: 'test-owner/test-repo::docs/getting-started.md',
        repoFullName: 'test-owner/test-repo', path: 'docs/getting-started.md', sha: 'sha1',
        content: '# Getting Started\n\nWelcome to the project. This guide helps set up your development environment.',
        title: 'Getting Started', backlinkContext: '# Getting Started', lastSyncAt: now,
      },
      {
        id: 'test-owner/test-repo::docs/api-reference.md',
        repoFullName: 'test-owner/test-repo', path: 'docs/api-reference.md', sha: 'sha2',
        content: '# API Reference\n\nThe REST API provides endpoints for managing resources. Authentication is required.',
        title: 'API Reference', backlinkContext: '# API Reference', lastSyncAt: now,
      },
      {
        id: 'test-owner/test-repo::notes/architecture.md',
        repoFullName: 'test-owner/test-repo', path: 'notes/architecture.md', sha: 'sha3',
        content: '# Architecture Overview\n\nThe system uses a microservices architecture with event-driven communication.',
        title: 'Architecture Overview', backlinkContext: '# Architecture Overview', lastSyncAt: now,
      },
    ]);

    idb.close();
  });

  // Reload so the app reads seeded data
  await page.goto(`${BASE}/graph`);
  await page.waitForTimeout(1500);
}

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await setupWithTestData(page);
    await expect(page.getByTestId('search-trigger')).toBeVisible({ timeout: 5000 });
  });

  test('Ctrl+K opens and Escape closes search dialog', async ({ page }) => {
    await expect(page.getByTestId('search-input')).not.toBeVisible();

    await page.keyboard.press('Control+k');
    await expect(page.getByTestId('search-input')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('search-input')).not.toBeVisible();
  });

  test('search trigger button opens dialog', async ({ page }) => {
    await page.getByTestId('search-trigger').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
  });

  test('typing a query returns matching results', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.getByTestId('search-input').fill('API');
    await page.waitForTimeout(400);

    const results = page.getByTestId('search-result-item');
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText('API Reference');
  });

  test('search matches content not just title', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.getByTestId('search-input').fill('microservices');
    await page.waitForTimeout(400);

    const results = page.getByTestId('search-result-item');
    await expect(results).toHaveCount(1);
    await expect(results.first()).toContainText('Architecture Overview');
  });

  test('no results message for unmatched query', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.getByTestId('search-input').fill('xyznonexistent');
    await page.waitForTimeout(400);

    await expect(page.getByTestId('search-results')).toContainText(/No results|未找到/);
  });

  test('keyboard navigation and Enter to open', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.getByTestId('search-input').fill('re');
    await page.waitForTimeout(400);

    const results = page.getByTestId('search-result-item');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await expect(results.first()).toHaveClass(/bg-accent/);

    await page.keyboard.press('ArrowDown');
    await expect(results.nth(1)).toHaveClass(/bg-accent/);

    await page.keyboard.press('ArrowUp');
    await expect(results.first()).toHaveClass(/bg-accent/);

    await page.keyboard.press('Enter');
    await page.waitForURL('**/repo/test-owner/test-repo/**', { timeout: 5000 });
  });

  test('clicking a result navigates to file', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.getByTestId('search-input').fill('Architecture');
    await page.waitForTimeout(400);

    await page.getByTestId('search-result-item').first().click();
    await page.waitForURL('**/repo/test-owner/test-repo/notes/architecture.md', { timeout: 5000 });
  });

  test('clearing input clears results', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const input = page.getByTestId('search-input');

    await input.fill('API');
    await page.waitForTimeout(400);
    await expect(page.getByTestId('search-result-item')).toHaveCount(1);

    await input.fill('');
    await page.waitForTimeout(400);
    await expect(page.getByTestId('search-result-item')).toHaveCount(0);
  });
});
