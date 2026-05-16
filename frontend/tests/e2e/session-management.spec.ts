import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'SecurePassword123!';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('Session Management (US4)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/en/login`);
  });

  test('T077 [P] [US4] Session persistence across navigation', async ({ page, context }) => {
    // Login
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/admin/dashboard');
    expect(page.url()).toContain('/admin/dashboard');

    // Navigate to sessions page
    await page.goto(`${BASE_URL}/en/admin/sessions`);
    await page.waitForLoadState('networkidle');

    // Verify session still valid
    expect(page.url()).toContain('/admin/sessions');
    await expect(page.locator('h1')).toContainText(/sessions/i);

    // Navigate to another admin route
    await page.goto(`${BASE_URL}/en/admin/profile`);
    await page.waitForLoadState('networkidle');

    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
    expect(page.url()).toContain('/admin/');

    // Verify cookies are persisted
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
    expect(authCookie).toBeDefined();
  });

  test('T078 [P] [US4] Concurrent session limit enforcement', async ({ browser }) => {
    // Create 3 browser contexts (sessions)
    const contexts: any[] = [];
    const pages: any[] = [];

    try {
      // Login 3 times (maximum allowed)
      for (let i = 0; i < 3; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);

        await page.goto(`${BASE_URL}/en/login`);
        await page.fill('input[name="email"]', TEST_EMAIL);
        await page.fill('input[name="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
      }

      // Verify all 3 sessions are active
      for (const page of pages) {
        await page.goto(`${BASE_URL}/en/admin/sessions`);
        await page.waitForSelector('[data-testid="session-list"]', { timeout: 5000 });
        const sessionItems = await page.locator('[data-testid="session-item"]').count();
        expect(sessionItems).toBe(3);
      }

      // Try to login a 4th time (should fail)
      const fourthContext = await browser.newContext();
      const fourthPage = await fourthContext.newPage();

      await fourthPage.goto(`${BASE_URL}/en/login`);
      await fourthPage.fill('input[name="email"]', TEST_EMAIL);
      await fourthPage.fill('input[name="password"]', TEST_PASSWORD);
      await fourthPage.click('button[type="submit"]');

      // Should show error about max sessions
      await fourthPage.waitForSelector('[role="alert"]', { timeout: 5000 });
      const errorText = await fourthPage.locator('[role="alert"]').textContent();
      expect(errorText).toMatch(/maximum.*session|too many.*session/i);

      // Should not redirect to dashboard
      await fourthPage.waitForTimeout(1000);
      expect(fourthPage.url()).toContain('/login');

      await fourthContext.close();
    } finally {
      // Cleanup: close all contexts
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('T079 [P] [US4] Session revocation UI', async ({ browser }) => {
    // Create 2 browser contexts
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    try {
      // Login in first browser
      await page1.goto(`${BASE_URL}/en/login`);
      await page1.fill('input[name="email"]', TEST_EMAIL);
      await page1.fill('input[name="password"]', TEST_PASSWORD);
      await page1.click('button[type="submit"]');
      await page1.waitForURL('**/admin/dashboard');

      // Login in second browser
      await page2.goto(`${BASE_URL}/en/login`);
      await page2.fill('input[name="email"]', TEST_EMAIL);
      await page2.fill('input[name="password"]', TEST_PASSWORD);
      await page2.click('button[type="submit"]');
      await page2.waitForURL('**/admin/dashboard');

      // Navigate to sessions page in first browser
      await page1.goto(`${BASE_URL}/en/admin/sessions`);
      await page1.waitForSelector('[data-testid="session-list"]');

      // Verify we see 2 sessions
      const initialCount = await page1.locator('[data-testid="session-item"]').count();
      expect(initialCount).toBe(2);

      // Find a revoke button for a non-current session
      const revokeButtons = page1.locator('[data-testid="revoke-session-btn"]');
      const revokeButtonCount = await revokeButtons.count();
      expect(revokeButtonCount).toBeGreaterThan(0);

      // Click the first revoke button (revoke session 2)
      await revokeButtons.first().click();

      // Confirm revocation if there's a confirmation dialog
      const confirmButton = page1.locator('button:has-text("Confirm"), button:has-text("Revoke")');
      if (await confirmButton.count() > 0) {
        await confirmButton.first().click();
      }

      // Wait for the session to be removed from the list
      await page1.waitForTimeout(1000);
      const newCount = await page1.locator('[data-testid="session-item"]').count();
      expect(newCount).toBe(initialCount - 1);

      // Try to navigate in the second browser (revoked session)
      await page2.goto(`${BASE_URL}/en/admin/profile`);
      await page2.waitForTimeout(2000);

      // Should be redirected to login (session revoked)
      expect(page2.url()).toContain('/login');

    } finally {
      // Cleanup
      await context1.close();
      await context2.close();
    }
  });

  test('T079 [P] [US4] Session revocation UI - RTL Arabic', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Login
      await page.goto(`${BASE_URL}/ar/login`);
      await page.fill('input[name="email"]', TEST_EMAIL);
      await page.fill('input[name="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/ar/admin/dashboard');

      // Navigate to sessions page in Arabic
      await page.goto(`${BASE_URL}/ar/admin/sessions`);
      await page.waitForSelector('[data-testid="session-list"]');

      // Verify RTL layout
      const html = await page.locator('html').getAttribute('dir');
      expect(html).toBe('rtl');

      // Verify session list is displayed
      const sessionItems = await page.locator('[data-testid="session-item"]').count();
      expect(sessionItems).toBeGreaterThan(0);

      // Verify Arabic text is present
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/[؀-ۿ]/); // Arabic unicode range

    } finally {
      await context.close();
    }
  });
});
