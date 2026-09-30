CREATE TYPE "public"."product_status" AS ENUM('In stock', 'Low stock', 'Out of stock');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(320) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"phone" varchar(32),
	"address" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer NOT NULL,
	"items" text NOT NULL,
	"subtotal" integer NOT NULL,
	"delivery" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"status" varchar(32) DEFAULT 'Pending' NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(32),
	"address" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"family" text NOT NULL,
	"notes" text NOT NULL,
	"price" integer NOT NULL,
	"sizes" text NOT NULL,
	"sizePrices" text,
	"sizeStocks" text,
	"audience" varchar(16) DEFAULT 'Unisex' NOT NULL,
	"vibe" text,
	"type" text,
	"premiumName" text,
	"premiumPrice" integer,
	"premiumStock" integer DEFAULT 0 NOT NULL,
	"image" text NOT NULL,
	"badge" text,
	"tone" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"status" "product_status" DEFAULT 'In stock' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
