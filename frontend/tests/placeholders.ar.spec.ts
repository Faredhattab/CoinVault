import { expect, test } from "@playwright/test";

test("Arabic public and admin placeholders render right-to-left on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/ar");
  await expect(page.getByRole("heading", { name: "واجهة مجموعة CoinVault العامة" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  // Login to access admin page
  await page.goto("/ar/login");
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'SecurePassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/ar\/admin/, { timeout: 15000 });

  await expect(page.getByRole("heading", { name: "واجهة إدارة CoinVault" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
