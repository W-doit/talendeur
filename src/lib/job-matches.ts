import { loadExtendedProfileSnapshot } from '@/lib/career-foresight';

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
  location?: string;
  keywords?: string;
  limit?: number;
}

const STORAGE_KEY = 'talendeur_job_matches';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedPayload {
  savedAt: number;
  location?: string;
  keywords?: string;
  result: JobMatchesResult;
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
      location: options.location || null,
      keywords: options.keywords || null,
      limit: options.limit ?? 12,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Job matches failed (${response.status})`);
  }

  const data = await response.json();
  const result: JobMatchesResult = {
    summary: data.summary || '',
    queries: Array.isArray(data.queries) ? data.queries : [],
    backend: data.backend || 'none',
    backends_tried: data.backends_tried,
    ranking_source: data.ranking_source,
    jobs_fetched: data.jobs_fetched ?? (data.matches?.length || 0),
    matches: Array.isArray(data.matches) ? data.matches : [],
    generated_at: data.generated_at || new Date().toISOString(),
  };

  saveJobMatchesCache(userId, result, options);
  return result;
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
      location: options.location,
      keywords: options.keywords,
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
    if ((cached.location || '') !== (options.location || '')) return null;
    if ((cached.keywords || '') !== (options.keywords || '')) return null;
    return cached.result;
  } catch {
    return null;
  }
}
