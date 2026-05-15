import { test, expect } from '@playwright/test'

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing admin without auth', async ({ page }) => {
    await page.goto('/en/admin')
    await page.waitForURL('**/en/login')
    expect(page.url()).toContain('/en/login')
  })

  test('should allow access to admin after login', async ({ page }) => {
    // Login first
    await page.goto('/en/login')
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/en/admin')
    
    // Navigate away and back
    await page.goto('/en')
    await page.goto('/en/admin')
    
    // Should stay on admin page (not redirect)
    expect(page.url()).toContain('/en/admin')
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/en/login')
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/en/admin')
    
    // Refresh page
    await page.reload()
    
    // Should still be on admin page
    await page.waitForURL('**/en/admin')
    expect(page.url()).toContain('/en/admin')
  })
})
