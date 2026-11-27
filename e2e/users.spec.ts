import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "e2e-admin@example.com", password: "e2e-password-12345" };

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Lozinka/).fill(password);
  await page.getByRole("button", { name: /Prijava/ }).click();
}

test("admin manages users; editor is limited; last admin is protected", async ({ page, browser }) => {
  const editor = { email: `ed-${Date.now()}@example.com`, password: "editor-password-1234" };

  // --- admin creates an editor
  await login(page, ADMIN.email, ADMIN.password);
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("link", { name: /Korisnici/ }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
  const form = page.locator("form.new-group");
  await form.getByLabel("Email").fill(editor.email);
  await form.getByLabel(/Lozinka/).fill(editor.password);
  await form.getByRole("button", { name: /Dodaj/ }).click();
  const card = page.locator("article.user-card").filter({ hasText: editor.email });
  await expect(card).toBeVisible();

  // --- the last admin cannot be disabled or demoted
  const me = page.locator("article.user-card").filter({ hasText: ADMIN.email });
  await me.getByRole("button", { name: /Onemogući/ }).click();
  await expect(me.getByText(/last administrator|zadnjeg administratora/)).toHaveCount(1);
  await me.locator("select").selectOption("editor");
  await me.getByRole("button", { name: /Spremi ulogu/ }).click();
  await expect(me.getByText(/last administrator|zadnjeg administratora/)).toHaveCount(2); // one under Disable, one under Role

  // --- editor logs in: sees no Users link, and /admin/users bounces back to /admin
  const ctx = await browser.newContext();
  const ep = await ctx.newPage();
  await login(ep, editor.email, editor.password);
  await expect(ep).toHaveURL(/\/admin$/);
  await expect(ep.getByRole("link", { name: /Korisnici/ })).toHaveCount(0);
  await ep.goto("/admin/users");
  await expect(ep).toHaveURL(/\/admin$/);

  // --- editor changes own password (wrong current password is rejected first)
  await ep.goto("/admin/account");
  await ep.getByLabel(/Trenutna lozinka/).fill("not-the-right-password");
  await ep.getByLabel(/^Nova lozinka/).fill("editor-new-password-5678");
  await ep.getByLabel(/Ponovite/).fill("editor-new-password-5678");
  await ep.getByRole("button", { name: /Promijeni lozinku/ }).click();
  await expect(ep.getByRole("status")).toContainText(/nije točna|incorrect/);
  // React clears the fields after every submit, so fill them all again
  await ep.getByLabel(/Trenutna lozinka/).fill(editor.password);
  await ep.getByLabel(/^Nova lozinka/).fill("editor-new-password-5678");
  await ep.getByLabel(/Ponovite/).fill("editor-new-password-5678");
  await ep.getByRole("button", { name: /Promijeni lozinku/ }).click();
  await expect(ep.getByRole("status")).toContainText(/promijenjena|changed/);
  editor.password = "editor-new-password-5678";

  // --- admin disables the editor: their existing session stops working at once
  await card.getByRole("button", { name: /Onemogući/ }).click();
  await expect(card.getByText(/onemogućen/)).toBeVisible();
  await ep.goto("/admin");
  await expect(ep).toHaveURL(/\/login$/);
  await ep.getByLabel("Email").fill(editor.email);
  await ep.getByLabel(/Lozinka/).fill(editor.password);
  await ep.getByRole("button", { name: /Prijava/ }).click();
  await expect(ep.locator("p.error")).toContainText("Invalid credentials");

  // --- admin re-enables and resets the password; the new one works
  await card.getByRole("button", { name: /Omogući/ }).click();
  await expect(card.getByText(/onemogućen/)).toHaveCount(0);
  await card.getByPlaceholder(/Nova lozinka/).fill("admin-reset-password-9");
  await card.getByRole("button", { name: /Postavi lozinku/ }).click();
  await expect(card.getByRole("status").filter({ hasText: /postavljena|set/ })).toBeVisible();
  await login(ep, editor.email, "admin-reset-password-9");
  await expect(ep).toHaveURL(/\/admin$/);
  await ctx.close();
});
