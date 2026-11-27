import { expect, test } from "@playwright/test";

const EMAIL = "e2e-admin@example.com";
const PASSWORD = "e2e-password-12345";

test("anonymous is redirected to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});

test("forged cookie does not grant access", async ({ page, context }) => {
  await context.addCookies([{ name: "saloon_session", value: "forged", url: "http://localhost:3000" }]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});

test("wrong password is rejected", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel(/Lozinka/).fill("wrong-password-xx");
  await page.getByRole("button", { name: /Prijava/ }).click();
  await expect(page.locator("p.error")).toContainText("Invalid credentials");
});

test("login sets a hardened cookie, logout invalidates the session", async ({ page, context }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel(/Lozinka/).fill(PASSWORD);
  await page.getByRole("button", { name: /Prijava/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const cookie = (await context.cookies()).find((c) => c.name === "saloon_session")!;
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.sameSite).toBe("Lax");
  const token = cookie.value;

  await page.getByRole("button", { name: /Odjava/ }).click();
  await expect(page).toHaveURL(/\/login$/);

  // replaying the old token must fail server-side
  await context.addCookies([{ name: "saloon_session", value: token, url: "http://localhost:3000" }]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});
