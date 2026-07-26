import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { recoverWithBackupCode, verifyTotpCode } from '@/lib/mfa';
import { useAuth } from '@/contexts/AuthContext';

interface MfaChallengeProps {
  onVerified: () => void;
  onCancel?: () => void;
}

export const MfaChallenge: React.FC<MfaChallengeProps> = ({ onVerified, onCancel }) => {
  const { user, logout } = useAuth();
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (useRecovery) {
        if (!user?.id) throw new Error('Not signed in');
        await recoverWithBackupCode(user.id, code);
        onVerified();
        return;
      }
      await verifyTotpCode(code);
      onVerified();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          {useRecovery
            ? 'Enter one of your one-time recovery codes. This will disable 2FA until you set it up again.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Input
            inputMode={useRecovery ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            placeholder={useRecovery ? 'XXXX-XXXX' : '123456'}
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            required
          />
          <button
            type="button"
            className="text-xs text-talendeur-orange hover:underline"
            onClick={() => {
              setUseRecovery((v) => !v);
              setCode('');
              setError('');
            }}
          >
            {useRecovery ? 'Use authenticator code instead' : 'Use a recovery code instead'}
          </button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            type="submit"
            className="w-full bg-talendeur-primary hover:bg-talendeur-primary-dark text-white"
            disabled={submitting || !code}
          >
            {submitting ? 'Verifying…' : 'Verify'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={async () => {
              await logout();
              onCancel?.();
            }}
          >
            Cancel and sign out
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
