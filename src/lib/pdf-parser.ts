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

export interface ParsedData {
  profile: ParsedProfile;
  education: ParsedEducation[];
  workExperience: ParsedWorkExperience[];
  certifications: ParsedCertification[];
  skills: string[];
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

// Date patterns to extract dates
const DATE_PATTERNS = [
  /(\d{4})\s*-\s*(\d{4})/,  // 2020 - 2024
  /(\d{4})\s*–\s*(\d{4})/,  // 2020 – 2024 (en dash)
  /(\w+)\s+(\d{4})\s*-\s*(\w+)?\s*(\d{4})?/,  // Jan 2020 - Dec 2024
  /(\d{1,2})\/(\d{4})/,  // 01/2020
  /(\w+)\s+(\d{4})/,  // January 2020
];

const PRESENT_KEYWORDS = ['present', 'current', 'now', 'ongoing', 'today'];

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
 * Parse education entries
 */
function parseEducation(lines: string[]): ParsedEducation[] {
  const educationEntries: ParsedEducation[] = [];
  let currentEntry: Partial<ParsedEducation> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for institution (usually has keywords or is capitalized)
    if (/University|College|School|Institute/i.test(line) || /^[A-Z][a-z\s&,]+$/.test(line)) {
      // Save previous entry if complete
      if (currentEntry.institution && currentEntry.qualification_type) {
        educationEntries.push(currentEntry as ParsedEducation);
      }
      
      currentEntry = {
        institution: line,
        qualification_type: '',
        subject: '',
        start_date: '',
        end_date: null,
        still_studying: false,
      };
    }
    // Check for degree/qualification
    else if (/Bachelor|Master|PhD|Doctorate|Degree|Diploma|Certificate/i.test(line)) {
      currentEntry.qualification_type = line;
      // Extract subject if it's in the same line
      const subjectMatch = line.match(/in\s+(.+)/i);
      if (subjectMatch) {
        currentEntry.subject = subjectMatch[1];
      }
    }
    // Check for dates
    else if (containsDate(line)) {
      const dates = extractDates(line);
      if (dates.start) currentEntry.start_date = dates.start;
      if (dates.end) {
        currentEntry.end_date = dates.end;
      }
      currentEntry.still_studying = dates.isPresent;
    }
  }
  
  // Save last entry
  if (currentEntry.institution && currentEntry.qualification_type) {
    educationEntries.push(currentEntry as ParsedEducation);
  }
  
  return educationEntries;
}

/**
 * Parse work experience entries
 */
function parseWorkExperience(lines: string[]): ParsedWorkExperience[] {
  const experiences: ParsedWorkExperience[] = [];
  let currentEntry: Partial<ParsedWorkExperience> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for job title (usually before company or has certain keywords)
    if (!currentEntry.job_title && /Manager|Developer|Engineer|Analyst|Consultant|Designer|Director|Lead|Senior|Junior/i.test(line)) {
      // Save previous entry if complete
      if (currentEntry.job_title && currentEntry.company) {
        experiences.push(currentEntry as ParsedWorkExperience);
      }
      
      currentEntry = {
        job_title: line,
        company: '',
        start_date: '',
        end_date: null,
        still_work_here: false,
      };
    }
    // Check for company (often follows job title or has 'at' keyword)
    else if (currentEntry.job_title && !currentEntry.company) {
      // Remove 'at' if present
      const company = line.replace(/^at\s+/i, '').trim();
      if (company.length > 2) {
        currentEntry.company = company;
      }
    }
    // Check for dates
    else if (containsDate(line)) {
      const dates = extractDates(line);
      if (dates.start) currentEntry.start_date = dates.start;
      if (dates.end) {
        currentEntry.end_date = dates.end;
      }
      currentEntry.still_work_here = dates.isPresent;
    }
  }
  
  // Save last entry
  if (currentEntry.job_title && currentEntry.company) {
    experiences.push(currentEntry as ParsedWorkExperience);
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
 * Extract dates from a line
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
    new RegExp(keyword, 'i').test(line)
  );
  
  // Try different date patterns
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      // Format varies by pattern
      if (match[1] && match[1].match(/^\d{4}$/)) {
        // Year format: 2020 - 2024
        result.start = `${match[1]}-01-01`;
        if (match[2] && !result.isPresent) {
          result.end = `${match[2]}-01-01`;
        }
      } else if (match[1] && match[2] && match[2].match(/^\d{4}$/)) {
        // Month Year format: Jan 2020
        const monthNum = getMonthNumber(match[1]);
        result.start = `${match[2]}-${monthNum.toString().padStart(2, '0')}-01`;
        
        if (match[3] && match[4] && !result.isPresent) {
          const endMonthNum = getMonthNumber(match[3]);
          result.end = `${match[4]}-${endMonthNum.toString().padStart(2, '0')}-01`;
        }
      }
      break;
    }
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
