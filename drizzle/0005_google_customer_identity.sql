ALTER TABLE "customers" ALTER COLUMN "passwordHash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "supabaseUserId" varchar(128);--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_supabaseUserId_unique" UNIQUE("supabaseUserId");