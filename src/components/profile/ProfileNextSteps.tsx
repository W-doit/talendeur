import React, { useEffect, useState } from 'react';
import { Briefcase, Pencil, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  PROFILE_READY_THRESHOLD,
  dismissCoachPrompt,
  getCoachPromptId,
  isCoachDismissed,
  type CoachPromptId,
  type JourneyProgress,
  type ProfileCompletion,
  type ProfileEditTab,
} from '@/lib/profile-completion';
import { cn } from '@/lib/utils';

/** Compact navy completeness meter for the profile header */
export const ProfileCompletenessMeter: React.FC<{
  completion: ProfileCompletion;
  onClick?: () => void;
  className?: string;
}> = ({ completion, onClick, className }) => {
  const label = completion.nextIncomplete
    ? `Profile ${completion.percent}% complete — next: ${completion.nextIncomplete.label}`
    : `Profile ${completion.percent}% complete`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-talendeur-navy/25 bg-white/70 px-2.5 py-1.5',
        'text-talendeur-navy hover:bg-talendeur-navy/5 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-talendeur-navy/40',
        className
      )}
    >
      <span className="text-xs font-semibold tabular-nums whitespace-nowrap">
        {completion.percent}%
      </span>
      <Progress
        value={completion.percent}
        className="h-2.5 w-20 sm:w-24 bg-talendeur-navy/15 [&>div]:bg-talendeur-navy"
      />
    </button>
  );
};

/** Slim cue while editing — no big card */
export const ProfileCompletionBanner: React.FC<{
  completion: ProfileCompletion;
  onContinue?: (tab?: ProfileEditTab) => void;
}> = ({ completion, onContinue }) => (
  <div className="mb-4 flex flex-wrap items-center gap-3">
    <ProfileCompletenessMeter
      completion={completion}
      onClick={() => onContinue?.(completion.nextIncomplete?.editTab)}
    />
    {completion.nextIncomplete && (
      <p className="text-sm text-muted-foreground">
        Suggested next: {completion.nextIncomplete.label}
        {completion.percent < PROFILE_READY_THRESHOLD
          ? ` (aim for ${PROFILE_READY_THRESHOLD}%+)`
          : ''}
      </p>
    )}
  </div>
);

interface ProfileJourneyCoachProps {
  userId: string;
  completion: ProfileCompletion;
  journey: JourneyProgress;
  onEditProfile: (tab?: ProfileEditTab) => void;
  onOpenRecommendations: () => void;
  onOpenMatches: () => void;
  /** Called when the highlighted target changes so the header can pulse a button */
  onHighlightChange?: (target: 'recommendations' | 'matches' | null) => void;
  /** True while the coach bubble is on screen */
  onVisibilityChange?: (visible: boolean) => void;
}

function coachCopy(
  promptId: CoachPromptId,
  completion: ProfileCompletion
): { message: string; cta: string; icon: 'edit' | 'recs' | 'matches' | null } {
  if (promptId === 'profile') {
    const next = completion.nextIncomplete?.label;
    return {
      message: next
        ? `Fill your profile to the max for a more personalised experience. Next up: ${next.toLowerCase()}.`
        : 'Fill your profile to the max so recommendations and matches can feel truly yours.',
      cta: next ? `Add ${next}` : 'Edit profile',
      icon: 'edit',
    };
  }
  if (promptId === 'recommendations') {
    return {
      message:
        'Nice work on your profile. Open Profile recommendations to see what to learn next — the button is just above.',
      cta: 'Review recommendations',
      icon: 'recs',
    };
  }
  if (promptId === 'matches') {
    return {
      message:
        'Ready when you are — explore Matches to find openings that fit you. Tap Matches in the row above.',
      cta: 'Explore matches',
      icon: 'matches',
    };
  }
  return {
    message:
      "You're set — keep refining your profile anytime, and revisit recommendations or matches whenever you like.",
    cta: 'Got it',
    icon: null,
  };
}

export const ProfileJourneyCoach: React.FC<ProfileJourneyCoachProps> = ({
  userId,
  completion,
  journey,
  onEditProfile,
  onOpenRecommendations,
  onOpenMatches,
  onHighlightChange,
  onVisibilityChange,
}) => {
  const promptId = getCoachPromptId(completion, journey);
  const [hidden, setHidden] = useState(() => isCoachDismissed(userId, promptId));

  useEffect(() => {
    setHidden(isCoachDismissed(userId, promptId));
  }, [userId, promptId]);

  const coachVisible = !hidden;

  useEffect(() => {
    onVisibilityChange?.(coachVisible);
    return () => onVisibilityChange?.(false);
  }, [coachVisible, onVisibilityChange]);

  const highlight: 'recommendations' | 'matches' | null =
    coachVisible && promptId === 'recommendations'
      ? 'recommendations'
      : coachVisible && promptId === 'matches'
        ? 'matches'
        : null;

  useEffect(() => {
    onHighlightChange?.(highlight);
    return () => onHighlightChange?.(null);
  }, [highlight, onHighlightChange]);

  if (hidden) return null;

  const { message, cta, icon } = coachCopy(promptId, completion);

  const dismiss = () => {
    dismissCoachPrompt(userId, promptId);
    setHidden(true);
  };

  const runAction = () => {
    if (promptId === 'profile') {
      onEditProfile(completion.nextIncomplete?.editTab);
      return;
    }
    if (promptId === 'recommendations') {
      onOpenRecommendations();
      return;
    }
    if (promptId === 'matches') {
      onOpenMatches();
      return;
    }
    dismiss();
  };

  return (
    <div
      className="fixed top-[62%] right-4 z-40 w-[min(calc(100vw-5.5rem),24rem)] -translate-y-1/2 animate-in fade-in slide-in-from-right-3 duration-300 sm:right-8"
      role="dialog"
      aria-label="Talendeur tip"
    >
      <div className="relative flex items-end gap-3">
        <img
          src="/mascothead.png"
          alt=""
          className="h-20 w-20 sm:h-[5.5rem] sm:w-[5.5rem] shrink-0 object-contain drop-shadow-md select-none"
          draggable={false}
        />
        <div className="relative min-w-0 flex-1 rounded-2xl rounded-bl-sm border border-talendeur-orange/40 bg-talendeur-orange px-3.5 py-3 shadow-lg shadow-talendeur-navy/15">
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-2 top-2 rounded-full p-0.5 text-talendeur-navy/50 hover:text-talendeur-navy hover:bg-white/30"
            aria-label="Dismiss tip"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="pr-5 text-sm text-talendeur-navy leading-snug font-medium">{message}</p>
          <Button
            size="sm"
            onClick={runAction}
            className="mt-2.5 h-8 bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
          >
            {icon === 'edit' && <Pencil className="mr-1.5 h-3.5 w-3.5" />}
            {icon === 'recs' && <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            {icon === 'matches' && <Briefcase className="mr-1.5 h-3.5 w-3.5" />}
            {cta}
          </Button>
          {/* Speech tail toward mascot */}
          <span
            className="absolute -left-1.5 bottom-5 h-3 w-3 rotate-45 border-b border-l border-talendeur-orange/40 bg-talendeur-orange"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
};
