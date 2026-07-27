import { supabase } from '@/integrations/supabase/client';
import type { ParsedData } from '@/lib/pdf-parser';

const normalizeDateFormat = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
  if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`;
  console.warn(`Invalid date format: ${dateStr}`);
  return null;
};

const QUALIFICATION_TYPES = [
  'PhD',
  'Master',
  'Bachelor',
  'Associate',
  'Certificate',
  'Diploma',
  'High School',
] as const;

const normalizeQualificationType = (raw: string | undefined | null): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if ((QUALIFICATION_TYPES as readonly string[]).includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  if (/ph\.?d|doctorate|doctoral|dphil/i.test(lower)) return 'PhD';
  if (/master|m\.?sc|mba|m\.?eng|m\.?phil|postgraduate/i.test(lower)) return 'Master';
  if (/bachelor|b\.?sc|b\.?eng|\bb\.?a\b|\bb\.?s\b|undergraduate|licen[cs]iatura|grado/i.test(lower)) {
    return 'Bachelor';
  }
  if (/associate/i.test(lower)) return 'Associate';
  if (/diploma/i.test(lower)) return 'Diploma';
  if (/high\s*school|secondary|a-?levels?|gcse/i.test(lower)) return 'High School';
  if (/certificate|certification/i.test(lower)) return 'Certificate';
  return trimmed;
};

export interface ExistingCvSectionCounts {
  workCount: number;
  educationCount: number;
  certificationCount: number;
}

export interface PersistCvImportResult {
  workCount: number;
  educationCount: number;
  certificationCount: number;
  languageCount: number;
  skillsSaved: boolean;
  previous: ExistingCvSectionCounts;
  /** True when at least one section had prior rows that were replaced */
  replacedExisting: boolean;
}

/** Count existing CV-backed rows for re-import confirmation / loss warnings */
export async function getExistingCvSectionCounts(
  userId: string
): Promise<ExistingCvSectionCounts> {
  const [work, education, certifications] = await Promise.all([
    supabase.from('work_experience').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('education_history').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('certifications').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);

  return {
    workCount: work.count ?? 0,
    educationCount: education.count ?? 0,
    certificationCount: certifications.count ?? 0,
  };
}

/**
 * Replace table rows safely: insert new rows first, then delete previous IDs.
 * If insert fails, existing data is left intact.
 */
async function replaceRows<T extends Record<string, unknown>>(
  table: 'work_experience' | 'education_history' | 'certifications' | 'languages',
  userId: string,
  newRows: T[]
): Promise<number> {
  if (newRows.length === 0) return 0;

  const { data: existing, error: existingError } = await supabase
    .from(table)
    .select('id')
    .eq('user_id', userId);
  if (existingError) throw existingError;

  const existingIds = (existing || []).map((row) => row.id as string);

  const { error: insertError } = await supabase.from(table).insert(newRows);
  if (insertError) throw insertError;

  if (existingIds.length > 0) {
    const { error: deleteError } = await supabase.from(table).delete().in('id', existingIds);
    if (deleteError) {
      // New rows were inserted; surface error so caller can warn, but data is not wiped
      console.error(`Failed to remove previous ${table} rows after insert:`, deleteError);
      throw deleteError;
    }
  }

  return newRows.length;
}

/**
 * Persist parsed CV data to Supabase so the live/public profile updates
 * without requiring manual Save on each edit tab.
 */
export async function persistParsedCVData(
  userId: string,
  parsedData: ParsedData
): Promise<PersistCvImportResult> {
  let workCount = 0;
  let educationCount = 0;
  let certificationCount = 0;
  let languageCount = 0;
  let skillsSaved = false;

  const previous = await getExistingCvSectionCounts(userId);

  // Keep roles that have a job title; never drop because company is missing
  const workRows = (parsedData.workExperience || [])
    .map((exp) => ({
      ...exp,
      job_title: (exp.job_title || '').trim(),
      company: (exp.company || '').trim() || 'Unknown',
    }))
    .filter((exp) => exp.job_title);

  if (workRows.length > 0) {
    workCount = await replaceRows(
      'work_experience',
      userId,
      workRows.map((exp) => ({
        user_id: userId,
        job_title: exp.job_title,
        company: exp.company,
        location: (exp as { location?: string }).location || null,
        start_date: normalizeDateFormat(exp.start_date),
        end_date: exp.still_work_here ? null : normalizeDateFormat(exp.end_date),
        still_work_here: !!exp.still_work_here,
      }))
    );
  }

  const educationRows = (parsedData.education || [])
    .map((edu) => ({
      ...edu,
      qualification_type: normalizeQualificationType(
        edu.qualification_type || (edu as { degree?: string }).degree || ''
      ),
      institution: (edu.institution || '').trim(),
    }))
    .filter((edu) => edu.institution && edu.qualification_type);

  if (educationRows.length > 0) {
    educationCount = await replaceRows(
      'education_history',
      userId,
      educationRows.map((edu) => ({
        user_id: userId,
        institution: edu.institution,
        qualification_type: edu.qualification_type,
        subject: edu.subject || '',
        location: (edu as { location?: string }).location || null,
        start_date: normalizeDateFormat(edu.start_date),
        end_date: edu.still_studying ? null : normalizeDateFormat(edu.end_date),
        still_studying: !!edu.still_studying,
      }))
    );
  }

  const certificationRows = (parsedData.certifications || [])
    .map((cert) => ({
      ...cert,
      course_name: (cert.course_name || '').trim(),
      certification_type: (cert.certification_type || '').trim(),
    }))
    .filter((cert) => cert.course_name && cert.certification_type);

  if (certificationRows.length > 0) {
    certificationCount = await replaceRows(
      'certifications',
      userId,
      certificationRows.map((cert) => ({
        user_id: userId,
        course_name: cert.course_name,
        certification_type: cert.certification_type,
        date_attained: normalizeDateFormat(cert.date_attained),
        details: cert.details || '',
      }))
    );
  }

  const languageRows = (parsedData.languages || [])
    .map((lang) => ({
      language: (lang.language || '').trim(),
      proficiency: (lang.proficiency || 'Intermediate').trim() || 'Intermediate',
      language_type:
        lang.language_type === 'programming' ? 'programming' : 'spoken',
    }))
    .filter((lang) => lang.language);

  if (languageRows.length > 0) {
    languageCount = await replaceRows(
      'languages',
      userId,
      languageRows.map((lang) => ({
        user_id: userId,
        language: lang.language,
        proficiency: lang.proficiency,
        language_type: lang.language_type,
      }))
    );
  }

  if (parsedData.skills_dimensions && Object.keys(parsedData.skills_dimensions).length > 0) {
    const dims = parsedData.skills_dimensions;
    const payload = {
      user_id: userId,
      creativity: dims.creativity ?? 0,
      communication: dims.communication ?? 0,
      critical_thinking: dims.critical_thinking ?? 0,
      technology_development: dims.technology_development ?? 0,
      operations: dims.operations ?? 0,
      social_impact: dims.social_impact ?? 0,
      business_acumen: dims.business_acumen ?? 0,
      innovation: dims.innovation ?? 0,
      collaboration: dims.collaboration ?? 0,
      leadership: dims.leadership ?? 0,
      precision: dims.precision ?? 0,
      depth: dims.depth ?? 0,
      commitment: dims.commitment ?? 0,
      empathy: dims.empathy ?? 0,
      flexibility: dims.flexibility ?? 0,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('skills_dimensions')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('skills_dimensions')
        .update(payload)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('skills_dimensions').insert(payload);
      if (error) throw error;
    }
    skillsSaved = true;
  }

  // Persist skill keywords as interests when present
  if (Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
    const { data: existingSkills } = await supabase
      .from('jobseeker_skill_rating')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSkills) {
      await supabase
        .from('jobseeker_skill_rating')
        .update({ interests: parsedData.skills })
        .eq('user_id', userId);
    } else {
      await supabase.from('jobseeker_skill_rating').insert({
        user_id: userId,
        interests: parsedData.skills,
        soft_skills: 70,
        hard_skills: 70,
        feedback_score: 70,
        learning_score: 70,
      });
    }
  }

  const replacedExisting =
    (workCount > 0 && previous.workCount > 0) ||
    (educationCount > 0 && previous.educationCount > 0) ||
    (certificationCount > 0 && previous.certificationCount > 0);

  return {
    workCount,
    educationCount,
    certificationCount,
    languageCount,
    skillsSaved,
    previous,
    replacedExisting,
  };
}
