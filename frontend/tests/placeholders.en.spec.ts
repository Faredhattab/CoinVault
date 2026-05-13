import { expect, test } from "@playwright/test";

test("English public and admin placeholders render on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "CoinVault public collection shell" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { name: "CoinVault admin shell" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});
