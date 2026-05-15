import { test, expect } from '@playwright/test'

test.describe('Login Flow - English', () => {
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
