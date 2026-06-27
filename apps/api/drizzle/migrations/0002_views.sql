CREATE OR REPLACE VIEW "account_balances" AS
SELECT
  a.id AS account_id,
  a.user_id,
  a.name,
  a.initial_balance
    + COALESCE((SELECT SUM(i.amount) FROM incomes i WHERE i.account_id = a.id AND i.deleted_at IS NULL), 0)
    + COALESCE((SELECT SUM(t.amount) FROM transfers t WHERE t.to_account_id = a.id AND t.deleted_at IS NULL), 0)
    - COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.account_id = a.id AND e.deleted_at IS NULL), 0)
    - COALESCE((SELECT SUM(t.amount) FROM transfers t WHERE t.from_account_id = a.id AND t.deleted_at IS NULL), 0)
  AS balance
FROM accounts a
WHERE a.deleted_at IS NULL;

CREATE OR REPLACE VIEW "category_budget_usage" AS
SELECT
  c.id AS category_id,
  c.user_id,
  c.name AS category_name,
  c.type,
  COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.category_id = c.id AND e.deleted_at IS NULL), 0)
    + COALESCE((SELECT SUM(ch.amount) FROM card_charges ch WHERE ch.category_id = c.id AND ch.deleted_at IS NULL), 0)
  AS total_spent
FROM categories c
WHERE c.deleted_at IS NULL;

CREATE OR REPLACE VIEW "credit_card_balances" AS
SELECT
  cc.id AS credit_card_id,
  cc.user_id,
  cc.name,
  cc.limit_amount,
  COALESCE((
    SELECT SUM(ch.amount)
    FROM card_charges ch
    WHERE ch.credit_card_id = cc.id
      AND ch.deleted_at IS NULL
      AND ch.is_installment = false
  ), 0)
  + COALESCE((
    SELECT SUM(ci.amount)
    FROM card_charge_installments ci
    WHERE ci.credit_card_id = cc.id
      AND ci.deleted_at IS NULL
      AND ci.due_period <= to_char(CURRENT_DATE, 'YYYY-MM')
  ), 0)
  - COALESCE((SELECT SUM(cp.amount) FROM card_payments cp WHERE cp.credit_card_id = cc.id AND cp.deleted_at IS NULL), 0)
  AS current_balance,
  cc.limit_amount
    - COALESCE((
      SELECT SUM(ch.amount)
      FROM card_charges ch
      WHERE ch.credit_card_id = cc.id
        AND ch.deleted_at IS NULL
        AND ch.is_installment = false
    ), 0)
    - COALESCE((
      SELECT SUM(ci.amount)
      FROM card_charge_installments ci
      WHERE ci.credit_card_id = cc.id
        AND ci.deleted_at IS NULL
        AND ci.due_period <= to_char(CURRENT_DATE, 'YYYY-MM')
    ), 0)
    + COALESCE((SELECT SUM(cp.amount) FROM card_payments cp WHERE cp.credit_card_id = cc.id AND cp.deleted_at IS NULL), 0)
  AS available_credit
FROM credit_cards cc
WHERE cc.deleted_at IS NULL;

CREATE OR REPLACE VIEW "debt_balances" AS
SELECT
  d.id AS debt_id,
  d.user_id,
  d.name,
  d.initial_amount,
  COALESCE((SELECT SUM(dp.amount) FROM debt_payments dp WHERE dp.debt_id = d.id AND dp.deleted_at IS NULL), 0)
  AS total_paid,
  d.initial_amount
    - COALESCE((SELECT SUM(dp.amount) FROM debt_payments dp WHERE dp.debt_id = d.id AND dp.deleted_at IS NULL), 0)
  AS remaining_balance
FROM debts d
WHERE d.deleted_at IS NULL;

CREATE OR REPLACE VIEW "goal_progress" AS
SELECT
  g.id AS goal_id,
  g.user_id,
  g.name,
  g.target_amount,
  COALESCE((SELECT SUM(gc.amount) FROM goal_contributions gc WHERE gc.goal_id = g.id AND gc.deleted_at IS NULL), 0)
  AS total_contributed,
  g.target_amount
    - COALESCE((SELECT SUM(gc.amount) FROM goal_contributions gc WHERE gc.goal_id = g.id AND gc.deleted_at IS NULL), 0)
  AS remaining,
  CASE
    WHEN g.target_amount > 0 THEN
      ROUND(
        (COALESCE((SELECT SUM(gc.amount) FROM goal_contributions gc WHERE gc.goal_id = g.id AND gc.deleted_at IS NULL), 0)::numeric
        / g.target_amount::numeric) * 100,
        2
      )
    ELSE 0
  END AS progress_percentage
FROM goals g
WHERE g.deleted_at IS NULL;
