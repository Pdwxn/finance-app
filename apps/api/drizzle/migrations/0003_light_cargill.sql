CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"period" text NOT NULL,
	"limit_amount" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "card_charge_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_charge_id" uuid NOT NULL,
	"credit_card_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"amount" bigint NOT NULL,
	"due_period" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "financial_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "card_charges" ADD COLUMN "is_installment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "card_charges" ADD COLUMN "total_installments" integer;--> statement-breakpoint
ALTER TABLE "card_charges" ADD COLUMN "installment_amount" bigint;--> statement-breakpoint
ALTER TABLE "card_charges" ADD COLUMN "interest_rate" numeric;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD COLUMN "monthly_fee" bigint;--> statement-breakpoint
ALTER TABLE "credit_cards" ADD COLUMN "interest_rate" numeric;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD COLUMN "account_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_charge_installments" ADD CONSTRAINT "card_charge_installments_card_charge_id_card_charges_id_fk" FOREIGN KEY ("card_charge_id") REFERENCES "public"."card_charges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_charge_installments" ADD CONSTRAINT "card_charge_installments_credit_card_id_credit_cards_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_budgets_user_cat_period" ON "budgets" USING btree ("user_id","category_id","period");--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;