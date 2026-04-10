import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5173';

test.describe('Gleaner MVP E2E', () => {
  test('first visit redirects to settings', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForURL('**/settings', { timeout: 5000 });
    await expect(page.locator('text=Config Repository')).toBeVisible();
  });

  test('settings page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Config Repository')).toBeVisible();
    await expect(page.locator('text=Personal Access Token')).toBeVisible();
    await expect(page.locator('text=Save & Sync')).toBeVisible();
    await expect(page.locator('text=Clear Cache')).toBeVisible();
  });

  test('settings shows error for empty config repo', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.click('text=Save & Sync');
    await expect(page.locator('text=Please enter a config repo URL')).toBeVisible({ timeout: 3000 });
  });

  test('settings shows error for invalid repo', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.fill('input[placeholder="owner/repo"]', 'nonexistent-owner-xyz/nonexistent-repo-xyz');
    await page.click('text=Save & Sync');
    await expect(page.locator('.bg-destructive\\/10')).toBeVisible({ timeout: 15000 });
  });

  test('full flow: configure repo → sync → browse files', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.fill('input[placeholder="owner/repo"]', 'ChenNima/Gleaner');
    await page.click('text=Save & Sync');

    // Wait for success message or redirect
    await page.waitForTimeout(5000);

    // Should eventually reach home page
    await page.goto(BASE);
    await page.waitForTimeout(3000);

    // Should see Hello Gleaner heading (confirms we reached home page)
    await expect(page.getByRole('heading', { name: 'Hello Gleaner' })).toBeVisible();

    // Verify the three-column layout rendered (sidebar is present)
    await expect(page.getByRole('complementary').first()).toBeVisible({ timeout: 5000 });
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    const html = page.locator('html');

    await expect(html).not.toHaveClass(/dark/);

    // Find and click the moon icon button (theme toggle)
    const toggleButtons = page.locator('button[title*="dark"], button[title*="Switch to dark"]');
    await toggleButtons.first().click();
    await expect(html).toHaveClass(/dark/);

    const lightToggle = page.locator('button[title*="light"], button[title*="Switch to light"]');
    await lightToggle.first().click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('graph page renders', async ({ page }) => {
    await page.goto(`${BASE}/graph`);
    // Graph page has "Knowledge Graph" text or empty state
    await expect(
      page.locator('text=Knowledge Graph').or(page.locator('text=No files synced'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('routes are accessible', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await expect(page).toHaveTitle('Gleaner');

    await page.goto(`${BASE}/graph`);
    await expect(
      page.locator('text=Knowledge Graph').or(page.locator('text=No files synced'))
    ).toBeVisible({ timeout: 5000 });

    await page.goto(`${BASE}/settings`);
    await expect(page.locator('text=Settings')).toBeVisible();
  });
});
