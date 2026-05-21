import { test, expect } from '@playwright/test'
import { execSync } from 'child_process'

function clearAuditLog() {
  try {
    execSync('python -c "from coinvault.services.supabase_client import supabase_admin; supabase_admin.table(\'auth_audit_log\').delete().neq(\'id\', \'00000000-0000-0000-0000-000000000000\').execute()"', {
      cwd: '../backend',
      stdio: 'ignore'
    });
  } catch (e) {
    console.error('Failed to clear audit log:', e);
  }
}

test.describe('Login Flow - English', () => {
  test.beforeAll(async () => {
    clearAuditLog();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/en/login')
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'SecurePassword123!')
    await page.click('button[type="submit"]')

    // Wait for either admin page OR check if we're redirected
    await page.waitForURL(/\/(en|ar)\/(admin|login)/, { timeout: 15000 })

    // Verify we reached the admin page
    await expect(page).toHaveURL(/\/en\/admin/, { timeout: 5000 })
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/en/login')
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // Look for error message with more flexible selector
    await expect(page.locator('text=/Invalid.*credentials/i')).toBeVisible({ timeout: 10000 })
  })

  test('should enforce rate limiting after 5 failed attempts', async ({ page }) => {
    clearAuditLog()
    await page.goto('/en/login')

    for (let i = 0; i < 5; i++) {
      await page.fill('#email', 'admin@example.com')
      await page.fill('#password', `WrongPassword${i}!`)
      await page.click('button[type="submit"]')
      await expect(page.locator('text=/Invalid.*credentials/i')).toBeVisible({ timeout: 10000 })
      // Wait a bit between attempts
      await page.waitForTimeout(500)
    }

    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'WrongPassword6!')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/Too many.*attempts/i')).toBeVisible({ timeout: 10000 })

    clearAuditLog()
  })

  test('should work on mobile viewport (360px)', async ({ page }) => {
    await page.goto('/en/login')

    await expect(page.locator('form')).toBeVisible()
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'SecurePassword123!')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/en\/admin/, { timeout: 15000 })
  })
})
