import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'admin@example.com';
const TEST_PASSWORD = 'SecurePassword123!';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('T119 - Admin Role Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should allow admin user to access admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/login`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin/, { timeout: 15000 });
    expect(page.url()).toContain('/en/admin');

    // Verify dashboard content is visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h2:has-text("CoinVault Admin")')).toBeVisible();
  });

  test('should show admin navigation elements for admin users', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/en/login`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin/, { timeout: 15000 });

    // Verify sidebar navigation links are visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Check for the admin nav links
    await expect(sidebar.locator('a[href*="/admin"]').first()).toBeVisible();
    await expect(sidebar.locator('text=Dashboard')).toBeVisible();
    await expect(sidebar.locator('text=Manage active sessions')).toBeVisible();
    await expect(sidebar.locator('text=Settings')).toBeVisible();

    // Verify the logout button is present in the header
    await expect(page.locator('header').locator('button', { hasText: /logout/i })).toBeVisible();
  });

  test('should allow admin to access session management', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/en/login`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin/, { timeout: 15000 });

    // Navigate to sessions page
    await page.goto(`${BASE_URL}/en/admin/sessions`);
    await page.waitForLoadState('networkidle');

    // Verify we are on the sessions page and it loaded correctly
    expect(page.url()).toContain('/admin/sessions');
    await expect(page.locator('h1')).toContainText(/sessions/i);
  });
});

test.describe('T120 - Non-Admin Role Denial', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should show forbidden page for non-admin users', async ({ page }) => {
    // Intercept the /api/v1/auth/login endpoint to change user role to user
    await page.route('**/api/v1/auth/login', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json.user) {
        json.user.role = 'user';
      }
      await route.fulfill({
        response,
        json,
      });
    });

    // Intercept the /api/v1/auth/me endpoint to return a non-admin user
    await page.route('**/api/v1/auth/me', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.role = 'user';
      await route.fulfill({
        response,
        json,
      });
    });

    // Login with email/password normally
    await page.goto(`${BASE_URL}/en/login`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to forbidden because role is mocked as user
    await page.waitForURL('**/forbidden', { timeout: 10000 });

    // Verify the forbidden page is displayed
    expect(page.url()).toContain('/forbidden');
    await expect(page.locator('h1')).toContainText('Access Denied');
  });

  test('should display role-based error message', async ({ page }) => {
    // Intercept the /api/v1/auth/login endpoint to change user role to user
    await page.route('**/api/v1/auth/login', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json.user) {
        json.user.role = 'user';
      }
      await route.fulfill({
        response,
        json,
      });
    });

    // Intercept the /api/v1/auth/me endpoint to return a non-admin user
    await page.route('**/api/v1/auth/me', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.role = 'user';
      await route.fulfill({
        response,
        json,
      });
    });

    // Login with email/password normally
    await page.goto(`${BASE_URL}/en/login`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to forbidden because role is mocked as user
    await page.waitForURL('**/forbidden', { timeout: 10000 });

    // Verify the forbidden page shows the correct role-based error messaging
    await expect(page.locator('h1')).toContainText('Access Denied');
    await expect(page.locator('text=You do not have the required permissions')).toBeVisible();

    // Verify the "Back to Login" button is displayed
    await expect(page.locator('button', { hasText: 'Back to Login' })).toBeVisible();

    // Verify the "Go Back" button is displayed
    await expect(page.locator('button', { hasText: 'Go Back' })).toBeVisible();
  });
});
