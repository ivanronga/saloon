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

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  role: text("role", { enum: ["admin", "editor"] }).notNull().default("editor"),
  passwordHash: text("password_hash").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(), // sha256 of the cookie token; raw token is never stored
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  at: timestamp("at").notNull().defaultNow(),
});
