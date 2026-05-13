import { expect, test } from "@playwright/test";

test("Arabic public and admin placeholders render right-to-left on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/ar");
  await expect(page.getByRole("heading", { name: "واجهة مجموعة CoinVault العامة" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await page.goto("/ar/admin");
  await expect(page.getByRole("heading", { name: "واجهة إدارة CoinVault" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
