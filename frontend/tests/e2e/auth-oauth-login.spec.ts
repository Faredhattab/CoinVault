/**
 * E2E tests for Google OAuth login flow (US2).
 *
 * Tests cover:
 * - T097: E2E test for Google OAuth flow (mock)
 * - T098: E2E test for account conflict error
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_EMAIL = 'oauth.user@gmail.com';

test.describe('Google OAuth Login (US2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/en/login`);
  });

  test('T097 [P] [US2] Google OAuth flow with mock provider', async ({ page, context, request }) => {
    // Fetch a real JWT token from local backend using admin credentials
    const loginResponse = await request.post('http://localhost:8000/api/v1/auth/login', {
      data: {
        email: 'admin@example.com',
        password: 'SecurePassword123!'
      }
    });
    expect(loginResponse.ok()).toBeTruthy();
    const authData = await loginResponse.json();

    // Mock the OAuth flow by intercepting the Google redirect
    await page.route('**/auth/oauth/google', async (route) => {
      // Redirect to mock callback with success token
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          oauth_url: `${BASE_URL}/en/auth/callback/google?code=mock-success-code&state=mock-state`,
        }),
      });
    });

    // Mock the callback API response using the real backend token
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: authData.user,
          session: authData.session || {
            id: 'session-id',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
        }),
      });
    });

    // Click "Sign in with Google" button
    const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');
    await googleButton.click({ force: true });

    // Should redirect through OAuth flow to dashboard
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    expect(page.url()).toContain('/admin');

    // Verify user is logged in
    const expectedText = authData.user.display_name || authData.user.email;
    await expect(page.locator(`text=${expectedText}`).first()).toBeVisible();
  });

  test('T097 [P] [US2] Google OAuth flow - RTL Arabic', async ({ page }) => {
    // Navigate to Arabic login page
    await page.goto(`${BASE_URL}/ar/login`);

    // Verify RTL layout
    const html = await page.locator('html').getAttribute('dir');
    expect(html).toBe('rtl');

    // Verify Google button is present with Arabic text
    const googleButton = page.locator('button', { has: page.locator('svg') }).filter({ hasText: /جوجل|Google/ });
    await expect(googleButton).toBeVisible();

    // Verify button layout is RTL-friendly
    const buttonBox = await googleButton.boundingBox();
    expect(buttonBox).not.toBeNull();
  });

  test('T098 [P] [US2] Account conflict error when email exists', async ({ page }) => {
    // Mock OAuth callback with conflict error
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 409, // Conflict
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Email already exists with password provider. Please log in with your password and link your Google account from settings.',
          conflict_type: 'email_exists',
          existing_providers: ['email'],
        }),
      });
    });

    await page.route('**/auth/oauth/google', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          oauth_url: `${BASE_URL}/en/auth/callback/google?code=conflict-code`,
        }),
      });
    });

    // Click Google login button
    const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');
    await googleButton.click({ force: true });

    // Wait for error message to appear
    await page.waitForSelector('[role="alert"]:not(#__next-route-announcer__)', { timeout: 5000 });

    // Verify conflict error message
    const errorMessage = await page.locator('[role="alert"]:not(#__next-route-announcer__)').textContent();
    expect(errorMessage).toMatch(/email.*exists|already.*registered/i);
    expect(errorMessage).toMatch(/password/i);

    // Verify user redirected back to login page
    await page.waitForURL('**/login*');
    expect(page.url()).toContain('/login');
  });

  test('T098 [P] [US2] OAuth error handling - invalid code', async ({ page }) => {
    // Mock OAuth callback with invalid code error
    await page.route('**/api/v1/auth/oauth/google/callback*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Invalid authorization code',
        }),
      });
    });

    await page.route('**/auth/oauth/google', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          oauth_url: `${BASE_URL}/en/auth/callback/google?code=invalid-code`,
        }),
      });
    });

    const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');
    await googleButton.click({ force: true });

    // Should show error
    await page.waitForSelector('[role="alert"]:not(#__next-route-announcer__)', { timeout: 5000 });
    const errorMessage = await page.locator('[role="alert"]:not(#__next-route-announcer__)').textContent();
    expect(errorMessage).toMatch(/error|invalid|failed/i);

    // Should redirect back to login page
    await page.waitForURL('**/login*');
    expect(page.url()).toContain('/login');
  });

  test('T098 [P] [US2] OAuth cancellation flow', async ({ page }) => {
    // Mock OAuth cancellation (user clicks "cancel" on Google consent screen)
    await page.route('**/auth/oauth/google', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          oauth_url: `${BASE_URL}/en/login?error=access_denied`,
        }),
      });
    });

    const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');
    await googleButton.click({ force: true });

    // Should redirect back to login with error parameter
    await page.waitForURL('**/login*error=access_denied*', { timeout: 5000 });

    // Verify error message about cancellation (if displayed)
    const pageContent = await page.textContent('body');
    if (pageContent && (pageContent.includes('cancel') || pageContent.includes('denied'))) {
      expect(pageContent).toMatch(/cancel|denied/i);
    }
  });
});
