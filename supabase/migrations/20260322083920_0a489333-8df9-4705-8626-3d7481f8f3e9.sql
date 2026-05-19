
-- rate_limits is accessed by edge functions using service_role, no RLS policy needed for authenticated users
-- But we need a policy to avoid the linter warning
CREATE POLICY "Service role manages rate limits" ON public.rate_limits
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
