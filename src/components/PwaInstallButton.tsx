import React, { useState } from 'react';
import { Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PwaInstallButtonProps {
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  /** Compact label for tight nav bars */
  compact?: boolean;
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({
  className,
  size = 'sm',
  compact = false,
}) => {
  const { canInstall, iosHint, showInstallUi, install } = usePwaInstall();
  const [helpOpen, setHelpOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!showInstallUi) return null;

  const handleClick = async () => {
    if (canInstall) {
      setBusy(true);
      try {
        await install();
      } finally {
        setBusy(false);
      }
      return;
    }
    setHelpOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={handleClick}
        disabled={busy}
        className={cn(
          'bg-white/70 text-talendeur-primary hover:bg-talendeur-primary hover:text-white border-talendeur-primary transition-colors',
          className
        )}
        aria-label="Install Talendeur app"
      >
        <Download className={cn('h-4 w-4', !compact && 'mr-2')} />
        {!compact && (busy ? 'Installing…' : 'Install app')}
      </Button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-talendeur-navy">Install Talendeur</DialogTitle>
            <DialogDescription>
              {iosHint
                ? 'On iPhone or iPad, add Talendeur to your Home Screen.'
                : 'Your browser has not offered an automatic install prompt yet. You can still install it manually:'}
            </DialogDescription>
          </DialogHeader>

          {iosHint ? (
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
              <li>
                Tap the <Share className="inline h-4 w-4 text-talendeur-primary" /> Share button in
                Safari
              </li>
              <li>
                Scroll and tap <strong>Add to Home Screen</strong>
              </li>
              <li>
                Tap <strong>Add</strong>
              </li>
            </ol>
          ) : (
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
              <li>
                Use <strong>Chrome</strong> or <strong>Edge</strong> (best support)
              </li>
              <li>
                Open the site on <strong>localhost</strong> or <strong>https</strong>
              </li>
              <li>
                Look for the install icon in the address bar, or the browser menu →{' '}
                <strong>Install Talendeur</strong> / <strong>Install app</strong>
              </li>
              <li>On Android Chrome: menu → <strong>Install app</strong> / <strong>Add to Home screen</strong></li>
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PwaInstallButton;
