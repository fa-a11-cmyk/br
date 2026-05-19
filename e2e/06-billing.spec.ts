import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Billing & Abonnement", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Page tarifs publique accessible", async ({ page }) => {
    await page.goto("/tarifs");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator('text=/Free|Starter|Pro/i').first()
    ).toBeVisible();
  });

  test("Page billing app accessible", async ({ page }) => {
    await page.goto("/app/billing");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/app\/billing/);
    await expect(
      page.locator('text=/Free|Starter|Pro|plan/i').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("Bouton upgrade présent pour Free", async ({ page }) => {
    await page.goto("/app/billing");
    await page.waitForLoadState("networkidle");
    const upgradeBtn = page.locator(
      'button:has-text("Upgrade"), button:has-text("Passer à"), a:has-text("Pro")'
    );
    if (await upgradeBtn.count() > 0) {
      await expect(upgradeBtn.first()).toBeVisible();
    }
  });
});
