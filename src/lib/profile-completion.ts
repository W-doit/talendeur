import { supabase } from '@/integrations/supabase/client';
import type { JobSeekerProfile } from '@/contexts/AuthContext';
import { loadSavedGapAnalysis } from '@/lib/profile-gap-analysis';
import { loadSavedCareerForesight } from '@/lib/career-foresight';

export const PROFILE_READY_THRESHOLD = 70;

export type ProfileEditTab =
  | 'basic'
  | 'work'
  | 'education'
  | 'skills-profile'
  | 'ai-skills'
  | 'personality';

export interface CompletionSection {
  id: string;
  label: string;
  weight: number;
  complete: boolean;
  editTab: ProfileEditTab;
}

export interface ProfileCompletion {
  percent: number;
  sections: CompletionSection[];
  nextIncomplete: CompletionSection | null;
  isReady: boolean;
}

export type JourneyStepId = 'profile' | 'recommendations' | 'matches';

export interface JourneyProgress {
  recommendationsReviewed: boolean;
  matchesExplored: boolean;
}

const JOURNEY_KEY = 'talendeur_journey';

function filled(value: string | null | undefined): boolean {
  return Boolean(value && String(value).trim());
}

function skillsHaveValues(row: Record<string, unknown> | null): boolean {
  if (!row) return false;
  const skip = new Set(['id', 'user_id', 'created_at', 'updated_at']);
  return Object.entries(row).some(([key, value]) => {
    if (skip.has(key)) return false;
    const n = Number(value);
    return Number.isFinite(n) && n > 0;
  });
}

function aiFluencyStarted(row: Record<string, unknown> | null): boolean {
  if (!row) return false;
  const skip = new Set(['id', 'user_id', 'created_at', 'updated_at']);
  return Object.entries(row).some(([key, value]) => {
    if (skip.has(key)) return false;
    if (value === null || value === undefined || value === '') return false;
    return true;
  });
}

export async function getProfileCompletion(
  userId: string,
  profile: JobSeekerProfile
): Promise<ProfileCompletion> {
  const [workRes, eduRes, skillsRes, aiRes, personalityRes] = await Promise.all([
    supabase.from('work_experience').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('education_history').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('skills_dimensions').select('*').eq('user_id', userId).maybeSingle(),
    // ai_fluency_usage may be missing from generated types
    (supabase as any).from('ai_fluency_usage').select('*').eq('user_id', userId).maybeSingle(),
    // personality_traits may be missing from generated types
    (supabase as any)
      .from('personality_traits')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const hasName = filled(profile.name);
  const hasHeadline = filled(profile.headline);
  const hasPhoto = filled(profile.profilePic);
  const basicsComplete = hasName && hasHeadline && hasPhoto;

  const sections: CompletionSection[] = [
    {
      id: 'basics',
      label: 'Basics (name, headline, photo)',
      weight: 20,
      complete: basicsComplete,
      editTab: 'basic',
    },
    {
      id: 'bio',
      label: 'Biography',
      weight: 15,
      complete: filled(profile.bio),
      editTab: 'basic',
    },
    {
      id: 'work',
      label: 'Work experience',
      weight: 20,
      complete: (workRes.count || 0) > 0,
      editTab: 'work',
    },
    {
      id: 'education',
      label: 'Education',
      weight: 10,
      complete: (eduRes.count || 0) > 0,
      editTab: 'education',
    },
    {
      id: 'skills',
      label: 'Skills profile',
      weight: 15,
      complete: skillsHaveValues(skillsRes.data as Record<string, unknown> | null),
      editTab: 'skills-profile',
    },
    {
      id: 'ai',
      label: 'AI fluency',
      weight: 10,
      complete: aiFluencyStarted(aiRes.data as Record<string, unknown> | null),
      editTab: 'ai-skills',
    },
    {
      id: 'personality',
      label: 'Personality assessment',
      weight: 10,
      complete: Boolean(personalityRes.data),
      editTab: 'personality',
    },
  ];

  const earned = sections.reduce((sum, s) => sum + (s.complete ? s.weight : 0), 0);
  const percent = Math.round(earned);
  const nextIncomplete = sections.find((s) => !s.complete) || null;

  return {
    percent,
    sections,
    nextIncomplete,
    isReady: percent >= PROFILE_READY_THRESHOLD,
  };
}

function readJourney(userId: string): JourneyProgress {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    if (!raw) return { recommendationsReviewed: false, matchesExplored: false };
    const all = JSON.parse(raw);
    const entry = all[userId] || {};
    return {
      recommendationsReviewed: Boolean(entry.recommendationsReviewed),
      matchesExplored: Boolean(entry.matchesExplored),
    };
  } catch {
    return { recommendationsReviewed: false, matchesExplored: false };
  }
}

function writeJourney(userId: string, patch: Partial<JourneyProgress>) {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[userId] = { ...readJourney(userId), ...patch };
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function markRecommendationsReviewed(userId: string) {
  writeJourney(userId, { recommendationsReviewed: true });
}

export function markMatchesExplored(userId: string) {
  writeJourney(userId, { matchesExplored: true });
}

export function getJourneyProgress(userId: string): JourneyProgress {
  const stored = readJourney(userId);
  const hasRecs =
    stored.recommendationsReviewed ||
    Boolean(loadSavedGapAnalysis(userId)) ||
    Boolean(loadSavedCareerForesight(userId));

  let hasMatches = stored.matchesExplored;
  if (!hasMatches) {
    try {
      const raw = localStorage.getItem('talendeur_job_matches');
      if (raw) {
        const all = JSON.parse(raw);
        hasMatches = Boolean(all[userId]?.result);
      }
    } catch {
      /* ignore */
    }
  }

  return {
    recommendationsReviewed: hasRecs,
    matchesExplored: hasMatches,
  };
}

export function getActiveJourneyStep(
  completion: ProfileCompletion,
  journey: JourneyProgress
): JourneyStepId | null {
  if (!completion.isReady) return 'profile';
  if (!journey.recommendationsReviewed) return 'recommendations';
  if (!journey.matchesExplored) return 'matches';
  return null;
}
