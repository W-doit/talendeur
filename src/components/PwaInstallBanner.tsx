import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import PwaInstallButton from '@/components/PwaInstallButton';

const DISMISS_KEY = 'talendeur_pwa_banner_dismissed';

/**
 * Soft mobile install prompt — bottom of viewport, dismissible.
 * Complements the navbar Install button.
 */
export const PwaInstallBanner: React.FC = () => {
  const { showInstallUi, canInstall, iosHint } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  // Banner only when native prompt / iOS — avoid always-on desktop clutter
  if (!showInstallUi || dismissed || !(canInstall || iosHint)) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-lg rounded-xl border border-talendeur-navy/20 bg-white shadow-lg p-3 sm:p-4 flex items-start gap-3">
        <div className="rounded-lg bg-talendeur-navy/10 p-2 shrink-0">
          <Download className="h-5 w-5 text-talendeur-navy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-talendeur-navy text-sm">Install Talendeur</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canInstall
              ? 'Add the app to your home screen for quicker access on your phone.'
              : 'Add Talendeur to your Home Screen from Safari Share.'}
          </p>
          <div className="mt-2">
            <PwaInstallButton size="sm" />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          aria-label="Dismiss install prompt"
          onClick={() => {
            setDismissed(true);
            try {
              localStorage.setItem(DISMISS_KEY, '1');
            } catch {
              /* ignore */
            }
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PwaInstallBanner;
