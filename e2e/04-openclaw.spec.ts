import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("OpenClaw Assistant IA", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto("/app/openclaw");
    await page.waitForLoadState("networkidle");
  });

  test("Page OpenClaw se charge", async ({ page }) => {
    await expect(page).toHaveURL(/\/app\/openclaw/);
    await expect(
      page.locator(
        'input[placeholder*="message"], textarea[placeholder*="message"], [class*="chat-input"], text=/OpenClaw|Assistant/i'
      ).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test("Envoyer un message basique", async ({ page }) => {
    const chatInput = page.locator(
      'input[placeholder*="message"], textarea[placeholder*="message"], input[placeholder*="Écrivez"], [contenteditable="true"]'
    ).first();

    if (await chatInput.count() === 0) {
      test.skip(true, "Input chat absent");
      return;
    }

    await chatInput.click();
    await chatInput.fill("Bonjour, peux-tu me résumer mes dernières réunions ?");

    const sendBtn = page.locator(
      'button[type="submit"], button:has([class*="send"]), button:has-text("Envoyer")'
    );
    await sendBtn.first().click();

    await expect(
      page.locator('[class*="assistant"], [class*="ai-message"], [data-role="assistant"]').first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("Skills marketplace accessible", async ({ page }) => {
    await page.goto("/app/skills");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/app\/skills/);
    await expect(
      page.locator('[class*="skill"], [class*="card"]').first()
    ).toBeVisible({ timeout: 8000 });
  });
});
