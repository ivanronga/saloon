CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_hr" text NOT NULL,
	"name_en" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"name_hr" text NOT NULL,
	"name_en" text NOT NULL,
	"note_hr" text DEFAULT '' NOT NULL,
	"note_en" text DEFAULT '' NOT NULL,
	"qty_text" text DEFAULT '' NOT NULL,
	"price_cents" integer NOT NULL,
	"anchor_price_cents" integer,
	"sort" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;