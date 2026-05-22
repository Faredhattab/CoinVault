import { test, expect, Page } from '@playwright/test'

async function clickSafe(page: Page, selectorOrLocator: string | any) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach(el => el.remove());
  });
  if (typeof selectorOrLocator === 'string') {
    await page.click(selectorOrLocator);
  } else {
    await selectorOrLocator.click();
  }
}

test.describe('Category Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Login as admin
    await page.goto('/en/login')
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'SecurePassword123!')
    await clickSafe(page, 'button[type="submit"]')
    await page.waitForURL(/\/en\/admin/, { timeout: 15000 })
  })

  test('should navigate to category manager and create nested categories', async ({ page }) => {
    await page.goto('/en/admin/categories')

    // Expect category listing/manager elements
    await expect(page.locator('h1')).toHaveText(/Categor/i)

    // Create Root Category: "Test Europe"
    await page.fill('#category-name-en', 'Test Europe')
    await page.fill('#category-name-ar', 'تست أوروبا')
    await page.selectOption('#category-parent', { label: 'None' })
    await clickSafe(page, '#btn-save-category')

    // Verify it is in the list/tree
    await expect(page.locator('span:text-is("Test Europe")')).toBeVisible({ timeout: 10000 })

    // Create Level 2: "Test Netherlands" under "Test Europe"
    await page.fill('#category-name-en', 'Test Netherlands')
    await page.fill('#category-name-ar', 'تست هولندا')
    // Wait for the dropdown option to be available
    await page.selectOption('#category-parent', { label: 'Test Europe (تست أوروبا)' })
    await clickSafe(page, '#btn-save-category')

    // Verify it is in the list/tree
    await expect(page.locator('span:text-is("Test Netherlands")')).toBeVisible({ timeout: 10000 })

    // Create Level 3: "Test Provincial Coins" under "Test Netherlands"
    await page.fill('#category-name-en', 'Test Provincial Coins')
    await page.fill('#category-name-ar', 'عملات الأقاليم')
    await page.selectOption('#category-parent', { label: 'Test Netherlands (تست هولندا)' })
    await clickSafe(page, '#btn-save-category')

    await expect(page.locator('span:text-is("Test Provincial Coins")')).toBeVisible({ timeout: 10000 })

    // Level 4 under Level 3 should show error
    await page.fill('#category-name-en', 'Test Level 4')
    await page.selectOption('#category-parent', { label: 'Test Provincial Coins (عملات الأقاليم)' })
    await clickSafe(page, '#btn-save-category')

    // Verify error notification/message appears
    await expect(page.locator('text=/depth.*exceed/i')).toBeVisible({ timeout: 10000 })

    // Delete "Test Europe" and verify "Test Netherlands" becomes root
    // Handle dialog
    page.on('dialog', dialog => dialog.accept())
    // Click delete on Test Europe
    await clickSafe(page, '#btn-delete-Test-Europe')
    await expect(page.locator('span:text-is("Test Europe")')).not.toBeVisible({ timeout: 10000 })

    // Test Netherlands should still exist (ON DELETE SET NULL)
    await expect(page.locator('span:text-is("Test Netherlands")')).toBeVisible({ timeout: 10000 })
  })
})

