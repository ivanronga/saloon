CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" integer,
	"detail" text DEFAULT '{}' NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"old_price_cents" integer NOT NULL,
	"new_price_cents" integer NOT NULL,
	"old_anchor_cents" integer,
	"new_anchor_cents" integer,
	"user_id" integer,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;