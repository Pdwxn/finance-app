CREATE TABLE "budgets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "category_id" uuid NOT NULL REFERENCES "categories"("id"),
  "period" text NOT NULL,
  "limit_amount" bigint NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

CREATE UNIQUE INDEX "idx_budgets_user_cat_period" ON "budgets" ("user_id", "category_id", "period");
