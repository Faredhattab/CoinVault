/**
 * E2E tests for OAuth account linking flow (US2).
 *
 * Tests cover:
 * - T099: E2E test for OAuth account linking flow
 */

import { test, expect, Locator, Page } from '@playwright/test';
import { execSync } from 'child_process';

async function clickSafe(page: Page, locator: Locator) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
  });
  await locator.click();
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'SecurePassword123!';

function clearSessions() {
  try {
    execSync('python -c "from coinvault.services.supabase_client import supabase_admin; supabase_admin.table(\'sessions\').delete().neq(\'id\', \'00000000-0000-0000-0000-000000000000\').execute()"', {
      cwd: '../backend',
      stdio: 'ignore'
    });
  } catch (e) {
    console.error('Failed to clear sessions:', e);
  }
}

test.describe('OAuth Account Linking (US2)', () => {
  test.beforeAll(() => {
    clearSessions();
  });

  test.afterAll(() => {
    clearSessions();
  });

  test.beforeEach(async ({ page }) => {
    clearSessions();
    await page.context().clearCookies();
    // Login with email/password first
    await page.goto(`${BASE_URL}/en/login`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);
    // Wait for network to be idle to ensure no pending /me fetches overwrite our cache removal
    await page.waitForLoadState('networkidle');
    // Clear user cache to ensure fresh fetches on settings page
    await page.evaluate(() => sessionStorage.removeItem('coinvault_user_cache'));
  });

  test('T099 [P] [US2] Link Google account from settings', async ({ page }) => {
    let linkedProviders = ['email'];
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-id',
          email: TEST_EMAIL,
          role: 'admin',
          linked_providers: linkedProviders,
        }),
      });
    });

    // Navigate to settings page
    await page.goto(`${BASE_URL}/en/admin/settings`);

    // Mock OAuth link endpoint
    await page.route('**/api/v1/auth/link/google', async (route) => {
      if (route.request().method() === 'POST') {
        linkedProviders = ['email', 'google'];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            oauth_redirect_url: `${BASE_URL}/en/auth/callback/google?code=link-success&state=link`,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock callback endpoint
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Google account linked successfully'
        }),
      });
    });

    // Find and click "Link" button
    const linkButton = page.locator('button:has-text("Link")');
    await expect(linkButton).toBeVisible();
    await clickSafe(page, linkButton);

    // Should show success message
    await page.waitForSelector('text=/linked|connected/i', { timeout: 10000 });

    // Verify Google is now in linked providers list
    await expect(page.locator('span:text("Google") + span')).toHaveText('Linked');

    // Verify unlink button is now available
    const unlinkButton = page.locator('button:has-text("Unlink")');
    await expect(unlinkButton).toBeVisible();
  });

  test('T099 [P] [US2] Unlink Google account from settings', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    let linkedProviders = ['email', 'google'];
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-id',
          email: TEST_EMAIL,
          role: 'admin',
          linked_providers: linkedProviders,
        }),
      });
    });

    // Navigate to settings page
    await page.goto(`${BASE_URL}/en/admin/settings`);

    // Mock unlink endpoint
    await page.route('**/api/v1/auth/link/google', async (route) => {
      if (route.request().method() === 'DELETE') {
        linkedProviders = ['email'];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-id',
            email: TEST_EMAIL,
            linked_providers: ['email'],
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Find and click "Unlink" button
    const unlinkButton = page.locator('button:has-text("Unlink")');
    await expect(unlinkButton).toBeVisible();

    // Accept the browser's confirm() dialog
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    await clickSafe(page, unlinkButton);

    // Should show success message
    await page.waitForSelector('text=/unlinked|disconnected/i', { timeout: 5000 });

    // Verify Google is removed from linked providers
    await expect(page.locator('span:text("Google") + span')).toHaveText('Not linked');

    // Verify link button is available again
    const linkButton = page.locator('button:has-text("Link")');
    await expect(linkButton).toBeVisible();
  });

  test('T099 [P] [US2] Cannot unlink last provider', async ({ page }) => {
    // Mock user has only Google provider
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-id',
          email: TEST_EMAIL,
          role: 'admin',
          linked_providers: ['google'],
        }),
      });
    });

    // Navigate to settings
    await page.goto(`${BASE_URL}/en/admin/settings`);

    // Mock unlink endpoint to return error
    await page.route('**/api/v1/auth/link/google', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Cannot unlink last authentication provider',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Try to unlink
    const unlinkButton = page.locator('button:has-text("Unlink")');
    await expect(unlinkButton).toBeVisible();

    // Accept the browser's confirm() dialog
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    await clickSafe(page, unlinkButton);

    // Should show error message
    await page.waitForSelector('[role="alert"]:not(#__next-route-announcer__)', { timeout: 5000 });
    const errorMessage = await page.locator('[role="alert"]:not(#__next-route-announcer__)').textContent();
    expect(errorMessage).toMatch(/cannot.*unlink|last.*provider|at least one/i);

    // Google should still be linked
    await expect(page.locator('span:text("Google") + span')).toHaveText('Linked');
  });

  test('T099 [P] [US2] Account linking - Arabic RTL', async ({ page }) => {
    // Navigate to Arabic settings
    await page.goto(`${BASE_URL}/ar/admin/settings`);

    // Verify RTL layout
    const html = await page.locator('html').getAttribute('dir');
    expect(html).toBe('rtl');

    // Verify settings page has Arabic text
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/[؀-ۿ]/); // Arabic unicode range

    // Verify linked providers section exists
    const providersSection = page.locator('text=/حسابات|موفري|Providers/i');
    await expect(providersSection).toBeVisible();
  });

  test('T099 [P] [US2] Link account after conflict resolution', async ({ page }) => {
    // Simulate scenario where user first tried OAuth login, got conflict,
    // then logged in with password and is now linking from settings
    let linkedProviders = ['email'];
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-id',
          email: TEST_EMAIL,
          role: 'admin',
          linked_providers: linkedProviders,
        }),
      });
    });

    await page.goto(`${BASE_URL}/en/admin/settings`);

    // Mock link endpoint success
    await page.route('**/api/v1/auth/link/google', async (route) => {
      if (route.request().method() === 'POST') {
        linkedProviders = ['email', 'google'];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            oauth_redirect_url: `${BASE_URL}/en/auth/callback/google?code=link-after-conflict&state=link`,
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock callback endpoint
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Google account linked successfully'
        }),
      });
    });

    // Click link button
    const linkButton = page.locator('button:has-text("Link")');
    await expect(linkButton).toBeVisible();
    await clickSafe(page, linkButton);

    // Should show success message
    await page.waitForSelector('text=/linked|connected/i', { timeout: 10000 });

    // Now user can log in with either email/password OR Google
    await expect(page.locator('span:text("Google") + span')).toHaveText('Linked');
  });
});
