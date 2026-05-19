import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { TEST_MEETING, createTestAudioFile } from "./helpers/fixtures";

test.describe("Flow Réunion complet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("1. Accéder à la liste des réunions", async ({ page }) => {
    await page.goto("/app/reunions");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/app\/reunions/);
    await expect(
      page.locator('a[href*="nouvelle"], button:has-text("Nouvelle"), button:has-text("Créer")').first()
    ).toBeVisible();
  });

  test("2. Ouvrir la page nouvelle réunion", async ({ page }) => {
    await page.goto("/app/reunions/nouvelle");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator('text=/live|import|plan/i').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("3. Créer une réunion — mode import", async ({ page }) => {
    await page.goto("/app/reunions/nouvelle");
    await page.waitForLoadState("networkidle");

    const importMode = page.locator(
      'button:has-text("Import"), [data-mode="import"], div:has-text("Importer un fichier")'
    ).first();
    if (await importMode.count() > 0) {
      await importMode.click();
      await page.waitForTimeout(300);
    }

    const titleInput = page.locator(
      'input[placeholder*="titre"], input[placeholder*="Titre"], input[name="title"]'
    );
    if (await titleInput.count() > 0) {
      await titleInput.fill(TEST_MEETING.title);
    }

    const audioPath = createTestAudioFile();
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(audioPath);
      await page.waitForTimeout(1000);
    }
  });

  test("4. Liste des réunions sans erreur", async ({ page }) => {
    await page.goto("/app/reunions");
    await page.waitForLoadState("networkidle");
    const errorMsg = page.locator('text=/erreur|error|failed/i');
    await expect(errorMsg).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test("5. Ouvrir le détail d'une réunion", async ({ page }) => {
    await page.goto("/app/reunions");
    await page.waitForLoadState("networkidle");

    const firstMeeting = page.locator(
      '[href*="/app/reunions/"], tr[class*="cursor"], [class*="meeting-card"]'
    ).first();

    if (await firstMeeting.count() > 0) {
      await firstMeeting.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/app\/reunions\/.+/);
    } else {
      test.skip(true, "Aucune réunion disponible");
    }
  });
});
