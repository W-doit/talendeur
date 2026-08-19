import { supabase } from '@/integrations/supabase/client';

export interface ProfileSnapshot {
  name: string;
  headline?: string;
  bio?: string;
  interests: string[];
  work: Array<{
    title: string | null;
    company: string | null;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
  }>;
  education: Array<{
    institution: string | null;
    qualification_type: string | null;
    subject: string | null;
  }>;
  certifications: Array<{
    course_name: string | null;
    certification_type: string | null;
  }>;
  languages: Array<{
    language: string | null;
    proficiency: string | null;
  }>;
  skillsDimensions: Record<string, number | null>;
  skillRatings: {
    soft_skills: number | null;
    hard_skills: number | null;
    learning_score: number | null;
  } | null;
}

export interface GapItem {
  area: 'skills' | 'experience' | 'education' | 'certifications' | 'languages' | 'other';
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

export interface GapRecommendation {
  action: string;
  why: string;
  effort: 'quick win' | 'short term' | 'longer term';
}

export interface GapAnalysisResult {
  targetRole: string;
  targetOrganization?: string;
  summary: string;
  matchScore: number;
  strengths: string[];
  gaps: GapItem[];
  recommendations: GapRecommendation[];
  generatedAt: string;
  source: 'api' | 'local';
}

const STORAGE_KEY = 'talendeur_profile_recommendations';

const ROLE_SKILL_HINTS: Record<string, string[]> = {
  'project manager': [
    'project management',
    'agile',
    'scrum',
    'stakeholder management',
    'risk management',
    'budgeting',
    'jira',
    'roadmapping',
  ],
  'product manager': [
    'product strategy',
    'roadmap',
    'user research',
    'prioritization',
    'analytics',
    'stakeholder management',
    'agile',
  ],
  'software engineer': [
    'software development',
    'system design',
    'testing',
    'ci/cd',
    'git',
    'apis',
    'debugging',
  ],
  'data analyst': [
    'sql',
    'data visualization',
    'statistics',
    'excel',
    'python',
    'dashboards',
    'reporting',
  ],
  'data scientist': [
    'machine learning',
    'python',
    'statistics',
    'sql',
    'experimentation',
    'model evaluation',
  ],
  'designer': [
    'ui design',
    'ux research',
    'figma',
    'prototyping',
    'design systems',
    'accessibility',
  ],
  'marketing': [
    'campaigns',
    'content',
    'seo',
    'analytics',
    'branding',
    'social media',
  ],
  'sales': [
    'crm',
    'negotiation',
    'pipeline management',
    'prospecting',
    'account management',
  ],
  default: [
    'leadership',
    'communication',
    'problem solving',
    'collaboration',
    'domain expertise',
  ],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function yearsFromDates(start: string | null, end: string | null): number {
  if (!start) return 0;
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  return Math.max(0, (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function pickRoleHints(targetRole: string): string[] {
  const role = normalize(targetRole);
  for (const [key, hints] of Object.entries(ROLE_SKILL_HINTS)) {
    if (key !== 'default' && role.includes(key)) return hints;
  }
  return ROLE_SKILL_HINTS.default;
}

export async function loadProfileSnapshot(userId: string): Promise<ProfileSnapshot> {
  const [
    profileRes,
    workRes,
    eduRes,
    certRes,
    langRes,
    dimsRes,
    ratingsRes,
  ] = await Promise.all([
    supabase
      .from('profile')
      .select('first_name, surname, headline, bio')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('work_experience')
      .select('job_title, company, start_date, end_date')
      .eq('user_id', userId),
    supabase
      .from('education_history')
      .select('institution, qualification_type, subject')
      .eq('user_id', userId),
    supabase.from('certifications').select('course_name, certification_type').eq('user_id', userId),
    // languages table added in profile-fields migration; may be missing from generated types
    (supabase as any).from('languages').select('language, proficiency').eq('user_id', userId),
    supabase.from('skills_dimensions').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('jobseeker_skill_rating').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const dims = dimsRes.data || {};
  const { user_id: _uid, ...skillDims } = dims as Record<string, unknown>;
  const profile = profileRes.data;
  const name = profile
    ? `${profile.first_name || ''} ${profile.surname || ''}`.trim()
    : '';

  return {
    name,
    headline: (profile as { headline?: string } | null)?.headline || undefined,
    bio: profile?.bio || undefined,
    interests: ratingsRes.data?.interests || [],
    work: (workRes.data || []).map((w) => ({
      title: w.job_title,
      company: w.company,
      description: null,
      start_date: w.start_date,
      end_date: w.end_date,
    })),
    education: eduRes.data || [],
    certifications: certRes.data || [],
    languages: (langRes.data as ProfileSnapshot['languages']) || [],
    skillsDimensions: skillDims as Record<string, number | null>,
    skillRatings: ratingsRes.data
      ? {
          soft_skills: ratingsRes.data.soft_skills,
          hard_skills: ratingsRes.data.hard_skills,
          learning_score: ratingsRes.data.learning_score,
        }
      : null,
  };
}

function buildCorpus(snapshot: ProfileSnapshot): string {
  const parts: string[] = [
    snapshot.name,
    snapshot.headline || '',
    snapshot.bio || '',
    ...(snapshot.interests || []),
    ...snapshot.work.flatMap((w) => [w.title || '', w.company || '', w.description || '']),
    ...snapshot.education.flatMap((e) => [
      e.institution || '',
      e.qualification_type || '',
      e.subject || '',
    ]),
    ...snapshot.certifications.flatMap((c) => [c.course_name || '', c.certification_type || '']),
    ...snapshot.languages.map((l) => `${l.language || ''} ${l.proficiency || ''}`),
  ];
  return normalize(parts.join(' '));
}

export function analyzeProfileGapsLocal(
  snapshot: ProfileSnapshot,
  targetRole: string,
  targetOrganization?: string
): GapAnalysisResult {
  const corpus = buildCorpus(snapshot);
  const hints = pickRoleHints(targetRole);
  const totalYears = snapshot.work.reduce(
    (sum, w) => sum + yearsFromDates(w.start_date, w.end_date),
    0
  );
  const titles = snapshot.work.map((w) => normalize(w.title || '')).filter(Boolean);
  const roleNorm = normalize(targetRole);

  const matchedHints = hints.filter((h) => corpus.includes(normalize(h)));
  const missingHints = hints.filter((h) => !corpus.includes(normalize(h)));

  const gaps: GapItem[] = [];
  const strengths: string[] = [];
  const recommendations: GapRecommendation[] = [];

  if (matchedHints.length) {
    strengths.push(`Relevant signals for ${targetRole}: ${matchedHints.slice(0, 5).join(', ')}`);
  }
  if (totalYears >= 3) {
    strengths.push(`${totalYears.toFixed(1)} years of documented work experience`);
  }
  if (snapshot.education.length > 0) {
    strengths.push(
      `Education on profile: ${snapshot.education
        .map((e) => [e.qualification_type, e.subject].filter(Boolean).join(' in '))
        .filter(Boolean)
        .slice(0, 2)
        .join('; ')}`
    );
  }
  if (snapshot.certifications.length > 0) {
    strengths.push(`${snapshot.certifications.length} certification(s) listed`);
  }
  if (titles.some((t) => roleNorm.split(' ').some((token) => token.length > 3 && t.includes(token)))) {
    strengths.push('Prior role titles overlap with your target role');
  }

  if (missingHints.length) {
    gaps.push({
      area: 'skills',
      title: 'Skill / keyword gaps vs target role',
      detail: `Your profile does not clearly show: ${missingHints.slice(0, 6).join(', ')}.`,
      severity: missingHints.length >= 4 ? 'high' : 'medium',
    });
    recommendations.push({
      action: `Add concrete evidence for: ${missingHints.slice(0, 4).join(', ')}`,
      why: 'Hiring teams scan for these signals when matching candidates to this role.',
      effort: 'short term',
    });
  }

  if (totalYears < 2) {
    gaps.push({
      area: 'experience',
      title: 'Limited documented experience',
      detail: `About ${totalYears.toFixed(1)} years of work history is on your profile; many target roles expect stronger tenure evidence.`,
      severity: 'high',
    });
    recommendations.push({
      action: 'Expand work history descriptions with impact metrics and ownership',
      why: 'Depth often matters as much as years when closing experience gaps.',
      effort: 'short term',
    });
  } else if (totalYears < 5 && /senior|lead|principal|director|head of/.test(roleNorm)) {
    gaps.push({
      area: 'experience',
      title: 'Seniority gap',
      detail: 'Target role wording suggests senior scope; your documented tenure may be below typical expectations.',
      severity: 'medium',
    });
    recommendations.push({
      action: 'Highlight leadership, mentoring, and cross-team ownership in recent roles',
      why: 'Senior titles are often awarded based on scope, not title alone.',
      effort: 'quick win',
    });
  }

  const hasDegree = snapshot.education.some((e) =>
    /bachelor|master|phd|degree|diploma/i.test(`${e.qualification_type || ''} ${e.subject || ''}`)
  );
  if (!hasDegree && snapshot.education.length === 0) {
    gaps.push({
      area: 'education',
      title: 'No education history listed',
      detail: 'Target roles often expect at least one education entry, even if experience is strong.',
      severity: 'medium',
    });
    recommendations.push({
      action: 'Add formal education or equivalent professional learning pathways',
      why: 'Removes an easy screening gap for ATS and recruiters.',
      effort: 'quick win',
    });
  }

  if (snapshot.certifications.length === 0 && /project manager|scrum|pmp|data|cloud|security/.test(roleNorm)) {
    gaps.push({
      area: 'certifications',
      title: 'No certifications for a credential-heavy role family',
      detail: 'Roles like this often list certifications as differentiators.',
      severity: 'low',
    });
    recommendations.push({
      action: 'Pursue one role-aligned certification (e.g. Scrum, PMP, Google Data Analytics, AWS)',
      why: 'A focused credential can close credibility gaps quickly.',
      effort: 'longer term',
    });
  }

  if (snapshot.languages.length === 0) {
    gaps.push({
      area: 'languages',
      title: 'Languages not listed',
      detail: 'Language skills can matter for international or client-facing target roles.',
      severity: 'low',
    });
  }

  if (targetOrganization) {
    recommendations.push({
      action: `Tailor your headline and bio toward ${targetOrganization}’s domain and product language`,
      why: 'Company-specific framing improves perceived fit beyond generic role matching.',
      effort: 'quick win',
    });
  }

  recommendations.push({
    action: 'Record a 2-minute Talendeur video covering how you already deliver parts of this target role',
    why: 'Video evidence helps compensate for keyword or tenure gaps.',
    effort: 'short term',
  });

  const covered = matchedHints.length / Math.max(hints.length, 1);
  const expScore = Math.min(1, totalYears / 5);
  const eduScore = snapshot.education.length > 0 ? 1 : 0.4;
  const certScore = snapshot.certifications.length > 0 ? 1 : 0.6;
  const matchScore = Math.round(
    (covered * 0.45 + expScore * 0.3 + eduScore * 0.15 + certScore * 0.1) * 100
  );

  const summary =
    matchScore >= 75
      ? `Your profile already aligns well with ${targetRole}. Focus on polishing evidence and targeting remaining keyword gaps.`
      : matchScore >= 50
        ? `You have a solid base for ${targetRole}, with clear gaps to close in skills evidence and positioning.`
        : `There is meaningful distance between your current profile and ${targetRole}. Prioritise the high-severity gaps below.`;

  return {
    targetRole,
    targetOrganization: targetOrganization || undefined,
    summary,
    matchScore,
    strengths: strengths.length ? strengths : ['Profile loaded — keep adding concrete role evidence.'],
    gaps,
    recommendations,
    generatedAt: new Date().toISOString(),
    source: 'local',
  };
}

export async function analyzeProfileGaps(
  snapshot: ProfileSnapshot,
  targetRole: string,
  targetOrganization?: string
): Promise<GapAnalysisResult> {
  const apiUrl = import.meta.env.VITE_CV_PARSER_API_URL?.replace(/\/$/, '');
  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/gap-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: targetRole,
          target_organization: targetOrganization || null,
          profile: snapshot,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          targetRole: data.target_role || targetRole,
          targetOrganization: data.target_organization || targetOrganization,
          summary: data.summary || '',
          matchScore: typeof data.match_score === 'number' ? data.match_score : 50,
          strengths: Array.isArray(data.strengths) ? data.strengths : [],
          gaps: Array.isArray(data.gaps) ? data.gaps : [],
          recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
          generatedAt: new Date().toISOString(),
          source: 'api',
        };
      }
    } catch (err) {
      console.warn('Gap analysis API unavailable, using local analysis:', err);
    }
  }

  return analyzeProfileGapsLocal(snapshot, targetRole, targetOrganization);
}

export function saveGapAnalysis(userId: string, result: GapAnalysisResult): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[userId] = result;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadSavedGapAnalysis(userId: string): GapAnalysisResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[userId] || null;
  } catch {
    return null;
  }
}
