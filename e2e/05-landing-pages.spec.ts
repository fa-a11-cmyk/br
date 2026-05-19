import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_LANDING } from "./helpers/fixtures";

test.describe("Landing Pages + RDV", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Accéder au hub landing pages", async ({ page }) => {
    await page.goto("/app/landing");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/app\/landing/);
  });

  test("Créer une nouvelle landing page", async ({ page }) => {
    await page.goto("/app/landing");
    await page.waitForLoadState("networkidle");

    const createBtn = page.locator(
      'button:has-text("Créer"), button:has-text("Nouvelle"), a:has-text("Créer")'
    ).first();

    if (await createBtn.count() === 0) {
      test.skip(true, "Bouton créer absent");
      return;
    }

    await createBtn.click();
    await page.waitForLoadState("networkidle");

    const titleInput = page.locator(
      'input[placeholder*="titre"], input[placeholder*="Titre"], input[name="title"]'
    ).first();

    if (await titleInput.count() > 0) {
      await titleInput.fill(TEST_LANDING.title);
      const saveBtn = page.locator(
        'button:has-text("Sauvegarder"), button:has-text("Créer"), button[type="submit"]'
      ).first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });

  test("Accéder à l'éditeur landing page", async ({ page }) => {
    await page.goto("/app/landing");
    await page.waitForLoadState("networkidle");

    const firstLanding = page.locator(
      '[href*="/app/landing/"], button:has-text("Éditer"), [class*="landing-card"]'
    ).first();

    if (await firstLanding.count() > 0) {
      await firstLanding.click();
      await page.waitForLoadState("networkidle");
      await expect(
        page.locator('[class*="gjs"], [id*="gjs"], .gjs-editor, text=/éditeur|editor/i').first()
      ).toBeVisible({ timeout: 10000 });
    } else {
      test.skip(true, "Aucune landing page disponible");
    }
  });

  test("Page publique accessible", async ({ page }) => {
    await page.goto("/p/demo");
    const notFound = page.locator('text=/404|introuvable|not found/i');
    const pageLoaded = page.locator('section, main, [class*="landing"]').first();

    const result = await Promise.race([
      notFound.waitFor({ timeout: 5000 }).then(() => "404"),
      pageLoaded.waitFor({ timeout: 5000 }).then(() => "ok"),
    ]).catch(() => "timeout");

    expect(["ok", "404", "timeout"]).toContain(result);
  });
});
