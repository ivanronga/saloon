import { expect, it } from "vitest";
import { formatMoney } from "@/lib/money";

it("formats HR and EN", () => {
  expect(formatMoney(170, "hr").replace(/ /g, " ")).toBe("1,70 €");
  expect(formatMoney(1700, "hr").replace(/ /g, " ")).toBe("17,00 €");
  expect(formatMoney(170, "en")).toBe("€1.70");
  expect(formatMoney(null, "en")).toBe("–");
});
