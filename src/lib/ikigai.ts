export type IkigaiPillar = 'love' | 'goodAt' | 'worldNeeds' | 'paidFor';

export interface IkigaiAnswers {
  love: string[];
  goodAt: string[];
  worldNeeds: string[];
  paidFor: string[];
}

export interface IkigaiIntersections {
  passion: string[]; // love ∩ goodAt
  mission: string[]; // love ∩ worldNeeds
  profession: string[]; // goodAt ∩ paidFor
  vocation: string[]; // worldNeeds ∩ paidFor
  ikigai: string[]; // approximate center: items that appear in 3+ pillars or shared themes
}

export interface IkigaiResult {
  answers: IkigaiAnswers;
  intersections: IkigaiIntersections;
  summary: string;
  generatedAt: string;
  responses?: Record<string, string>;
}

export interface IkigaiQuestion {
  id: string;
  pillar: IkigaiPillar;
  prompt: string;
  hint: string;
  placeholder: string;
}

export const IKIGAI_PILLARS: Record<
  IkigaiPillar,
  { title: string; subtitle: string; color: string; fill: string }
> = {
  love: {
    title: 'What you love',
    subtitle: 'Passion & joy',
    color: '#D1163E',
    fill: 'rgba(209, 22, 62, 0.35)',
  },
  goodAt: {
    title: "What you're good at",
    subtitle: 'Skills & strengths',
    color: '#FF9F14',
    fill: 'rgba(255, 159, 20, 0.35)',
  },
  worldNeeds: {
    title: 'What the world needs',
    subtitle: 'Contribution & impact',
    color: '#180D51',
    fill: 'rgba(24, 13, 81, 0.35)',
  },
  paidFor: {
    title: 'What you can be paid for',
    subtitle: 'Value & livelihood',
    color: '#2F9E7A',
    fill: 'rgba(47, 158, 122, 0.35)',
  },
};

export const IKIGAI_QUESTIONS: IkigaiQuestion[] = [
  {
    id: 'love-1',
    pillar: 'love',
    prompt: 'What activities make you lose track of time?',
    hint: 'Things you would do even if nobody was watching.',
    placeholder: 'e.g. Mentoring juniors, designing products, writing...',
  },
  {
    id: 'love-2',
    pillar: 'love',
    prompt: 'What topics could you talk about for hours?',
    hint: 'Subjects that energise you in conversation.',
    placeholder: 'e.g. Climate tech, education, AI ethics...',
  },
  {
    id: 'good-1',
    pillar: 'goodAt',
    prompt: 'What do people regularly ask you for help with?',
    hint: 'Skills others trust you for.',
    placeholder: 'e.g. Organising projects, analysing data, storytelling...',
  },
  {
    id: 'good-2',
    pillar: 'goodAt',
    prompt: 'What strengths show up across your work and life?',
    hint: 'Patterns in how you deliver results.',
    placeholder: 'e.g. Calm under pressure, systems thinking, empathy...',
  },
  {
    id: 'need-1',
    pillar: 'worldNeeds',
    prompt: 'What problems in the world bother you enough to want to fix them?',
    hint: 'Needs beyond your own career.',
    placeholder: 'e.g. Fair hiring, accessible healthcare, digital literacy...',
  },
  {
    id: 'need-2',
    pillar: 'worldNeeds',
    prompt: 'Where could your experience help others most?',
    hint: 'Impact you are uniquely positioned to create.',
    placeholder: 'e.g. Helping mid-career switches, building inclusive teams...',
  },
  {
    id: 'paid-1',
    pillar: 'paidFor',
    prompt: 'What skills or work have you already been paid for (or clearly could be)?',
    hint: 'Market-validated value.',
    placeholder: 'e.g. Project management, consulting, software, teaching...',
  },
  {
    id: 'paid-2',
    pillar: 'paidFor',
    prompt: 'What would people or organisations gladly pay you to deliver?',
    hint: 'Outcomes with clear demand.',
    placeholder: 'e.g. Launching products, coaching leaders, automating workflows...',
  },
];

import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'talendeur_ikigai';

function splitAnswers(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 8);
}

function normalizeToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function overlap(a: string[], b: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const itemA of a) {
    const na = normalizeToken(itemA);
    for (const itemB of b) {
      const nb = normalizeToken(itemB);
      if (!na || !nb) continue;
      const related =
        na === nb ||
        na.includes(nb) ||
        nb.includes(na) ||
        na.split(' ').some((t) => t.length > 3 && nb.includes(t)) ||
        nb.split(' ').some((t) => t.length > 3 && na.includes(t));
      if (related) {
        const key = na.length <= nb.length ? itemA : itemB;
        const fingerprint = normalizeToken(key);
        if (!seen.has(fingerprint)) {
          seen.add(fingerprint);
          out.push(key);
        }
      }
    }
  }
  return out.slice(0, 6);
}

function uniqueMerge(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const item of list) {
      const key = normalizeToken(item);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export function buildIkigaiFromResponses(
  responses: Record<string, string>
): IkigaiResult {
  const answers: IkigaiAnswers = {
    love: [],
    goodAt: [],
    worldNeeds: [],
    paidFor: [],
  };

  for (const q of IKIGAI_QUESTIONS) {
    const parts = splitAnswers(responses[q.id] || '');
    answers[q.pillar].push(...parts);
  }

  // Deduplicate within pillars
  (Object.keys(answers) as IkigaiPillar[]).forEach((pillar) => {
    answers[pillar] = uniqueMerge(answers[pillar]).slice(0, 10);
  });

  const passion = overlap(answers.love, answers.goodAt);
  const mission = overlap(answers.love, answers.worldNeeds);
  const profession = overlap(answers.goodAt, answers.paidFor);
  const vocation = overlap(answers.worldNeeds, answers.paidFor);

  // Center: themes that connect across 3+ pillars via pairwise overlaps
  const centerCandidates = uniqueMerge(passion, mission, profession, vocation);
  const ikigai = centerCandidates.filter((item) => {
    const n = normalizeToken(item);
    const hits = [answers.love, answers.goodAt, answers.worldNeeds, answers.paidFor].filter(
      (pillar) =>
        pillar.some((p) => {
          const pn = normalizeToken(p);
          return pn === n || pn.includes(n) || n.includes(pn);
        })
    ).length;
    return hits >= 3;
  });

  const intersections: IkigaiIntersections = {
    passion,
    mission,
    profession,
    vocation,
    ikigai: ikigai.length ? ikigai : centerCandidates.slice(0, 4),
  };

  const summary =
    intersections.ikigai.length > 0
      ? `Your emerging ikigai sits around: ${intersections.ikigai.slice(0, 3).join(', ')}. Lean into roles and projects where what you love, what you excel at, what matters, and what pays can meet.`
      : 'Keep exploring overlaps — add a few more concrete answers in each circle to surface a clearer centre.';

  return {
    answers,
    intersections,
    summary,
    generatedAt: new Date().toISOString(),
    responses,
  };
}

function cacheIkigaiLocal(userId: string, result: IkigaiResult): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[userId] = result;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function loadIkigaiLocal(userId: string): IkigaiResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[userId] || null;
  } catch {
    return null;
  }
}

export async function saveIkigaiResult(userId: string, result: IkigaiResult): Promise<void> {
  cacheIkigaiLocal(userId, result);
  const { error } = await supabase
    .from('profile')
    .update({ ikigai_result: result as unknown as Record<string, unknown> })
    .eq('user_id', userId);
  if (error) {
    console.error('Could not save ikigai to profile:', error);
  }
}

export async function loadIkigaiResult(userId: string): Promise<IkigaiResult | null> {
  const cached = loadIkigaiLocal(userId);
  const { data, error } = await supabase
    .from('profile')
    .select('ikigai_result')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Could not load ikigai from profile:', error);
    return cached;
  }

  const remote = data?.ikigai_result as IkigaiResult | null;
  if (remote && typeof remote === 'object' && remote.answers) {
    cacheIkigaiLocal(userId, remote);
    return remote;
  }
  return cached;
}
