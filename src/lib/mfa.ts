import { supabase } from '@/integrations/supabase/client';

const RECOVERY_COUNT = 8;

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomRecoveryCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/** Generate and store hashed recovery codes; returns plaintext codes (show once). */
export async function createRecoveryCodes(userId: string): Promise<string[]> {
  const codes = Array.from({ length: RECOVERY_COUNT }, () => randomRecoveryCode());
  const rows = await Promise.all(
    codes.map(async (code) => ({
      user_id: userId,
      code_hash: await sha256Hex(code.replace(/-/g, '').toUpperCase()),
    }))
  );

  // Replace any previous unused/used codes for a clean set
  await supabase.from('mfa_recovery_codes').delete().eq('user_id', userId);
  const { error } = await supabase.from('mfa_recovery_codes').insert(rows);
  if (error) throw error;
  return codes;
}

/**
 * Consume a recovery code. Returns true if valid unused code was marked used.
 */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const normalized = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (normalized.length < 8) return false;
  const hash = await sha256Hex(normalized);

  const { data, error } = await supabase
    .from('mfa_recovery_codes')
    .select('id')
    .eq('user_id', userId)
    .eq('code_hash', hash)
    .is('used_at', null)
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;

  const { error: updateError } = await supabase
    .from('mfa_recovery_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id);

  return !updateError;
}

export async function getVerifiedTotpFactorId(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  const verified = data.totp.find((f) => f.status === 'verified');
  return verified?.id ?? null;
}

export async function requiresMfaChallenge(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return false;
  return data.nextLevel === 'aal2' && data.currentLevel !== data.nextLevel;
}

export async function verifyTotpCode(code: string): Promise<void> {
  const factorId = await getVerifiedTotpFactorId();
  if (!factorId) throw new Error('No authenticator enrolled');

  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) throw challenge.error;

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code: code.trim(),
  });
  if (verify.error) throw verify.error;
}

/**
 * Use a recovery code to disable MFA and continue at AAL1.
 * User should re-enroll 2FA afterward.
 */
export async function recoverWithBackupCode(userId: string, code: string): Promise<void> {
  const ok = await consumeRecoveryCode(userId, code);
  if (!ok) throw new Error('Invalid or already used recovery code');

  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;

  for (const factor of data.all) {
    await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
}
