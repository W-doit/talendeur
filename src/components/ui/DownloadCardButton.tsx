import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadElementAsImage } from '@/lib/download-image';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface DownloadCardButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  filename: string;
  className?: string;
  label?: string;
}

export const DownloadCardButton: React.FC<DownloadCardButtonProps> = ({
  targetRef,
  filename,
  className,
  label = 'Download',
}) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!targetRef.current || busy) return;

    setBusy(true);
    try {
      await downloadElementAsImage(targetRef.current, filename);
      toast({
        title: 'Image saved',
        description: 'Your visual was downloaded.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Download failed',
        description: 'Could not create the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={busy}
      className={cn(
        'download-exclude gap-1.5 bg-white/80 text-talendeur-navy border-talendeur-navy/30 hover:bg-talendeur-navy hover:text-white',
        className
      )}
    >
      <Download className={cn('h-3.5 w-3.5', busy && 'animate-pulse')} />
      {busy ? 'Saving…' : label}
    </Button>
  );
};
