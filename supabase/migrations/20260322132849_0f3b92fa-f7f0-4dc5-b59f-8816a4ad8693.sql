
-- Fix: monthly churn view with explicit cast
CREATE OR REPLACE VIEW public.monthly_churn AS
WITH active_last_month AS (
  SELECT COUNT(*) as count
  FROM subscriptions
  WHERE status = 'active'
    AND created_at < date_trunc('month', CURRENT_DATE)
    AND plan != 'free'
),
churned_this_month AS (
  SELECT COUNT(*) as count
  FROM subscriptions
  WHERE status IN ('canceled', 'inactive')
    AND updated_at >= date_trunc('month', CURRENT_DATE)
    AND plan != 'free'
)
SELECT
  ROUND(
    (CASE WHEN alm.count > 0
      THEN (ctm.count::numeric / alm.count) * 100
      ELSE 0
    END)::numeric, 2
  ) as churn_rate_percent,
  alm.count as base_customers,
  ctm.count as churned_customers
FROM active_last_month alm, churned_this_month ctm;

-- Fix: customer LTV view with explicit cast
CREATE OR REPLACE VIEW public.customer_ltv AS
SELECT
  s.plan,
  COUNT(*) as customers,
  CASE s.plan
    WHEN 'starter' THEN 9.90
    WHEN 'pro' THEN 24.90
    ELSE 0
  END as arpu,
  CASE s.plan
    WHEN 'starter' THEN ROUND((9.90 / 0.05)::numeric, 2)
    WHEN 'pro' THEN ROUND((24.90 / 0.03)::numeric, 2)
    ELSE 0
  END as estimated_ltv
FROM subscriptions s
WHERE s.status = 'active'
GROUP BY s.plan;
