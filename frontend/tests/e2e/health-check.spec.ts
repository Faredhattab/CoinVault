import { expect, test } from "@playwright/test";

test("health screen shows aggregate and per-service labels", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/en/health");
  await expect(page.getByRole("heading", { name: "Foundation health" })).toBeVisible();
  await expect(page.getByText("Overall status")).toBeVisible();
  await expect(page.getByText("Web", { exact: true })).toBeVisible();
  await expect(page.getByText("Backend", { exact: true })).toBeVisible();
  await expect(page.getByText("Database", { exact: true })).toBeVisible();
  await expect(page.getByText("Authentication", { exact: true })).toBeVisible();
  await expect(page.getByText("Storage", { exact: true })).toBeVisible();
});
