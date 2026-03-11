import { ParsedData } from './pdf-parser';

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

    console.log('CV parsed successfully by FastAPI service:', parsedData);
    return parsedData;

  } catch (error) {
    if (error instanceof Error) {
      console.error('CV Parser API error:', error.message);
      throw error;
    }
    throw new Error('Unknown error occurred while parsing CV');
  }
}
