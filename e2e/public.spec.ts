import { expect, test } from "@playwright/test";

test("HR page shows headers and Coca-Cola row", async ({ page }) => {
  await page.goto("/hr");
  await expect(page.getByRole("heading", { name: "Gazirana pića", exact: true })).toBeVisible();
  const table = page.locator("section").filter({ has: page.getByRole("heading", { name: "Gazirana pića", exact: true }) }).locator("table").first();
  for (const h of ["Artikl", "Količina", "Aktualna cijena", /Cijena \d{1,2}\.\d{1,2}\.\d{4}\./]) {
    await expect(table.getByRole("columnheader", { name: h })).toBeVisible();
  }
  const row = table.getByRole("row", { name: /Coca-Cola.*0,10 l.*1,70/ }).first();
  await expect(row).toBeVisible();
});

test("EN page is translated", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Carbonated drinks", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Item" }).first()).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /Price \d{1,2} \w{3} \d{4}/ }).first()).toBeVisible();
});

test("root redirects to HR (even for English browsers) and unknown lang 404s", async ({ browser }) => {
  const ctx = await browser.newContext({ locale: "en-GB", extraHTTPHeaders: { "Accept-Language": "en-GB,en;q=0.9" } });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/hr$/);
  expect((await page.goto("/xx"))?.status()).toBe(404);
});
