import * as pdfjsLib from 'pdfjs-dist';

// Set worker path to use unpkg CDN (more reliable)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Types matching our database schema
export interface ParsedProfile {
  firstName?: string;
  surname?: string;
  email?: string;
  bio?: string;
  headline?: string;
}

export interface ParsedEducation {
  institution: string;
  qualification_type: string;
  subject: string;
  start_date: string;
  end_date: string | null;
  still_studying: boolean;
}

export interface ParsedWorkExperience {
  job_title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  still_work_here: boolean;
}

export interface ParsedCertification {
  course_name: string;
  certification_type: string;
  date_attained: string;
  details: string;
}

export interface SkillsDimensions {
  creativity: number;
  communication: number;
  critical_thinking: number;
  technology_development: number;
  operations: number;
  social_impact: number;
  business_acumen: number;
  innovation: number;
  collaboration: number;
  leadership: number;
  precision: number;
  depth: number;
  commitment: number;
  empathy: number;
  flexibility: number;
}

export interface ParsedData {
  profile: ParsedProfile;
  education: ParsedEducation[];
  workExperience: ParsedWorkExperience[];
  certifications: ParsedCertification[];
  skills: string[];
  skills_dimensions?: SkillsDimensions;
}

// Common synonyms for different sections
const SECTION_PATTERNS = {
  education: [
    /^education$/i,
    /^academic\s+(background|history)?$/i,
    /^qualifications?$/i,
    /^degrees?$/i,
    /^studies$/i,
  ],
  experience: [
    /^experience$/i,
    /^(work|employment|professional)\s+(experience|history)$/i,
    /^career$/i,
    /^positions?\s+held$/i,
  ],
  skills: [
    /^(top\s+)?skills?$/i,
    /^competenc(y|ies)$/i,
    /^expertise$/i,
    /^technical\s+skills$/i,
    /^core\s+skills$/i,
  ],
  certifications: [
    /^certifications?$/i,
    /^certificates?$/i,
    /^licenses?$/i,
    /^credentials?$/i,
    /^courses?$/i,
  ],
  summary: [
    /^summary$/i,
    /^profile$/i,
    /^about(\s+me)?$/i,
    /^objective$/i,
    /^bio$/i,
    /^introduction$/i,
  ],
};

// Date patterns to extract dates (order matters - more specific first)
const DATE_PATTERNS = [
  // Month Year - Month Year format: Jan 2020 - Dec 2024 or January 2020 - March 2024
  /(\w+)\s+(\d{4})\s*[-–]\s*(\w+)?\s*(\d{4})?/,
  // Year - Year format: 2020 - 2024 or 2020–2024
  /(\d{4})\s*[-–]\s*(\d{4})/,
  // Month/Year format: 01/2020
  /(\d{1,2})\/(\d{4})/,
  // Month Year format: January 2020 or Jan 2020
  /(\w+)\s+(\d{4})/,
  // Duration format: 6 years 1 month
  /(\d+)\s+years?(?:\s+(\d+)\s+months?)?/i,
];

const PRESENT_KEYWORDS = ['present', 'current', 'now', 'ongoing', 'today', 'currently'];

// Email pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Parse PDF and extract structured data
 */
export async function parsePDF(file: File): Promise<ParsedData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    
    // Extract text from all pages with better line break detection
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Group text items by their Y position to detect lines
      let lastY = -1;
      const threshold = 5; // Y position difference threshold for new line
      
      for (const item of textContent.items) {
        const textItem = item as any;
        if (textItem.str) {
          // If Y position changed significantly, add a newline
          if (lastY !== -1 && Math.abs(textItem.transform[5] - lastY) > threshold) {
            fullText += '\n';
          }
          fullText += textItem.str + ' ';
          lastY = textItem.transform[5];
        }
      }
      fullText += '\n';
    }

    console.log('Extracted PDF text (first 1000 chars):', fullText.substring(0, 1000));
    console.log('Full text length:', fullText.length);
    console.log('Number of lines:', fullText.split('\n').length);

    return parseTextContent(fullText);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

/**
 * Parse text content and extract structured data
 */
function parseTextContent(text: string): ParsedData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const parsedData: ParsedData = {
    profile: {},
    education: [],
    workExperience: [],
    certifications: [],
    skills: [],
  };

  // Extract email
  const emailMatch = text.match(EMAIL_PATTERN);
  if (emailMatch) {
    parsedData.profile.email = emailMatch[0];
  }

  // Extract name (usually first 1-2 lines)
  if (lines.length > 0) {
    const firstLine = lines[0];
    // Check if first line looks like a name (2-4 words, letters only, can be all caps or mixed case)
    // Exclude lines with numbers, emails, or common profile keywords
    const isNotEmail = !EMAIL_PATTERN.test(firstLine);
    const hasNoNumbers = !/\d/.test(firstLine);
    const isNotKeyword = !/^(profile|resume|cv|curriculum|vitae|linkedin)$/i.test(firstLine);
    const wordCount = firstLine.split(/\s+/).length;
    const isReasonableLength = wordCount >= 2 && wordCount <= 4 && firstLine.length <= 50;
    
    if (isNotEmail && hasNoNumbers && isNotKeyword && isReasonableLength) {
      const nameParts = firstLine.split(/\s+/);
      parsedData.profile.firstName = nameParts[0];
      parsedData.profile.surname = nameParts.slice(1).join(' ');
      console.log(`Extracted name: "${parsedData.profile.firstName} ${parsedData.profile.surname}"`);
    } else {
      console.log(`First line did not match name pattern: "${firstLine}"`);
    }
  }

  // Identify sections
  const sections = identifySections(lines);

  // Parse each section
  if (sections.summary.length > 0) {
    parsedData.profile.bio = sections.summary.join(' ');
    // Use first sentence as headline
    const firstSentence = sections.summary[0].split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length < 200) {
      parsedData.profile.headline = firstSentence.trim();
    }
  }

  if (sections.education.length > 0) {
    parsedData.education = parseEducation(sections.education);
  }

  if (sections.experience.length > 0) {
    parsedData.workExperience = parseWorkExperience(sections.experience);
  }

  if (sections.certifications.length > 0) {
    parsedData.certifications = parseCertifications(sections.certifications);
  }

  if (sections.skills.length > 0) {
    parsedData.skills = parseSkills(sections.skills);
  }

  return parsedData;
}

/**
 * Identify different sections in the document
 */
function identifySections(lines: string[]): {
  summary: string[];
  education: string[];
  experience: string[];
  certifications: string[];
  skills: string[];
} {
  const sections = {
    summary: [] as string[],
    education: [] as string[],
    experience: [] as string[],
    certifications: [] as string[],
    skills: [] as string[],
  };

  let currentSection: keyof typeof sections | null = null;
  let sectionStartIndex = 0;

  console.log('Identifying sections in', lines.length, 'lines');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line is a section header (must be short and match pattern exactly)
    let foundSection = false;
    
    if (line.length < 50 && line.length > 0) {
      for (const [sectionKey, patterns] of Object.entries(SECTION_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(line))) {
          console.log(`Found section: ${sectionKey} at line ${i}: "${line}"`);
          
          // Save previous section content
          if (currentSection && sectionStartIndex < i) {
            sections[currentSection].push(...lines.slice(sectionStartIndex, i));
          }
          
          currentSection = sectionKey as keyof typeof sections;
          sectionStartIndex = i + 1;
          foundSection = true;
          break;
        }
      }
    }

    // If at end of document, save last section
    if (i === lines.length - 1 && currentSection && sectionStartIndex <= i) {
      sections[currentSection].push(...lines.slice(sectionStartIndex, i + 1));
    }
  }

  console.log('Sections found:', {
    summary: sections.summary.length,
    education: sections.education.length,
    experience: sections.experience.length,
    certifications: sections.certifications.length,
    skills: sections.skills.length,
  });

  return sections;
}

/**
 * Parse education entries - improved to capture all consecutive education blocks
 */
function parseEducation(lines: string[]): ParsedEducation[] {
  const educationEntries: ParsedEducation[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Look for institution or degree indicators
    const hasInstitution = /University|College|School|Institute|Business School|Università|Sapienza/i.test(line);
    const hasDegree = /Bachelor|Master|PhD|Doctorate|Degree|Diploma|Certificate|Training|Instructional/i.test(line);
    const hasCapitalizedWords = /^[A-Z][a-zA-Z\s&,'-]*$/.test(line) && line.length > 3;

    // If this looks like the start of an education entry
    if (hasInstitution || hasDegree || hasCapitalizedWords) {
      const entry: Partial<ParsedEducation> = {
        institution: '',
        qualification_type: '',
        subject: '',
        start_date: '',
        end_date: null,
        still_studying: false,
      };

      // Collect lines that belong to this education entry
      const entryLines: string[] = [];
      let j = i;
      let foundDates = false;

      // Collect lines for this entry (usually 2-5 lines)
      while (j < lines.length && entryLines.length < 5) {
        const currentLine = lines[j].trim();
        
        if (!currentLine) {
          j++;
          continue;
        }

        entryLines.push(currentLine);

        // Stop if we found dates and have at least 2 pieces of info
        if (containsDate(currentLine)) {
          foundDates = true;
          j++;
          break;
        }

        j++;
      }

      // Parse the collected lines
      for (const entryLine of entryLines) {
        // First line is usually institution or degree
        if (!entry.institution && !entry.qualification_type) {
          if (/University|College|School|Institute|Business School|Università|Sapienza/i.test(entryLine)) {
            entry.institution = entryLine;
          } else {
            entry.qualification_type = entryLine;
          }
        }
        // Look for degree type
        else if (!entry.qualification_type) {
          if (/Bachelor|Master|PhD|Doctorate|Degree|Diploma|Certificate|Training|Instructional/i.test(entryLine)) {
            entry.qualification_type = entryLine;
            // Extract subject
            const subjectMatch = entryLine.match(/in\s+(.+)/i);
            if (subjectMatch) {
              entry.subject = subjectMatch[1];
            }
          } else if (!entry.institution) {
            entry.institution = entryLine;
          }
        }
        // Look for dates
        else if (containsDate(entryLine)) {
          const dates = extractDates(entryLine);
          if (dates.start) entry.start_date = dates.start;
          if (dates.end) entry.end_date = dates.end;
          entry.still_studying = dates.isPresent;
        }
      }

      // Add entry if we have at least institution or qualification
      if (entry.institution || entry.qualification_type) {
        educationEntries.push(entry as ParsedEducation);
      }

      i = j;
    } else {
      i++;
    }
  }

  return educationEntries;
}

/**
 * Parse work experience entries - improved to capture all consecutive job blocks
 */
function parseWorkExperience(lines: string[]): ParsedWorkExperience[] {
  const experiences: ParsedWorkExperience[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Look for job titles or company indicators
    // Job titles often contain: Manager, Developer, Engineer, Analyst, Consultant, Designer, Director, Lead, Senior, Junior, Specialist, Officer, Executive, Admin, etc.
    // Or: word(s) followed by "at" company
    const hasJobKeyword = /Manager|Developer|Engineer|Analyst|Consultant|Designer|Director|Lead|Senior|Junior|Specialist|Officer|Executive|Admin|Trainer|Expert|Generalist|Account/i.test(line);
    const looksLikeJobTitle = line.length > 3 && line.length < 100 && !containsDate(line) && hasJobKeyword;

    if (looksLikeJobTitle) {
      const entry: Partial<ParsedWorkExperience> = {
        job_title: '',
        company: '',
        start_date: '',
        end_date: null,
        still_work_here: false,
      };

      // Collect lines for this work experience entry (usually 2-5 lines)
      const entryLines: string[] = [];
      let j = i;
      let foundDates = false;

      while (j < lines.length && entryLines.length < 6) {
        const currentLine = lines[j].trim();

        if (!currentLine) {
          j++;
          continue;
        }

        entryLines.push(currentLine);

        // Stop after we find dates
        if (containsDate(currentLine) && entryLines.length >= 2) {
          j++;
          break;
        }

        // Stop if next line looks like a new job title
        if (j > i && hasJobKeyword && /Manager|Developer|Engineer|Analyst|Consultant|Designer|Director|Lead|Senior|Junior|Specialist|Officer|Executive|Admin|Trainer|Expert|Generalist|Account/i.test(currentLine)) {
          break;
        }

        j++;
      }

      // Parse the collected lines
      for (let idx = 0; idx < entryLines.length; idx++) {
        const entryLine = entryLines[idx];

        // First line is usually job title
        if (!entry.job_title) {
          entry.job_title = entryLine;
        }
        // Next line(s) could be company, description, or dates
        else if (!entry.company) {
          // If it has date pattern, it might be dates
          if (containsDate(entryLine)) {
            const dates = extractDates(entryLine);
            if (dates.start) entry.start_date = dates.start;
            if (dates.end) entry.end_date = dates.end;
            entry.still_work_here = dates.isPresent;
          }
          // If it looks like a company name (capitalized, not too long, no date keywords)
          else if (/^[A-Z][a-zA-Z0-9\s&,'-]*$/i.test(entryLine) && entryLine.length < 80) {
            entry.company = entryLine;
          }
        }
        // Look for dates in subsequent lines
        else if (containsDate(entryLine)) {
          const dates = extractDates(entryLine);
          if (dates.start && !entry.start_date) entry.start_date = dates.start;
          if (dates.end && !entry.end_date) entry.end_date = dates.end;
          entry.still_work_here = dates.isPresent;
        }
      }

      // Add entry if we have at least job title and company
      if (entry.job_title && entry.company) {
        experiences.push(entry as ParsedWorkExperience);
      }

      i = j;
    } else {
      i++;
    }
  }

  return experiences;
}

/**
 * Parse certification entries
 */
function parseCertifications(lines: string[]): ParsedCertification[] {
  const certifications: ParsedCertification[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract date if present
    const dates = extractDates(line);
    const date = dates.start || '';
    
    // Remove date from line to get course name
    const courseName = line.replace(/\d{4}|\d{1,2}\/\d{4}|\w+\s+\d{4}/g, '').trim();
    
    if (courseName.length > 3) {
      certifications.push({
        course_name: courseName,
        certification_type: 'Certificate',
        date_attained: date,
        details: '',
      });
    }
  }
  
  return certifications;
}

/**
 * Parse skills
 */
function parseSkills(lines: string[]): string[] {
  const skills: string[] = [];
  
  for (const line of lines) {
    // Split by common delimiters
    const parts = line.split(/[,;|•·]/);
    for (const part of parts) {
      const skill = part.trim();
      if (skill.length > 2 && skill.length < 50) {
        skills.push(skill);
      }
    }
  }
  
  return skills;
}

/**
 * Check if line contains a date
 */
function containsDate(line: string): boolean {
  return DATE_PATTERNS.some(pattern => pattern.test(line));
}

/**
 * Extract dates from a line - improved to handle various date formats
 */
function extractDates(line: string): {
  start: string;
  end: string | null;
  isPresent: boolean;
} {
  const result = {
    start: '',
    end: null as string | null,
    isPresent: false,
  };

  // Check for "present" keywords
  result.isPresent = PRESENT_KEYWORDS.some(keyword =>
    new RegExp(`\\b${keyword}\\b`, 'i').test(line)
  );

  // Try Month Year - Month Year pattern first (most common in LinkedIn CVs)
  // Matches: "January 2020 - Present", "Jan 2020 - Dec 2024", etc.
  let match = line.match(/(\w+)\s+(\d{4})\s*[-–]\s*(?:(\w+)\s+)?(\d{4}|\w+)?/);
  if (match) {
    const startMonth = getMonthNumber(match[1]);
    const startYear = match[2];
    result.start = `${startYear}-${startMonth.toString().padStart(2, '0')}-01`;

    // If end date exists and it's not "Present"
    if (match[4] && !result.isPresent) {
      if (match[3]) {
        // Month Year provided
        const endMonth = getMonthNumber(match[3]);
        result.end = `${match[4]}-${endMonth.toString().padStart(2, '0')}-01`;
      } else {
        // Just year provided
        result.end = `${match[4]}-01-01`;
      }
    }
    return result;
  }

  // Try Year - Year pattern: 2020 - 2024
  match = line.match(/\b(\d{4})\s*[-–]\s*(\d{4})\b/);
  if (match) {
    result.start = `${match[1]}-01-01`;
    if (!result.isPresent) {
      result.end = `${match[2]}-01-01`;
    }
    return result;
  }

  // Try Month/Year format: 01/2020
  match = line.match(/(\d{1,2})\/(\d{4})/);
  if (match) {
    const month = match[1].padStart(2, '0');
    result.start = `${match[2]}-${month}-01`;
    return result;
  }

  // Try single Month Year: January 2020 or Jan 2020
  match = line.match(/(\w+)\s+(\d{4})/);
  if (match && match[1].match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
    const month = getMonthNumber(match[1]);
    result.start = `${match[2]}-${month.toString().padStart(2, '0')}-01`;
    return result;
  }

  // Try duration format: 6 years 1 month (extract years as duration)
  match = line.match(/(\d+)\s+years?(?:\s+(\d+)\s+months?)?/i);
  if (match && result.isPresent) {
    const years = parseInt(match[1]);
    // Assume duration started (years) ago
    const now = new Date();
    const startYear = now.getFullYear() - years;
    result.start = `${startYear}-01-01`;
    return result;
  }

  return result;
}

/**
 * Convert month name to number
 */
function getMonthNumber(month: string): number {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthLower = month.toLowerCase().substring(0, 3);
  const index = months.indexOf(monthLower);
  return index >= 0 ? index + 1 : 1;
}
