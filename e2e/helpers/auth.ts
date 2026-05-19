import { Page } from "@playwright/test";

export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || "test-e2e@rapidomeet.io",
  password: process.env.E2E_TEST_PASSWORD || "TestPassword123!",
  firstName: "Test",
  lastName: "E2E",
};

export const TEST_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || "admin-e2e@rapidomeet.io",
  password: process.env.E2E_ADMIN_PASSWORD || "AdminPassword123!",
};

export async function login(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password
) {
  await page.goto("/connexion");
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(app|dashboard|onboarding)/, { timeout: 15000 });
}

export async function logout(page: Page) {
  await page.goto("/app/profil");
  const logoutBtn = page.locator(
    'button:has-text("Déconnexion"), button:has-text("Se déconnecter")'
  );
  if (await logoutBtn.count() > 0) {
    await logoutBtn.first().click();
    await page.waitForURL("/connexion");
  }
}

export async function cleanupTestData(page: Page) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return;

  await fetch(`${supabaseUrl}/functions/v1/e2e-cleanup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ email: TEST_USER.email }),
  }).catch(() => {});
}
