import React from 'react';
import { Check, Sparkles, Briefcase, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  PROFILE_READY_THRESHOLD,
  type JourneyProgress,
  type JourneyStepId,
  type ProfileCompletion,
  type ProfileEditTab,
  getActiveJourneyStep,
} from '@/lib/profile-completion';

interface ProfileNextStepsProps {
  completion: ProfileCompletion;
  journey: JourneyProgress;
  onEditProfile: (tab?: ProfileEditTab) => void;
  onOpenRecommendations: () => void;
  onOpenMatches: () => void;
}

const steps: Array<{
  id: JourneyStepId;
  number: number;
  title: string;
  description: string;
}> = [
  {
    id: 'profile',
    number: 1,
    title: 'Complete your profile',
    description: 'Add your experience, skills and strengths so we understand you.',
  },
  {
    id: 'recommendations',
    number: 2,
    title: 'Review recommendations',
    description: 'See what to learn next and how to stay current in your field.',
  },
  {
    id: 'matches',
    number: 3,
    title: 'Explore matches',
    description: 'Find opportunities that fit your profile.',
  },
];

export const ProfileNextSteps: React.FC<ProfileNextStepsProps> = ({
  completion,
  journey,
  onEditProfile,
  onOpenRecommendations,
  onOpenMatches,
}) => {
  const active = getActiveJourneyStep(completion, journey);
  const allDone = active === null;

  const isStepDone = (id: JourneyStepId) => {
    if (id === 'profile') return completion.isReady;
    if (id === 'recommendations') return journey.recommendationsReviewed;
    return journey.matchesExplored;
  };

  const primaryAction = () => {
    if (active === 'profile') {
      onEditProfile(completion.nextIncomplete?.editTab);
      return;
    }
    if (active === 'recommendations') {
      onOpenRecommendations();
      return;
    }
    if (active === 'matches') {
      onOpenMatches();
    }
  };

  const primaryLabel =
    active === 'profile'
      ? completion.nextIncomplete
        ? `Continue: ${completion.nextIncomplete.label}`
        : 'Continue editing'
      : active === 'recommendations'
        ? 'Review recommendations'
        : active === 'matches'
          ? 'Explore matches'
          : null;

  return (
    <Card className="border-talendeur-navy/20 bg-gradient-to-br from-white to-talendeur-navy/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-talendeur-navy flex items-center justify-between gap-3 flex-wrap">
          <span>Your next steps</span>
          <span className="text-sm font-semibold tabular-nums text-talendeur-navy/80">
            Profile {completion.percent}% complete
          </span>
        </CardTitle>
        <CardDescription>
          Fill your profile so we understand your strengths. Then check recommendations for what
          to learn next. After that, explore matches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Progress
            value={completion.percent}
            className="h-2.5 [&>div]:bg-talendeur-navy"
          />
          {!completion.isReady && completion.nextIncomplete && (
            <p className="mt-2 text-sm text-muted-foreground">
              Next: add {completion.nextIncomplete.label.toLowerCase()}
              {completion.percent < PROFILE_READY_THRESHOLD
                ? ` (aim for ${PROFILE_READY_THRESHOLD}%+)`
                : ''}
            </p>
          )}
        </div>

        <ol className="space-y-3">
          {steps.map((step) => {
            const done = isStepDone(step.id);
            const isActive = active === step.id;
            return (
              <li
                key={step.id}
                className={`flex gap-3 rounded-lg border p-3 transition-colors ${
                  isActive
                    ? 'border-talendeur-navy/40 bg-talendeur-navy/5'
                    : done
                      ? 'border-green-200 bg-green-50/60'
                      : 'border-gray-200 bg-white'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {done ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-talendeur-navy text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${
                      isActive ? 'text-talendeur-navy' : done ? 'text-green-800' : 'text-gray-800'
                    }`}
                  >
                    {step.title}
                    {step.id === 'profile' && (
                      <span className="ml-2 font-normal text-muted-foreground">
                        · {completion.percent}%
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {allDone ? (
          <p className="text-sm text-talendeur-navy font-medium">
            You&apos;re set — keep refining your profile and revisit recommendations or matches
            anytime.
          </p>
        ) : (
          <Button
            onClick={primaryAction}
            className="w-full sm:w-auto bg-talendeur-navy hover:bg-talendeur-navy/90 text-white"
          >
            {active === 'profile' && <Pencil className="mr-2 h-4 w-4" />}
            {active === 'recommendations' && <Sparkles className="mr-2 h-4 w-4" />}
            {active === 'matches' && <Briefcase className="mr-2 h-4 w-4" />}
            {primaryLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/** Compact progress shown while editing an incomplete profile */
export const ProfileCompletionBanner: React.FC<{
  completion: ProfileCompletion;
}> = ({ completion }) => (
  <div className="mb-4 rounded-lg border border-talendeur-navy/20 bg-talendeur-navy/[0.03] p-4">
    <div className="flex items-center justify-between gap-2 mb-2">
      <p className="text-sm font-semibold text-talendeur-navy">
        Profile completeness
      </p>
      <span className="text-sm font-semibold tabular-nums text-talendeur-navy">
        {completion.percent}%
      </span>
    </div>
    <Progress value={completion.percent} className="h-2 [&>div]:bg-talendeur-navy" />
    {completion.nextIncomplete && (
      <p className="mt-2 text-sm text-muted-foreground">
        Suggested next: {completion.nextIncomplete.label}
      </p>
    )}
  </div>
);
