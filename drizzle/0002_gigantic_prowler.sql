CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"type" varchar(16) DEFAULT 'percent' NOT NULL,
	"value" integer NOT NULL,
	"minSubtotal" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp,
	"active" varchar(8) DEFAULT 'yes' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "couponCode" varchar(32);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount" integer DEFAULT 0 NOT NULL;