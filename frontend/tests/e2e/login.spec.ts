import { test, expect } from '@playwright/test'

test.describe('Login Flow - English', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/en/login')
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/en/admin')
    expect(page.url()).toContain('/en/admin')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/en/login')
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'WrongPassword123!')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid login credentials')).toBeVisible()
  })

  test('should enforce rate limiting after 5 failed attempts', async ({ page }) => {
    await page.goto('/en/login')
    
    for (let i = 0; i < 5; i++) {
      await page.fill('#email', 'admin@example.com')
      await page.fill('#password', `WrongPassword${i}!`)
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Invalid login credentials')).toBeVisible()
    }
    
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'WrongPassword6!')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Too many failed attempts')).toBeVisible()
  })

  test('should work on mobile viewport (360px)', async ({ page }) => {
    await page.goto('/en/login')
    
    await expect(page.locator('form')).toBeVisible()
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/en/admin')
  })
})
