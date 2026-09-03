import { loadExtendedProfileSnapshot } from '@/lib/career-foresight';
import { normalizeLocation } from '@/lib/location-normalization';

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description_snippet?: string;
  source: string;
  score: number;
  why_fit: string;
  gaps: string[];
}

export interface JobMatchesResult {
  summary: string;
  queries: string[];
  backend: string;
  backends_tried?: string[];
  ranking_source?: string;
  jobs_fetched: number;
  matches: JobMatch[];
  generated_at: string;
}

export interface JobMatchesOptions {
  keywords?: string;
  location?: string;
  roleTitle?: string;
  opportunityType?: string;
  intent?: string;
  timeCommitment?: string;
  compensation?: string;
  skillRelationship?: string;
  industry?: string;
  format?: string;
  outcome?: string;
  level?: string;
  limit?: number;
}

const STORAGE_KEY = 'talendeur_job_matches';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const TECHNICAL_SUMMARY_PATTERNS = [
  /local heuristic/i,
  /ai ranking was unavailable/i,
  /configure linkedin mcp/i,
  /cvparser host/i,
  /backend:/i,
];

function stripMarkdown(value: string): string {
  return value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeDisplayText(value: string | undefined | null, fallback = ''): string {
  const cleaned = stripMarkdown(String(value || ''));
  return cleaned || fallback;
}

export function formatMatchesSummary(summary: string, matchCount: number): string {
  const cleaned = sanitizeDisplayText(summary);
  if (!cleaned || TECHNICAL_SUMMARY_PATTERNS.some((pattern) => pattern.test(cleaned))) {
    if (matchCount === 0) {
      return 'No openings matched your search yet. Try broadening your keywords or location.';
    }
    return matchCount === 1
      ? 'We found 1 opening that may fit your search.'
      : `We found ${matchCount} openings that may fit your search.`;
  }
  return cleaned;
}

export function formatJobMatchForDisplay(job: JobMatch): JobMatch {
  const title = sanitizeDisplayText(job.title, 'Opening');
  let company = sanitizeDisplayText(job.company);
  if (!company || /^(unknown company|company not listed|not specified)$/i.test(company)) {
    if (job.url.includes('-at-')) {
      const slug = job.url.split('-at-').pop()?.split('?')[0] ?? '';
      const cleaned = slug.replace(/-\d+$/, '').replace(/-/g, ' ').trim();
      company = cleaned ? cleaned.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Company not listed';
    } else {
      company = 'Company not listed';
    }
  }

  const location = sanitizeDisplayText(job.location);
  const why_fit = sanitizeDisplayText(job.why_fit);
  const gaps = (job.gaps || [])
    .map((gap) => sanitizeDisplayText(gap))
    .filter(Boolean);

  return {
    ...job,
    title,
    company,
    location: location && !/^not specified$/i.test(location) ? location : '',
    why_fit,
    gaps,
  };
}

interface CachedPayload {
  savedAt: number;
  optionsKey: string;
  result: JobMatchesResult;
}

function expandJobSearchLocation(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const n = normalizeLocation(trimmed);
  if (!n?.country) return trimmed;
  if (n.city && n.city.toLowerCase() !== n.country.toLowerCase()) {
    return `${n.city}, ${n.country}`;
  }
  return n.country;
}

export async function fetchJobMatches(
  userId: string,
  options: JobMatchesOptions = {}
): Promise<JobMatchesResult> {
  const apiUrl = import.meta.env.VITE_CV_PARSER_API_URL?.replace(/\/$/, '');
  if (!apiUrl) {
    throw new Error('CV Parser API URL not configured. Set VITE_CV_PARSER_API_URL in .env');
  }

  const profile = await loadExtendedProfileSnapshot(userId);
  const response = await fetch(`${apiUrl}/job-matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile,
      keywords: options.keywords || null,
      location: expandJobSearchLocation(options.location) || null,
      role_title: options.roleTitle || null,
      opportunity_type: options.opportunityType || null,
      intent: options.intent || null,
      time_commitment: options.timeCommitment || null,
      compensation: options.compensation || null,
      skill_relationship: options.skillRelationship || null,
      industry: options.industry || null,
      format: options.format || null,
      outcome: options.outcome || null,
      level: options.level || null,
      limit: options.limit ?? 12,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Job matches failed (${response.status})`);
  }

  const data = await response.json();
  const rawMatches: JobMatch[] = Array.isArray(data.matches) ? data.matches : [];
  const matches = rawMatches.map(formatJobMatchForDisplay);
  const result: JobMatchesResult = {
    summary: formatMatchesSummary(data.summary || '', matches.length),
    queries: Array.isArray(data.queries) ? data.queries : [],
    backend: data.backend || 'none',
    backends_tried: data.backends_tried,
    ranking_source: data.ranking_source,
    jobs_fetched: data.jobs_fetched ?? matches.length,
    matches,
    generated_at: data.generated_at || new Date().toISOString(),
  };

  saveJobMatchesCache(userId, result, options);
  return result;
}

function optionsKey(options: JobMatchesOptions): string {
  const { limit: _limit, ...rest } = options;
  return JSON.stringify(rest, Object.keys(rest).sort());
}

export function normalizeJobMatchesResult(result: JobMatchesResult): JobMatchesResult {
  const matches = (result.matches || []).map(formatJobMatchForDisplay);
  return {
    ...result,
    summary: formatMatchesSummary(result.summary, matches.length),
    matches,
  };
}

export function saveJobMatchesCache(
  userId: string,
  result: JobMatchesResult,
  options: JobMatchesOptions = {}
): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const payload: CachedPayload = {
      savedAt: Date.now(),
      optionsKey: optionsKey(options),
      result,
    };
    all[userId] = payload;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function loadJobMatchesCache(
  userId: string,
  options: JobMatchesOptions = {}
): JobMatchesResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    const cached = all[userId] as CachedPayload | undefined;
    if (!cached?.result || !cached.savedAt) return null;
    if (Date.now() - cached.savedAt > CACHE_TTL_MS) return null;
    if (cached.optionsKey !== optionsKey(options)) return null;
    return normalizeJobMatchesResult(cached.result);
  } catch {
    return null;
  }
}
