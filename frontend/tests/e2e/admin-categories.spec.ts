import { test, expect, Page } from '@playwright/test'

const API_BASE = 'http://localhost:8000'

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

async function getAuthToken(): Promise<string> {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'SecurePassword123!' }),
  })
  const data = await response.json()
  return data.access_token
}

async function cleanupTestCategories() {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE}/api/v1/categories`)
  if (!response.ok) return

  const categories = await response.json()
  const testCats = categories.filter((c: any) => c.name_en.startsWith('Test '))

  // Delete leaves first (those with parent_uuid), then roots
  const leaves = testCats.filter((c: any) => c.parent_uuid)
  const roots = testCats.filter((c: any) => !c.parent_uuid)

  for (const cat of [...leaves, ...roots]) {
    await fetch(`${API_BASE}/api/v1/categories/${cat.uuid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }
}

test.describe('Category Management', () => {
  test.beforeEach(async ({ page }) => {
    await cleanupTestCategories()
    await page.goto('/en/login')
    await page.fill('#email', 'admin@example.com')
    await page.fill('#password', 'SecurePassword123!')
    await clickSafe(page, 'button[type="submit"]')
    await page.waitForURL(/\/en\/admin/, { timeout: 15000 })
  })

  test.afterEach(async () => {
    await cleanupTestCategories()
  })

  test('create nested hierarchy and enforce depth limit', async ({ page }) => {
    await page.goto('/en/admin/categories')
    await expect(page.locator('h1')).toHaveText(/Categor/i)

    // Create Root Category: "Test Europe"
    await page.fill('#category-name-en', 'Test Europe')
    await page.fill('#category-name-ar', 'تست أوروبا')
    await page.selectOption('#category-parent', { label: 'None' })
    await clickSafe(page, '#btn-save-category')
    await expect(page.locator('span:text-is("Test Europe")').first()).toBeVisible({ timeout: 10000 })

    // Create Level 2: "Test Netherlands" under "Test Europe"
    await page.fill('#category-name-en', 'Test Netherlands')
    await page.fill('#category-name-ar', 'تست هولندا')
    await page.selectOption('#category-parent', { label: 'Test Europe (تست أوروبا)' })
    await clickSafe(page, '#btn-save-category')
    await expect(page.locator('span:text-is("Test Netherlands")').first()).toBeVisible({ timeout: 10000 })

    // Create Level 3: "Test Coins L3" under "Test Netherlands"
    await page.fill('#category-name-en', 'Test Coins L3')
    await page.fill('#category-name-ar', 'تست عملات م3')
    await page.selectOption('#category-parent', { label: 'Test Netherlands (تست هولندا)' })
    await clickSafe(page, '#btn-save-category')
    await expect(page.locator('span:text-is("Test Coins L3")').first()).toBeVisible({ timeout: 10000 })

    // Level 4 under Level 3 should show error (depth limit = 3)
    await page.fill('#category-name-en', 'Test Level 4')
    await page.selectOption('#category-parent', { label: 'Test Coins L3 (تست عملات م3)' })
    await clickSafe(page, '#btn-save-category')
    await expect(page.locator('text=/depth.*exceed|hierarchy/i')).toBeVisible({ timeout: 10000 })

    // Delete "Test Europe" and verify removal
    page.on('dialog', dialog => dialog.accept())
    await clickSafe(page, '#btn-delete-Test-Europe')
    await expect(page.locator('#btn-delete-Test-Europe')).not.toBeVisible({ timeout: 10000 })

    // Test Netherlands should still exist (ON DELETE SET NULL)
    await expect(page.locator('span:text-is("Test Netherlands")').first()).toBeVisible({ timeout: 10000 })
  })
})
