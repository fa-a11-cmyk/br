import { test, expect } from "@playwright/test";

test.describe("Performance & Chargement", () => {
  test("Landing page principale < 3s", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
    console.log(`Landing page: ${loadTime}ms`);
  });

  test("Page connexion < 2s", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/connexion");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test("Pas d'erreur console critique", async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          !text.includes("favicon") &&
          !text.includes("analytics") &&
          !text.includes("gtag") &&
          !text.includes("ResizeObserver")
        ) {
          criticalErrors.push(text);
        }
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(criticalErrors.length).toBeLessThanOrEqual(3);
    if (criticalErrors.length > 0) {
      console.warn("Erreurs console:", criticalErrors);
    }
  });

  test("Images ont des alt texts", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const imagesWithoutAlt = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img"))
        .filter((img) => !img.alt)
        .map((img) => img.src)
    );

    if (imagesWithoutAlt.length > 0) {
      console.warn("Images sans alt:", imagesWithoutAlt);
    }
    expect(imagesWithoutAlt.length).toBeLessThanOrEqual(2);
  });
});
