ALTER TABLE credit_cards
  ADD COLUMN monthly_fee bigint,
  ADD COLUMN interest_rate numeric;

ALTER TABLE card_charges
  ADD COLUMN is_installment boolean NOT NULL DEFAULT false,
  ADD COLUMN total_installments integer,
  ADD COLUMN installment_amount bigint,
  ADD COLUMN interest_rate numeric;

CREATE TABLE card_charge_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  card_charge_id uuid NOT NULL REFERENCES card_charges(id) ON DELETE CASCADE,
  credit_card_id uuid NOT NULL REFERENCES credit_cards(id) ON DELETE RESTRICT,
  installment_number integer NOT NULL,
  amount bigint NOT NULL,
  due_period text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  deleted_at timestamp
);
