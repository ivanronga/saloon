import { expect, test, type Page } from "@playwright/test";

const EMAIL = "e2e-admin@example.com";
const PASSWORD = "e2e-password-12345";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel(/Lozinka/).fill(PASSWORD);
  await page.getByRole("button", { name: /Prijava/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("admin can add, edit, reorder, hide and delete groups and items", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await login(page);

  // --- create a group
  await page.getByLabel(/Naziv$/).last().fill("E2E Grupa");
  await page.getByLabel(/^🇬🇧 Name$/).last().fill("E2E Group");
  await page.getByRole("button", { name: /^Dodaj \/ Add$/ }).last().click();
  const section = page.locator("section.admin-group").filter({ has: page.getByRole("heading", { name: /E2E Grupa/ }) });
  await expect(section).toBeVisible();

  // --- add two items
  for (const [hr, en, price] of [["Prvi", "First", "2,50"], ["Drugi", "Second", "3,00"]]) {
    const add = section.locator("details.new");
    await add.locator("summary").click();
    await add.getByLabel("Naziv", { exact: true }).fill(hr);
    await add.getByLabel("Name", { exact: true }).fill(en);
    await add.getByLabel(/Količina/).fill("0,25 l");
    await add.getByLabel(/Aktualna cijena/).fill(price);
    await add.getByRole("button", { name: /Dodaj \/ Add/ }).click();
    await expect(section.locator("details.item-details:not(.new)").filter({ hasText: hr })).toBeVisible();
  }

  // --- public page shows them in order, with HR + EN names
  await page.goto("/hr");
  const hrRows = page.locator("section").filter({ has: page.getByRole("heading", { name: "E2E Grupa" }) }).locator("tbody tr");
  await expect(hrRows).toHaveCount(2);
  await expect(hrRows.nth(0)).toContainText("Prvi");
  await expect(hrRows.nth(0)).toContainText("2,50");
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "E2E Group" })).toBeVisible();

  // --- reorder: move "Drugi" up
  await page.goto("/admin");
  const s2 = page.locator("section.admin-group").filter({ has: page.getByRole("heading", { name: /E2E Grupa/ }) });
  const drugi = s2.locator("details.item-details:not(.new)").filter({ hasText: "Drugi" });
  await drugi.locator("summary").click();
  await drugi.getByRole("button", { name: /Pomakni gore/ }).click();
  await page.goto("/hr");
  await expect(hrRows.nth(0)).toContainText("Drugi");

  // --- hide "Drugi": gone from public page
  await page.goto("/admin");
  const drugi2 = page.locator("section.admin-group").filter({ has: page.getByRole("heading", { name: /E2E Grupa/ }) })
    .locator("details.item-details:not(.new)").filter({ hasText: "Drugi" });
  await drugi2.locator("summary").click();
  await drugi2.getByRole("button", { name: /Sakrij/ }).click();
  await page.goto("/hr");
  await expect(hrRows).toHaveCount(1);

  // --- delete both items, then the (now empty) group
  await page.goto("/admin");
  for (const name of ["Drugi", "Prvi"]) {
    const d = page.locator("section.admin-group").filter({ has: page.getByRole("heading", { name: /E2E Grupa/ }) })
      .locator("details.item-details:not(.new)").filter({ hasText: name });
    await d.locator("summary").click();
    await d.getByRole("button", { name: /Obriši/ }).click();
    await expect(d).toHaveCount(0);
  }
  const g = page.locator("section.admin-group").filter({ has: page.getByRole("heading", { name: /E2E Grupa/ }) });
  await g.locator("details.group-tools summary").click();
  await g.getByRole("button", { name: /Obriši/ }).click();
  await expect(page.getByRole("heading", { name: /E2E Grupa/ })).toHaveCount(0);
});

test("editing an item's price on the admin page updates the public page", async ({ page }) => {
  await login(page);
  const row = page.locator("details.item-details:not(.new)").filter({ hasText: "Coca-Cola Zero Sugar" }).first();
  await row.locator("summary").click();
  const price = row.getByLabel(/Aktualna cijena/);
  const before = await price.inputValue();
  await price.fill("9,99");
  await row.getByRole("button", { name: /Spremi/ }).click();
  await expect(row.getByText(/Spremljeno/)).toBeVisible();
  await page.goto("/hr");
  await expect(page.getByRole("row", { name: /Coca-Cola Zero Sugar.*9,99/ })).toBeVisible();
  // restore
  await page.goto("/admin");
  const row2 = page.locator("details.item-details:not(.new)").filter({ hasText: "Coca-Cola Zero Sugar" }).first();
  await row2.locator("summary").click();
  await row2.getByLabel(/Aktualna cijena/).fill(before);
  await row2.getByRole("button", { name: /Spremi/ }).click();
  await expect(row2.getByText(/Spremljeno/)).toBeVisible();
});
