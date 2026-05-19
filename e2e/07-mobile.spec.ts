import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.use({
  viewport: { width: 390, height: 844 },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
});

test.describe("Expérience mobile", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Dashboard responsive — pas de scroll horizontal", async ({ page }) => {
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle");

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("Navigation mobile fonctionne", async ({ page }) => {
    await page.goto("/app/dashboard");
    await page.waitForLoadState("networkidle");

    const mobileNav = page.locator(
      'button[aria-label*="menu"], button[class*="burger"], button[class*="mobile-menu"], [class*="hamburger"]'
    ).first();

    if (await mobileNav.count() > 0) {
      await mobileNav.click();
      await page.waitForTimeout(300);
      const navLinks = page.locator('nav a, [role="navigation"] a');
      await expect(navLinks.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test("Formulaire de connexion mobile", async ({ page }) => {
    await page.goto("/connexion");
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    const emailBox = await emailInput.boundingBox();
    if (emailBox) {
      expect(emailBox.width).toBeLessThan(400);
    }
  });
});
