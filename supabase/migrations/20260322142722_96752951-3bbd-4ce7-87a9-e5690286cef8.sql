
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  status text DEFAULT 'active' CHECK (status IN ('pending','active','suspended')),
  commission_rate numeric(5,2) DEFAULT 20.00,
  commission_type text DEFAULT 'recurring' CHECK (commission_type IN ('one_time','recurring','lifetime')),
  total_clicks integer DEFAULT 0,
  total_referrals integer DEFAULT 0,
  total_conversions integer DEFAULT 0,
  total_earned_euros numeric(10,2) DEFAULT 0,
  total_paid_euros numeric(10,2) DEFAULT 0,
  payout_method text DEFAULT 'bank_transfer' CHECK (payout_method IN ('bank_transfer','paypal','stripe')),
  payout_details jsonb DEFAULT '{}',
  notes text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own affiliate" ON public.affiliates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages affiliates" ON public.affiliates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_affiliates_code ON public.affiliates(code);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  code text NOT NULL,
  ip_address text, user_agent text, referer_url text, landing_page text,
  utm_source text, utm_medium text, utm_campaign text, country text,
  converted boolean DEFAULT false, converted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates see own clicks" ON public.affiliate_clicks FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));
CREATE POLICY "Service role manages clicks" ON public.affiliate_clicks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_clicks_affiliate ON public.affiliate_clicks(affiliate_id, created_at DESC);
CREATE INDEX idx_clicks_code ON public.affiliate_clicks(code);

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  click_id uuid REFERENCES affiliate_clicks(id) ON DELETE SET NULL,
  referred_user_id uuid, referred_email text NOT NULL,
  status text DEFAULT 'registered' CHECK (status IN ('registered','converted','churned')),
  plan text, stripe_customer_id text,
  converted_at timestamptz, churned_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates see own referrals" ON public.affiliate_referrals FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));
CREATE POLICY "Service role manages referrals" ON public.affiliate_referrals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_referrals_affiliate ON public.affiliate_referrals(affiliate_id);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES affiliate_referrals(id) ON DELETE CASCADE,
  amount_euros numeric(10,2) NOT NULL, commission_rate numeric(5,2) NOT NULL,
  plan text NOT NULL, mrr_euros numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  stripe_invoice_id text, period_start date, period_end date,
  paid_at timestamptz, created_at timestamptz DEFAULT now()
);
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates see own commissions" ON public.affiliate_commissions FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));
CREATE POLICY "Service role manages commissions" ON public.affiliate_commissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_commissions_affiliate ON public.affiliate_commissions(affiliate_id, created_at DESC);
CREATE INDEX idx_commissions_status ON public.affiliate_commissions(status);

CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount_euros numeric(10,2) NOT NULL, commission_ids uuid[] NOT NULL DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  payout_method text NOT NULL, reference text, notes text,
  processed_by uuid, processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates see own payouts" ON public.affiliate_payouts FOR SELECT USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));
CREATE POLICY "Service role manages payouts" ON public.affiliate_payouts FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.generate_affiliate_code(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_profile record; v_code text; v_exists boolean;
BEGIN
  SELECT first_name, last_name INTO v_profile FROM profiles WHERE user_id = p_user_id;
  LOOP
    v_code := UPPER(COALESCE(regexp_replace(COALESCE(v_profile.first_name, 'USER'), '[^A-Za-z]', '', 'g'), 'USER')) || '-' || upper(substring(md5(random()::text), 1, 4));
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END; $$;

CREATE OR REPLACE VIEW public.affiliate_stats AS
SELECT a.id, a.user_id, a.code, a.status, a.commission_rate,
  a.total_clicks, a.total_referrals, a.total_conversions,
  a.total_earned_euros, a.total_paid_euros,
  a.total_earned_euros - a.total_paid_euros as pending_payout_euros,
  ROUND((CASE WHEN a.total_clicks > 0 THEN (a.total_referrals::numeric / a.total_clicks) * 100 ELSE 0 END)::numeric, 2) as click_to_signup_rate,
  ROUND((CASE WHEN a.total_referrals > 0 THEN (a.total_conversions::numeric / a.total_referrals) * 100 ELSE 0 END)::numeric, 2) as signup_to_paid_rate,
  COALESCE((SELECT SUM(amount_euros) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id AND ac.status IN ('pending','approved') AND ac.created_at >= date_trunc('month', CURRENT_DATE)), 0) as earnings_mtd
FROM affiliates a;

CREATE OR REPLACE VIEW public.affiliate_leaderboard AS
SELECT a.id, a.code, p.first_name, p.last_name, p.company,
  a.total_conversions, a.total_earned_euros, a.commission_rate, a.status,
  RANK() OVER (ORDER BY a.total_earned_euros DESC) as rank
FROM affiliates a JOIN profiles p ON p.user_id = a.user_id
WHERE a.status = 'active' ORDER BY a.total_earned_euros DESC;
