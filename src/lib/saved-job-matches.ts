import { supabase } from '@/integrations/supabase/client';
import type { JobMatch } from '@/lib/job-matches';

export interface SavedJobMatch extends JobMatch {
  savedAt: string;
  dbId: string;
}

type SavedJobMatchRow = {
  id: string;
  user_id: string;
  job_id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string;
  description_snippet: string | null;
  source: string | null;
  score: number | null;
  why_fit: string | null;
  gaps: string[] | null;
  saved_at: string;
};

function rowToSaved(row: SavedJobMatchRow): SavedJobMatch {
  return {
    dbId: row.id,
    id: row.job_id,
    title: row.title,
    company: row.company || '',
    location: row.location || '',
    url: row.url,
    description_snippet: row.description_snippet || undefined,
    source: row.source || 'saved',
    score: typeof row.score === 'number' ? row.score : 0,
    why_fit: row.why_fit || '',
    gaps: Array.isArray(row.gaps) ? row.gaps : [],
    savedAt: row.saved_at,
  };
}

export async function listSavedJobMatches(userId: string): Promise<SavedJobMatch[]> {
  const { data, error } = await (supabase as any)
    .from('saved_job_matches')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as SavedJobMatchRow[]).map(rowToSaved);
}

export async function saveJobMatch(userId: string, job: JobMatch): Promise<SavedJobMatch> {
  const payload = {
    user_id: userId,
    job_id: job.id,
    title: job.title,
    company: job.company || null,
    location: job.location || null,
    url: job.url,
    description_snippet: job.description_snippet || null,
    source: job.source || null,
    score: job.score ?? null,
    why_fit: job.why_fit || null,
    gaps: job.gaps || [],
  };

  const { data, error } = await (supabase as any)
    .from('saved_job_matches')
    .upsert(payload, { onConflict: 'user_id,job_id' })
    .select('*')
    .single();

  if (error) throw error;
  return rowToSaved(data as SavedJobMatchRow);
}

export async function unsaveJobMatch(userId: string, jobId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('saved_job_matches')
    .delete()
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (error) throw error;
}

export function savedJobIdSet(saved: SavedJobMatch[]): Set<string> {
  return new Set(saved.map((j) => j.id));
}
