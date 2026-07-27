import { supabase } from '@/integrations/supabase/client';
import {
  loadProfileSnapshot,
  type ProfileSnapshot,
} from '@/lib/profile-gap-analysis';

export interface CareerDirection {
  title: string;
  whyNow: string;
  fitToBackground: string;
  riskIfIgnored: string;
}

export interface UpskillStep {
  action: string;
  why: string;
  profileSignal: string;
  effort: 'quick win' | 'short term' | 'longer term';
}

export interface AiLeverageMove {
  action: string;
  why: string;
  profileSignal: string;
}

export interface CareerForesightResult {
  positioningThesis: string;
  readinessScore: number;
  strategicDirections: CareerDirection[];
  upskillingRoadmap: {
    quickWins: UpskillStep[];
    threeToSixMonths: UpskillStep[];
    twelveMonths: UpskillStep[];
  };
  aiLeverageMoves: AiLeverageMove[];
  avoidChasing: string[];
  generatedAt: string;
  source: 'api' | 'local';
}

export interface CareerForesightOptions {
  industryPreference?: string;
  openToCareerSwitch?: boolean;
}

export interface ExtendedProfileSnapshot extends ProfileSnapshot {
  targetOrganizations?: string[];
  openToRelocation?: boolean;
  aiFluency?: Record<string, string | null>;
  aiTools?: Record<string, boolean | string | null>;
}

const STORAGE_KEY = 'talendeur_career_foresight';

export async function loadExtendedProfileSnapshot(
  userId: string
): Promise<ExtendedProfileSnapshot> {
  const base = await loadProfileSnapshot(userId);

  const [profileRes, aiUsageRes, aiToolsRes] = await Promise.all([
    supabase
      .from('profile')
      .select('target_organizations, open_to_relocation')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('ai_fluency_usage').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('ai_fluency_tools').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  return {
    ...base,
    targetOrganizations: profileRes.data?.target_organizations || [],
    openToRelocation: profileRes.data?.open_to_relocation ?? undefined,
    aiFluency: (aiUsageRes.data as Record<string, string | null>) || undefined,
    aiTools: (aiToolsRes.data as Record<string, boolean | string | null>) || undefined,
  };
}

function inferRoleFamily(snapshot: ExtendedProfileSnapshot): string {
  const corpus = [
    snapshot.headline || '',
    ...snapshot.work.map((w) => w.title || ''),
  ]
    .join(' ')
    .toLowerCase();

  if (/engineer|developer|software|devops|architect/.test(corpus)) return 'technology';
  if (/product|pm\b|product manager/.test(corpus)) return 'product';
  if (/data|analyst|analytics|scientist/.test(corpus)) return 'data';
  if (/design|ux|ui|creative/.test(corpus)) return 'design';
  if (/market|brand|content|seo/.test(corpus)) return 'marketing';
  if (/project|program|scrum|agile/.test(corpus)) return 'delivery';
  if (/sales|account|business development/.test(corpus)) return 'commercial';
  if (/hr|people|talent|recruit/.test(corpus)) return 'people';
  return 'general professional';
}

function aiUsageLevel(snapshot: ExtendedProfileSnapshot): 'low' | 'medium' | 'high' {
  const usage = snapshot.aiFluency;
  if (!usage) return 'low';

  const scores: Record<string, number> = {
    never: 0,
    rarely: 1,
    sometimes: 2,
    usually: 3,
    very_often: 4,
  };

  const values = Object.entries(usage)
    .filter(([k]) => !['user_id', 'id', 'created_at', 'updated_at'].includes(k))
    .map(([, v]) => scores[String(v)] ?? 0);

  if (!values.length) return 'low';
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg >= 2.5) return 'high';
  if (avg >= 1.2) return 'medium';
  return 'low';
}

function activeAiTools(snapshot: ExtendedProfileSnapshot): string[] {
  const tools = snapshot.aiTools || {};
  const names: Record<string, string> = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    github_copilot: 'GitHub Copilot',
    amazon_q: 'Amazon Q',
    google_gemini: 'Google Gemini',
  };
  const active = Object.entries(names)
    .filter(([key]) => tools[key] === true)
    .map(([, label]) => label);
  if (typeof tools.other_tools === 'string' && tools.other_tools.trim()) {
    active.push(tools.other_tools.trim());
  }
  return active;
}

export function analyzeCareerForesightLocal(
  snapshot: ExtendedProfileSnapshot,
  options: CareerForesightOptions = {}
): CareerForesightResult {
  const family = inferRoleFamily(snapshot);
  const aiLevel = aiUsageLevel(snapshot);
  const tools = activeAiTools(snapshot);
  const latestRole = snapshot.work[0]?.title || snapshot.headline || 'your current path';
  const totalYears = snapshot.work.reduce((sum, w) => {
    if (!w.start_date) return sum;
    const start = new Date(w.start_date);
    const end = w.end_date ? new Date(w.end_date) : new Date();
    if (Number.isNaN(start.getTime())) return sum;
    return sum + Math.max(0, (end.getTime() - start.getTime()) / (365.25 * 86400000));
  }, 0);

  const positioningThesis =
    aiLevel === 'high'
      ? `Your profile shows ${totalYears.toFixed(1)}+ years anchored in ${family} work with meaningful AI usage already. The edge is not “using AI” — it is combining domain judgment from ${latestRole} with repeatable AI-augmented workflows others in your field still treat as optional.`
      : aiLevel === 'medium'
        ? `You have a credible ${family} foundation (${latestRole}) but AI is not yet a visible differentiator on your profile. In the next hiring cycle, candidates who show domain depth plus documented AI leverage will outpace those with similar tenure but generic CVs.`
        : `Your experience in ${family} (${latestRole}) is the asset — but without visible AI fluency, routine parts of your role are easier for employers to automate or outsource. The priority is additive upskilling: deepen what machines cannot replace, then layer AI on top.`;

  const strategicDirections: CareerDirection[] = [
    {
      title: `AI-augmented ${family} specialist`,
      whyNow: 'Employers are splitting roles into “AI-native operators” vs “legacy process holders”.',
      fitToBackground: `Builds directly on ${latestRole} and your existing ${family} signals.`,
      riskIfIgnored: 'Peers with similar experience but stronger AI evidence will look more future-ready.',
    },
    {
      title: 'Cross-functional orchestrator',
      whyNow: 'AI compresses execution work; coordinating people, systems, and outcomes becomes scarcer.',
      fitToBackground:
        snapshot.skillRatings && (snapshot.skillRatings.soft_skills ?? 0) >= 70
          ? 'Your soft-skill ratings suggest you can translate between teams and tools.'
          : 'Strong fit if you highlight stakeholder work and end-to-end delivery in recent roles.',
      riskIfIgnored: 'Pure individual-contributor positioning gets commoditized faster in AI-heavy teams.',
    },
    {
      title: options.openToCareerSwitch
        ? 'Adjacent role pivot with AI leverage'
        : 'Deep specialist with proof-of-work portfolio',
      whyNow: options.openToCareerSwitch
        ? 'Career switches succeed when anchored in transferable domain + new AI-enabled outputs.'
        : 'Depth plus public artifacts (case studies, demos, writing) beats broad generic upskilling.',
      fitToBackground: options.industryPreference
        ? `Aligned with your stated interest in ${options.industryPreference}.`
        : snapshot.interests.length
          ? `Connects to interests such as ${snapshot.interests.slice(0, 3).join(', ')}.`
          : 'Use your headline and recent roles to pick one narrow niche to own.',
      riskIfIgnored: options.openToCareerSwitch
        ? 'Unfocused pivots read as “AI curiosity” rather than hireable capability.'
        : 'Without visible proof, seniority claims are harder to verify remotely.',
    },
  ];

  const upskillingRoadmap = {
    quickWins: [
      {
        action: 'Document 2–3 AI-assisted workflows you already use (or could use) in your day job',
        why: 'Turns hidden capability into profile evidence recruiters can scan in seconds.',
        profileSignal: `Based on ${latestRole} and current AI usage level: ${aiLevel}.`,
        effort: 'quick win' as const,
      },
      {
        action:
          aiLevel === 'low'
            ? 'Complete Talendeur AI Fluency section and add one tool you will use weekly'
            : 'Publish one before/after example showing AI improving quality or speed in your domain',
        why: 'Future-ready candidates show outcomes, not tool names alone.',
        profileSignal: tools.length ? `You already use: ${tools.join(', ')}.` : 'No AI tools listed yet.',
        effort: 'quick win' as const,
      },
    ],
    threeToSixMonths: [
      {
        action: `Build one portfolio artifact in ${family}: case study, dashboard, prototype, or client outcome`,
        why: 'Hiring managers increasingly ask “show me the work” when AI makes text CVs cheap to produce.',
        profileSignal: `${totalYears.toFixed(1)} years experience — time to make outcomes explicit.`,
        effort: 'short term' as const,
      },
      {
        action: 'Learn prompt + evaluation patterns for your domain (not generic prompt engineering)',
        why: 'The durable skill is knowing when AI output is wrong in your field.',
        profileSignal: `Role family: ${family}; focus on judgment, not hype.`,
        effort: 'short term' as const,
      },
    ],
    twelveMonths: [
      {
        action:
          family === 'technology' || family === 'data'
            ? 'Ship one automation or agent workflow that saves measurable time in a real process'
            : 'Own a cross-team initiative where you design how humans and AI divide the work',
        why: 'Long-term employability moves from task execution to system design.',
        profileSignal: `Stretch goal aligned with ${family} career trajectory.`,
        effort: 'longer term' as const,
      },
      {
        action: 'Add one credential or structured learning path that complements — not replaces — your experience',
        why: 'Credentials help when pivoting or when your profile lacks formal signals in a new area.',
        profileSignal:
          snapshot.certifications.length > 0
            ? 'You already invest in credentials — choose the next one strategically.'
            : 'No certifications yet; pick one with clear role-market signal.',
        effort: 'longer term' as const,
      },
    ],
  };

  const aiLeverageMoves: AiLeverageMove[] = [
    {
      action: `Use AI for first drafts, then apply ${family}-specific QA before anything ships externally`,
      why: 'Shows responsible AI use — a skill hiring teams increasingly test for.',
      profileSignal: `Matches ${latestRole} responsibilities.`,
    },
    {
      action:
        aiLevel === 'high'
          ? 'Turn your strongest AI workflow into a reusable template teammates can adopt'
          : 'Start with one high-frequency task (reports, research briefs, meeting follow-ups) and automate 30% of it',
      why: 'Demonstrates leverage beyond personal productivity.',
      profileSignal: `Current AI fluency: ${aiLevel}.`,
    },
    {
      action: 'Update bio/headline to name the outcome you deliver with AI, not the tools alone',
      why: 'Profiles that say “ChatGPT user” age quickly; outcome language stays relevant.',
      profileSignal: snapshot.headline || 'Headline can carry this signal immediately.',
    },
  ];

  const avoidChasing = [
    'Generic “learn to code” advice if your target market values domain expertise over engineering depth',
    'Collecting AI tool badges without tying each to a work outcome on your profile',
    'Pivoting to an unrelated trendy role without transferable evidence from your current stack',
  ];

  const readinessScore = Math.min(
    92,
    Math.round(
      (Math.min(totalYears, 8) / 8) * 30 +
        (snapshot.education.length > 0 ? 10 : 0) +
        (snapshot.certifications.length > 0 ? 10 : 0) +
        (aiLevel === 'high' ? 25 : aiLevel === 'medium' ? 15 : 5) +
        (tools.length > 0 ? 10 : 0) +
        (snapshot.bio ? 10 : 0) +
        (options.openToCareerSwitch ? 5 : 0)
    )
  );

  return {
    positioningThesis,
    readinessScore,
    strategicDirections,
    upskillingRoadmap,
    aiLeverageMoves,
    avoidChasing,
    generatedAt: new Date().toISOString(),
    source: 'local',
  };
}

function normalizeForesightResponse(data: Record<string, unknown>): CareerForesightResult {
  const roadmap = (data.upskilling_roadmap || data.upskillingRoadmap || {}) as Record<
    string,
    unknown[]
  >;

  const mapSteps = (items: unknown[]): UpskillStep[] =>
    Array.isArray(items)
      ? items.map((item) => {
          const row = item as Record<string, string>;
          return {
            action: row.action || '',
            why: row.why || '',
            profileSignal: row.profile_signal || row.profileSignal || '',
            effort: (row.effort as UpskillStep['effort']) || 'short term',
          };
        })
      : [];

  const mapDirections = (items: unknown[]): CareerDirection[] =>
    Array.isArray(items)
      ? items.map((item) => {
          const row = item as Record<string, string>;
          return {
            title: row.title || '',
            whyNow: row.why_now || row.whyNow || '',
            fitToBackground: row.fit_to_background || row.fitToBackground || '',
            riskIfIgnored: row.risk_if_ignored || row.riskIfIgnored || '',
          };
        })
      : [];

  const mapAiMoves = (items: unknown[]): AiLeverageMove[] =>
    Array.isArray(items)
      ? items.map((item) => {
          const row = item as Record<string, string>;
          return {
            action: row.action || '',
            why: row.why || '',
            profileSignal: row.profile_signal || row.profileSignal || '',
          };
        })
      : [];

  return {
    positioningThesis: String(data.positioning_thesis || data.positioningThesis || ''),
    readinessScore:
      typeof data.readiness_score === 'number'
        ? data.readiness_score
        : typeof data.readinessScore === 'number'
          ? data.readinessScore
          : 50,
    strategicDirections: mapDirections(data.strategic_directions || data.strategicDirections),
    upskillingRoadmap: {
      quickWins: mapSteps(roadmap.quick_wins || roadmap.quickWins || []),
      threeToSixMonths: mapSteps(
        roadmap.three_to_six_months || roadmap.threeToSixMonths || []
      ),
      twelveMonths: mapSteps(roadmap.twelve_months || roadmap.twelveMonths || []),
    },
    aiLeverageMoves: mapAiMoves(data.ai_leverage_moves || data.aiLeverageMoves),
    avoidChasing: Array.isArray(data.avoid_chasing || data.avoidChasing)
      ? (data.avoid_chasing || data.avoidChasing) as string[]
      : [],
    generatedAt: new Date().toISOString(),
    source: 'api',
  };
}

export async function analyzeCareerForesight(
  snapshot: ExtendedProfileSnapshot,
  options: CareerForesightOptions = {}
): Promise<CareerForesightResult> {
  const apiUrl = import.meta.env.VITE_CV_PARSER_API_URL?.replace(/\/$/, '');
  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/career-foresight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: snapshot,
          industry_preference: options.industryPreference || null,
          open_to_career_switch: options.openToCareerSwitch ?? false,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return normalizeForesightResponse(data);
      }
    } catch (err) {
      console.warn('Career foresight API unavailable, using local analysis:', err);
    }
  }

  return analyzeCareerForesightLocal(snapshot, options);
}

export function saveCareerForesight(userId: string, result: CareerForesightResult): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[userId] = result;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function loadSavedCareerForesight(userId: string): CareerForesightResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[userId] || null;
  } catch {
    return null;
  }
}
