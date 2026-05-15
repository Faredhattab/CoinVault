# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\login.spec.ts >> Login Flow - English >> should login successfully with valid credentials
- Location: tests\e2e\login.spec.ts:8:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/en/admin" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "Admin Login" [level=2] [ref=e4]
      - generic [ref=e5]: Failed to fetch
      - generic [ref=e6]:
        - text: Email
        - textbox "Email" [ref=e7]: admin@example.com
      - generic [ref=e8]:
        - text: Password
        - textbox "Password" [ref=e9]: SecurePassword123!
      - button "Login" [ref=e10]
  - button "Open Next.js Dev Tools" [ref=e16] [cursor=pointer]:
    - img [ref=e17]
  - alert [ref=e20]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Login Flow - English', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  6  |   });
  7  | 
  8  |   test('should login successfully with valid credentials', async ({ page }) => {
  9  |     await page.goto('/en/login')
  10 |     await page.fill('#email', 'admin@example.com')
  11 |     await page.fill('#password', 'SecurePassword123!')
  12 |     await page.click('button[type="submit"]')
  13 |     
> 14 |     await page.waitForURL('**/en/admin')
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  15 |     expect(page.url()).toContain('/en/admin')
  16 |   })
  17 | 
  18 |   test('should show error with invalid credentials', async ({ page }) => {
  19 |     await page.goto('/en/login')
  20 |     await page.fill('#email', 'admin@example.com')
  21 |     await page.fill('#password', 'WrongPassword123!')
  22 |     await page.click('button[type="submit"]')
  23 |     
  24 |     await expect(page.locator('text=Invalid login credentials')).toBeVisible()
  25 |   })
  26 | 
  27 |   test('should enforce rate limiting after 5 failed attempts', async ({ page }) => {
  28 |     // This test might be slow if we literally do 5 attempts, 
  29 |     // but the task requires it.
  30 |     await page.goto('/en/login')
  31 |     
  32 |     for (let i = 0; i < 5; i++) {
  33 |       await page.fill('#email', 'admin@example.com')
  34 |       await page.fill('#password', `WrongPassword${i}!`)
  35 |       await page.click('button[type="submit"]')
  36 |       // Wait for the error message to appear to ensure the attempt is processed
  37 |       await expect(page.locator('text=Invalid login credentials')).toBeVisible()
  38 |     }
  39 |     
  40 |     // 6th attempt should show rate limit error
  41 |     await page.fill('#email', 'admin@example.com')
  42 |     await page.fill('#password', 'WrongPassword6!')
  43 |     await page.click('button[type="submit"]')
  44 |     await expect(page.locator('text=Too many failed attempts')).toBeVisible()
  45 |   })
  46 | 
  47 |   test('should work on mobile viewport (360px)', async ({ page }) => {
  48 |     // The project config already handles mobile-chrome with 360px width
  49 |     await page.goto('/en/login')
  50 |     
  51 |     await expect(page.locator('form')).toBeVisible()
  52 |     await page.fill('#email', 'admin@example.com')
  53 |     await page.fill('#password', 'SecurePassword123!')
  54 |     await page.click('button[type="submit"]')
  55 |     
  56 |     await page.waitForURL('**/en/admin')
  57 |   })
  58 | })
  59 | 
```