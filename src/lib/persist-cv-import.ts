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

export interface PersistCvImportResult {
  workCount: number;
  educationCount: number;
  certificationCount: number;
  skillsSaved: boolean;
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
  let skillsSaved = false;

  const workRows = (parsedData.workExperience || []).filter(
    (exp) => exp.job_title && exp.company
  );
  if (workRows.length > 0) {
    const { error: deleteError } = await supabase
      .from('work_experience')
      .delete()
      .eq('user_id', userId);
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase.from('work_experience').insert(
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
    if (insertError) throw insertError;
    workCount = workRows.length;
  }

  const educationRows = (parsedData.education || [])
    .map((edu) => ({
      ...edu,
      qualification_type: normalizeQualificationType(
        edu.qualification_type || (edu as { degree?: string }).degree || ''
      ),
    }))
    .filter((edu) => edu.institution && edu.qualification_type);

  if (educationRows.length > 0) {
    const { error: deleteError } = await supabase
      .from('education_history')
      .delete()
      .eq('user_id', userId);
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase.from('education_history').insert(
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
    if (insertError) throw insertError;
    educationCount = educationRows.length;
  }

  const certificationRows = (parsedData.certifications || []).filter(
    (cert) => cert.course_name && cert.certification_type
  );
  if (certificationRows.length > 0) {
    const { error: deleteError } = await supabase
      .from('certifications')
      .delete()
      .eq('user_id', userId);
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase.from('certifications').insert(
      certificationRows.map((cert) => ({
        user_id: userId,
        course_name: cert.course_name,
        certification_type: cert.certification_type,
        date_attained: normalizeDateFormat(cert.date_attained),
        details: cert.details || '',
      }))
    );
    if (insertError) throw insertError;
    certificationCount = certificationRows.length;
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

  return { workCount, educationCount, certificationCount, skillsSaved };
}
