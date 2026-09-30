ALTER TABLE "orders" ADD COLUMN "zone" varchar(16) DEFAULT 'inside' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paymentMethod" varchar(16) DEFAULT 'cod' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paidAmount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "senderNumber" varchar(32);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "trxId" varchar(64);