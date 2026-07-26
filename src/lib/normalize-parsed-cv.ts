import type {
  ParsedCertification,
  ParsedData,
  ParsedEducation,
  ParsedProfile,
  ParsedWorkExperience,
} from '@/lib/pdf-parser';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const asBool = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }
  return Boolean(value);
};

/** Normalize date-like values to YYYY-MM-DD when possible */
export function normalizeImportDate(value: unknown): string {
  const raw = asString(value);
  if (!raw) return '';

  const lower = raw.toLowerCase();
  if (['present', 'current', 'now', 'ongoing', 'heute'].includes(lower)) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`;
  if (/^\d{4}$/.test(raw)) return `${raw}-01-01`;

  // MM/YYYY or MM-YYYY
  const my = raw.match(/^(\d{1,2})[\/\-.](\d{4})$/);
  if (my) {
    const month = my[1].padStart(2, '0');
    return `${my[2]}-${month}-01`;
  }

  // YYYY/MM/DD or YYYY.MM.DD
  const ymd = raw.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  }

  // Month name YYYY (e.g. Jan 2020, January 2020)
  const monthName = raw.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (monthName) {
    const months: Record<string, string> = {
      jan: '01', january: '01',
      feb: '02', february: '02',
      mar: '03', march: '03',
      apr: '04', april: '04',
      may: '05',
      jun: '06', june: '06',
      jul: '07', july: '07',
      aug: '08', august: '08',
      sep: '09', sept: '09', september: '09',
      oct: '10', october: '10',
      nov: '11', november: '11',
      dec: '12', december: '12',
    };
    const m = months[monthName[1].toLowerCase()];
    if (m) return `${monthName[2]}-${m}-01`;
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    if (yyyy > 1900 && yyyy < 2100) return `${yyyy}-${mm}-${dd}`;
  }

  return raw;
}

function normalizeProfile(raw: unknown): ParsedProfile {
  const p = asRecord(raw);
  const fullName = asString(p.name || p.full_name || p.fullName);
  let firstName = asString(p.firstName || p.first_name || p.given_name);
  let surname = asString(p.surname || p.lastName || p.last_name || p.family_name);

  if ((!firstName || !surname) && fullName) {
    const parts = fullName.split(/\s+/);
    if (!firstName) firstName = parts[0] || '';
    if (!surname) surname = parts.slice(1).join(' ');
  }

  return {
    firstName,
    surname,
    email: asString(p.email) || undefined,
    bio: asString(p.bio || p.summary || p.about) || undefined,
    headline: asString(p.headline || p.title || p.professional_title) || undefined,
  };
}

function normalizeWork(raw: unknown): ParsedWorkExperience & { location?: string } {
  const e = asRecord(raw);
  const still =
    asBool(e.still_work_here ?? e.current ?? e.is_current ?? e.present) ||
    ['present', 'current', 'now', 'ongoing'].includes(asString(e.end_date || e.endDate).toLowerCase());

  const endRaw = still ? '' : normalizeImportDate(e.end_date ?? e.endDate ?? e.to);
  const start = normalizeImportDate(e.start_date ?? e.startDate ?? e.from ?? e.start);

  return {
    job_title: asString(e.job_title || e.title || e.position || e.role || e.jobTitle),
    company: asString(e.company || e.employer || e.organization || e.company_name) || 'Unknown',
    location: asString(e.location || e.city || e.place) || undefined,
    start_date: start,
    end_date: endRaw || null,
    still_work_here: still,
  };
}

function normalizeEducation(raw: unknown): ParsedEducation & { location?: string } {
  const e = asRecord(raw);
  const still =
    asBool(e.still_studying ?? e.current ?? e.is_current) ||
    ['present', 'current', 'now', 'ongoing'].includes(asString(e.end_date || e.endDate).toLowerCase());

  const endRaw = still ? '' : normalizeImportDate(e.end_date ?? e.endDate ?? e.to);
  return {
    institution: asString(e.institution || e.school || e.university || e.college),
    qualification_type: asString(
      e.qualification_type || e.degree || e.qualification || e.degree_type
    ),
    subject: asString(e.subject || e.field || e.major || e.field_of_study),
    location: asString(e.location || e.city) || undefined,
    start_date: normalizeImportDate(e.start_date ?? e.startDate ?? e.from ?? e.start),
    end_date: endRaw || null,
    still_studying: still,
  };
}

function normalizeCertification(raw: unknown): ParsedCertification {
  const c = asRecord(raw);
  return {
    course_name: asString(c.course_name || c.name || c.title || c.certification),
    certification_type: asString(c.certification_type || c.type || c.category) || 'Other',
    date_attained: normalizeImportDate(c.date_attained ?? c.date ?? c.issued ?? c.end_date),
    details: asString(c.details || c.issuer || c.organization || c.authority).slice(0, 100),
  };
}

/**
 * Normalize parser / LinkedIn-style payloads into Talendeur's canonical field names.
 * Safe to run on already-normalized data (idempotent).
 */
export function normalizeParsedCvData(input: ParsedData | Record<string, unknown>): ParsedData {
  const root = asRecord(input);

  const workSource =
    (Array.isArray(root.workExperience) && root.workExperience) ||
    (Array.isArray(root.work_experience) && root.work_experience) ||
    (Array.isArray(root.experience) && root.experience) ||
    [];

  const educationSource =
    (Array.isArray(root.education) && root.education) ||
    (Array.isArray(root.education_history) && root.education_history) ||
    [];

  const certSource =
    (Array.isArray(root.certifications) && root.certifications) ||
    (Array.isArray(root.certificates) && root.certificates) ||
    [];

  const skillsSource = Array.isArray(root.skills) ? root.skills : [];

  const workExperience = workSource
    .map(normalizeWork)
    .filter((w) => w.job_title || (w.company && w.company !== 'Unknown'));

  // Prefer keeping title-only roles
  const cleanedWork = workExperience.filter((w) => w.job_title);

  const education = educationSource
    .map(normalizeEducation)
    .filter((e) => e.institution || e.qualification_type || e.subject);

  const certifications = certSource
    .map(normalizeCertification)
    .filter((c) => c.course_name);

  const skills = skillsSource
    .map((s) => (typeof s === 'string' ? s : asString(asRecord(s).name || asRecord(s).skill)))
    .filter(Boolean);

  const result: ParsedData = {
    profile: normalizeProfile(root.profile ?? root),
    workExperience: cleanedWork,
    education,
    certifications,
    skills,
  };

  if (root.skills_dimensions && typeof root.skills_dimensions === 'object') {
    result.skills_dimensions = root.skills_dimensions as ParsedData['skills_dimensions'];
  }

  return result;
}
