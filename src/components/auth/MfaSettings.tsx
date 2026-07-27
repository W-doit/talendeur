import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createRecoveryCodes, getVerifiedTotpFactorId } from '@/lib/mfa';
import { useToast } from '@/components/ui/use-toast';
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react';

export const MfaSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refreshStatus = useCallback(async () => {
    try {
      const id = await getVerifiedTotpFactorId();
      setEnabled(!!id);
    } catch (err) {
      console.error('MFA status error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const startEnroll = async () => {
    setError('');
    setRecoveryCodes(null);
    setBusy(true);
    try {
      // Remove unverified leftover factors
      const listed = await supabase.auth.mfa.listFactors();
      if (!listed.error) {
        for (const f of listed.data.all.filter((x) => x.status !== 'verified')) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Talendeur Authenticator',
      });
      if (enrollError) throw enrollError;

      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(true);
    } catch (err: any) {
      setError(err.message || 'Could not start 2FA setup');
      toast({
        title: '2FA setup failed',
        description:
          err.message ||
          'Enable TOTP MFA in the Supabase Dashboard (Authentication → Multi-Factor) if it is turned off.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async () => {
    setError('');
    setBusy(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode.trim(),
      });
      if (verify.error) throw verify.error;

      let codes: string[] = [];
      if (user?.id) {
        try {
          codes = await createRecoveryCodes(user.id);
        } catch (codeErr) {
          console.warn('Recovery codes table missing or failed:', codeErr);
        }
      }

      setRecoveryCodes(codes.length ? codes : null);
      setEnrolling(false);
      setVerifyCode('');
      setQr('');
      setSecret('');
      setEnabled(true);
      toast({
        title: '2FA enabled',
        description: 'You will be asked for an authenticator code on your next login.',
      });
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  const disableMfa = async () => {
    setError('');
    setBusy(true);
    try {
      const listed = await supabase.auth.mfa.listFactors();
      if (listed.error) throw listed.error;
      for (const factor of listed.data.all) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      if (user?.id) {
        await supabase.from('mfa_recovery_codes').delete().eq('user_id', user.id);
      }
      setEnabled(false);
      setRecoveryCodes(null);
      toast({ title: '2FA disabled' });
    } catch (err: any) {
      setError(err.message || 'Could not disable 2FA');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-factor authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="animate-pulse text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {enabled ? (
            <ShieldCheck className="h-5 w-5 text-talendeur-primary" />
          ) : (
            <Shield className="h-5 w-5" />
          )}
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          Protect your account with an authenticator app (Google Authenticator, 1Password, Authy, etc.).
          MFA is managed by Supabase Auth — enable TOTP in the Supabase Dashboard if enrollment fails.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!enrolling && !enabled && (
          <Button type="button" onClick={startEnroll} disabled={busy}>
            Enable 2FA
          </Button>
        )}

        {!enrolling && enabled && (
          <div className="space-y-3">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              2FA is enabled on your account.
            </p>
            <Button type="button" variant="outline" onClick={disableMfa} disabled={busy}>
              <ShieldOff className="h-4 w-4 mr-2" />
              Disable 2FA
            </Button>
          </div>
        )}

        {enrolling && (
          <div className="space-y-4">
            <p className="text-sm">Scan this QR code with your authenticator app:</p>
            {qr && <img src={qr} alt="2FA QR code" className="mx-auto w-48 h-48 border rounded-md bg-white p-2" />}
            {secret && (
              <p className="text-xs text-muted-foreground break-all">
                Or enter this secret manually: <span className="font-mono">{secret}</span>
              </p>
            )}
            <div>
              <label className="text-sm font-medium">Verification code</label>
              <Input
                className="mt-1"
                inputMode="numeric"
                placeholder="123456"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.trim())}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={confirmEnroll} disabled={busy || verifyCode.length < 6}>
                Confirm & enable
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  if (factorId) await supabase.auth.mfa.unenroll({ factorId });
                  setEnrolling(false);
                  setFactorId('');
                  setQr('');
                  setSecret('');
                  setVerifyCode('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {recoveryCodes && recoveryCodes.length > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-900">Save these recovery codes now</p>
            <p className="text-xs text-amber-800">
              Each code works once. Store them somewhere safe — they will not be shown again.
            </p>
            <ul className="grid grid-cols-2 gap-1 font-mono text-sm">
              {recoveryCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(recoveryCodes.join('\n'));
                toast({ title: 'Recovery codes copied' });
              }}
            >
              Copy codes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
