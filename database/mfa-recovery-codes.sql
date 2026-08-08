-- One-time MFA recovery codes (hashed). Enable MFA in Supabase Dashboard:
-- Authentication → Providers / Multi-Factor → ensure TOTP is enabled (on by default for most projects).

CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_id
  ON public.mfa_recovery_codes(user_id);

ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recovery codes" ON public.mfa_recovery_codes;
CREATE POLICY "Users can view own recovery codes" ON public.mfa_recovery_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recovery codes" ON public.mfa_recovery_codes;
CREATE POLICY "Users can insert own recovery codes" ON public.mfa_recovery_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recovery codes" ON public.mfa_recovery_codes;
CREATE POLICY "Users can update own recovery codes" ON public.mfa_recovery_codes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recovery codes" ON public.mfa_recovery_codes;
CREATE POLICY "Users can delete own recovery codes" ON public.mfa_recovery_codes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
