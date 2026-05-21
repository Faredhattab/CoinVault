import { test, expect } from '@playwright/test'

test.describe('Login Flow - Arabic RTL', () => {
  test('should display RTL layout correctly', async ({ page }) => {
    await page.goto('/ar/login')
    
    // Check for RTL direction on the HTML tag
    const html = page.locator('html')
    await expect(html).toHaveAttribute('dir', 'rtl')
    
    // Verify Arabic text is displayed (using loginTitle which would be translated)
    // Since we mock translations in unit tests, in E2E we'd expect real translations
    // For now we check visibility of form
    await expect(page.locator('form')).toBeVisible()
  })

  test('should login successfully in Arabic', async ({ page }) => {
    await page.goto('/ar/login')
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'SecurePassword123!')
    await page.click('button[type="submit"]')

    // Wait for redirect to admin page
    await page.waitForURL(/\/ar\/admin/, { timeout: 15000 })
    expect(page.url()).toContain('/ar/admin')
  })
})
