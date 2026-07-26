import { ParsedData, ParsedEducation, ParsedCertification } from './pdf-parser';
import { normalizeParsedCvData } from './normalize-parsed-cv';

const CERT_SIGNALS = [
  'certification', 'certified', 'certificate', 'professional certificate',
  'aws', 'azure', 'google cloud', 'gcp', 'coursera', 'udemy', 'udacity',
  'linkedin learning', 'datacamp', 'pluralsight', 'pmp', 'prince2',
  'scrum', 'csm', 'psm', 'cisco', 'comptia', 'ccna', 'salesforce',
  'hubspot', 'six sigma', 'itil', 'bootcamp', 'nanodegree',
];

function looksLikeProfessionalCertification(edu: ParsedEducation): boolean {
  const qual = (edu.qualification_type || '').trim();
  const text = `${qual} ${edu.institution || ''} ${edu.subject || ''}`.toLowerCase();

  if (['PhD', 'Master', 'Bachelor', 'Associate', 'High School'].includes(qual)) {
    return false;
  }

  const academicDegree = /\b(ph\.?d|doctorate|masters?|bachelor|associate|b\.?sc|m\.?sc|mba|undergraduate|licen[cs]iatura|grado|high\s*school)\b/i.test(text);
  const academicInstitution = /\b(university|universidad|college|polytechnic|institute of technology)\b/i.test(text);
  const hasCertSignal = CERT_SIGNALS.some((signal) => text.includes(signal));

  if (academicDegree && academicInstitution && !hasCertSignal) return false;
  if ((qual === 'Certificate' || qual === 'Diploma') && hasCertSignal) return true;
  if (qual === 'Certificate' && !academicInstitution) return true;
  if (hasCertSignal && !academicDegree) return true;
  return false;
}

function educationToCertification(edu: ParsedEducation): ParsedCertification {
  const courseName =
    edu.subject && edu.qualification_type
      ? `${edu.qualification_type} - ${edu.subject}`
      : edu.subject || edu.qualification_type || 'Professional Certification';

  return {
    course_name: courseName,
    certification_type: 'Other',
    date_attained: edu.end_date || edu.start_date || '',
    details: (edu.institution || '').slice(0, 100),
  };
}

/** Move professional certs that landed in education into certifications[] */
export function separateCertificationsFromEducation(parsedData: ParsedData): ParsedData {
  const education = Array.isArray(parsedData.education) ? parsedData.education : [];
  const certifications = Array.isArray(parsedData.certifications) ? [...parsedData.certifications] : [];
  const existing = new Set(
    certifications.map((c) => (c.course_name || '').trim().toLowerCase()).filter(Boolean)
  );

  const keptEducation: ParsedEducation[] = [];
  for (const edu of education) {
    if (looksLikeProfessionalCertification(edu)) {
      const cert = educationToCertification(edu);
      const key = (cert.course_name || '').trim().toLowerCase();
      if (key && !existing.has(key)) {
        certifications.push(cert);
        existing.add(key);
      }
    } else {
      keptEducation.push(edu);
    }
  }

  return {
    ...parsedData,
    education: keptEducation,
    certifications,
  };
}

/**
 * Parse CV using external FastAPI microservice
 * @param file - PDF file to parse
 * @returns Parsed CV data matching Talendeur's schema
 */
export async function parseCV(file: File): Promise<ParsedData> {
  const apiUrl = import.meta.env.VITE_CV_PARSER_API_URL?.replace(/\/$/, ''); // Remove trailing slash
  
  console.log('parseCV called with file:', file.name, file.size, 'bytes');
  console.log('API URL:', apiUrl);
  
  if (!apiUrl) {
    const error = 'CV Parser API URL not configured. Please set VITE_CV_PARSER_API_URL in your .env file';
    console.error(error);
    throw new Error(error);
  }

  // Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are supported');
  }

  // Validate file size (10MB max)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    console.log('Sending request to:', `${apiUrl}/parse-cv`);
    
    const response = await fetch(`${apiUrl}/parse-cv`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`CV parsing failed (${response.status}): ${errorText}`);
    }

    const parsedData: ParsedData = await response.json();
    
    console.log('Parsed data received:', parsedData);
    
    // Validate response structure
    if (!parsedData.profile || !Array.isArray(parsedData.education) || 
        !Array.isArray(parsedData.workExperience) || !Array.isArray(parsedData.certifications) ||
        !Array.isArray(parsedData.skills)) {
      throw new Error('Invalid response format from CV parser API');
    }

    const separated = separateCertificationsFromEducation(parsedData);
    const normalized = normalizeParsedCvData(separated);
    console.log('CV parsed successfully by FastAPI service:', normalized);
    return normalized;

  } catch (error) {
    if (error instanceof Error) {
      console.error('CV Parser API error:', error.message);
      throw error;
    }
    throw new Error('Unknown error occurred while parsing CV');
  }
}
