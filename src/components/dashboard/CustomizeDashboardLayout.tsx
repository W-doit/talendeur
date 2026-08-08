import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  moveSection,
  normalizeDashboardLayout,
  toggleSectionVisibility,
  type DashboardSectionConfig,
} from '@/lib/dashboard-layout';
import { ArrowDown, ArrowUp, LayoutGrid, RotateCcw } from 'lucide-react';

interface CustomizeDashboardLayoutProps {
  layout: DashboardSectionConfig[];
  onSave: (layout: DashboardSectionConfig[]) => Promise<void> | void;
}

const COLUMN_LABELS = {
  left: 'Left column',
  right: 'Right column',
  full: 'Full width',
} as const;

export const CustomizeDashboardLayout: React.FC<CustomizeDashboardLayoutProps> = ({
  layout,
  onSave,
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DashboardSectionConfig[]>(() =>
    normalizeDashboardLayout(layout)
  );
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const sorted = [...draft].sort((a, b) => a.order - b.order);
    return {
      left: sorted.filter((s) => s.column === 'left'),
      right: sorted.filter((s) => s.column === 'right'),
      full: sorted.filter((s) => s.column === 'full'),
    };
  }, [draft]);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(normalizeDashboardLayout(layout));
    setOpen(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(normalizeDashboardLayout(draft));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const renderGroup = (column: keyof typeof grouped, title: string) => (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-2">
        {grouped[column].map((section) => (
          <div
            key={section.id}
            className="flex items-center gap-3 rounded-md border bg-background px-3 py-2"
          >
            <Switch
              id={`section-${section.id}`}
              checked={section.visible}
              onCheckedChange={(checked) =>
                setDraft((prev) => toggleSectionVisibility(prev, section.id, checked))
              }
            />
            <Label htmlFor={`section-${section.id}`} className="flex-1 cursor-pointer">
              {section.label}
            </Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Move ${section.label} up`}
                onClick={() => setDraft((prev) => moveSection(prev, section.id, 'up'))}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Move ${section.label} down`}
                onClick={() => setDraft((prev) => moveSection(prev, section.id, 'down'))}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-talendeur-primary text-talendeur-primary hover:bg-talendeur-primary hover:text-white"
        >
          <LayoutGrid className="h-4 w-4" />
          Customize layout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize profile layout</DialogTitle>
          <DialogDescription>
            Show, hide, and reorder dashboard sections. Hidden sections also stay off your public profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {renderGroup('left', COLUMN_LABELS.left)}
          {renderGroup('right', COLUMN_LABELS.right)}
          {renderGroup('full', COLUMN_LABELS.full)}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() => setDraft(normalizeDashboardLayout(DEFAULT_DASHBOARD_LAYOUT))}
          >
            <RotateCcw className="h-4 w-4" />
            Reset defaults
          </Button>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save layout'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
