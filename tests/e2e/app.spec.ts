import { test, expect } from "../../playwright-fixture";

test.describe("RapidoMeet - Auth Flow", () => {
  test("landing page loads correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page).toHaveTitle(/RapidoMeet/);
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("signup page is accessible", async ({ page }) => {
    await page.goto("/inscription");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/app/dashboard");
    await page.waitForURL(/connexion/);
    await expect(page.url()).toContain("connexion");
  });

  test("login form validates inputs", async ({ page }) => {
    await page.goto("/connexion");
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(page.url()).toContain("connexion");
    }
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/connexion");
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "WrongPass123!");
    await page.click('button[type="submit"]');
    // Should stay on login page or show error
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("connexion");
  });
});

test.describe("RapidoMeet - Public Pages", () => {
  const publicRoutes = [
    { path: "/tarifs", label: "Pricing" },
    { path: "/fonctionnalites", label: "Features" },
    { path: "/docs", label: "Docs" },
    { path: "/blog", label: "Blog" },
    { path: "/a-propos", label: "About" },
    { path: "/demo", label: "Demo" },
    { path: "/securite", label: "Security" },
    { path: "/changelog", label: "Changelog" },
    { path: "/faq", label: "FAQ" },
  ];

  for (const route of publicRoutes) {
    test(`${route.label} page loads at ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
    });
  }

  test("404 page displays for unknown routes", async ({ page }) => {
    await page.goto("/unknown-route-xyz");
    await expect(page.locator("text=404").first()).toBeVisible();
  });

  test("shared report with invalid token shows error", async ({ page }) => {
    await page.goto("/rapport/invalid-token-test");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator("text=invalide").or(page.locator("text=expiré")).or(page.locator("text=introuvable")).or(page.locator("text=Erreur"))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("RapidoMeet - Navigation", () => {
  test("navbar links are visible", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });

  test("footer is present on landing", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});

test.describe("RapidoMeet - Responsive", () => {
  test("landing page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("pricing page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/tarifs");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("login page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/connexion");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("demo page renders on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/demo");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });
});
