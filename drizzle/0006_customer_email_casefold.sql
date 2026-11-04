DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "customers"
    GROUP BY lower("email")
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Customer email normalization aborted: resolve duplicate case-insensitive customer emails before applying this migration.';
  END IF;
END $$;--> statement-breakpoint
UPDATE "customers" SET "email" = lower("email") WHERE "email" <> lower("email");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_email_lower_unique" ON "customers" USING btree (lower("email"));
