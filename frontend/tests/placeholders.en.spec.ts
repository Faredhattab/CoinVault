import { expect, test } from "@playwright/test";

test("English public and admin placeholders render on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "CoinVault public collection shell" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  // Login to access admin page
  await page.goto("/en/login");
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'SecurePassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/en\/admin/, { timeout: 15000 });

  await expect(page.getByRole("heading", { name: "CoinVault admin shell" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});
