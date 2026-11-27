import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  nameHr: text("name_hr").notNull(),
  nameEn: text("name_en").notNull(),
  sort: integer("sort").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  nameHr: text("name_hr").notNull(),
  nameEn: text("name_en").notNull(),
  noteHr: text("note_hr").notNull().default(""),
  noteEn: text("note_en").notNull().default(""),
  qtyText: text("qty_text").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  anchorPriceCents: integer("anchor_price_cents"),
  sort: integer("sort").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
