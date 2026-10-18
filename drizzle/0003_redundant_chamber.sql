CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(320) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(16) DEFAULT 'new' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"size" varchar(32),
	"quantity" integer NOT NULL,
	"kind" varchar(24) NOT NULL,
	"orderId" integer,
	"note" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" integer NOT NULL,
	"provider" varchar(32) NOT NULL,
	"providerPaymentId" varchar(128),
	"providerTransactionId" varchar(128),
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'BDT' NOT NULL,
	"status" varchar(24) DEFAULT 'initiated' NOT NULL,
	"rawPayload" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_providerPaymentId_unique" UNIQUE("providerPaymentId")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paymentStatus" varchar(24) DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paymentProvider" varchar(32);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paymentReference" varchar(128);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paymentUpdatedAt" timestamp;