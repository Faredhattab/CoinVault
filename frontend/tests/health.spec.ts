import { expect, test } from "@playwright/test";

test("health screen shows aggregate and per-service labels", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/en/health");
  await expect(page.getByRole("heading", { name: "Foundation health" })).toBeVisible();
  await expect(page.getByText("Overall status")).toBeVisible();
  await expect(page.getByText("Web")).toBeVisible();
  await expect(page.getByText("Backend")).toBeVisible();
  await expect(page.getByText("Database")).toBeVisible();
  await expect(page.getByText("Authentication")).toBeVisible();
  await expect(page.getByText("Storage")).toBeVisible();
});
