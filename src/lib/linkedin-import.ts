// LinkedIn OAuth API integration
// Uses LinkedIn OAuth 2.0 to import user profile data

// Add these to your .env file:
// VITE_LINKEDIN_CLIENT_ID=your_client_id
// VITE_LINKEDIN_REDIRECT_URI=http://localhost:8080/profile

export interface LinkedInProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

export interface LinkedInPosition {
  companyName: string;
  title: string;
  description?: string;
  startDate: {
    year: number;
    month: number;
  };
  endDate?: {
    year: number;
    month: number;
  } | null;
  location?: string;
}

export interface LinkedInEducation {
  schoolName: string;
  degreeName?: string;
  fieldOfStudy?: string;
  startDate?: {
    year: number;
    month: number;
  };
  endDate?: {
    year: number;
    month: number;
  };
}

export interface LinkedInData {
  profile: LinkedInProfile;
  positions?: LinkedInPosition[];
  education?: LinkedInEducation[];
  skills?: string[];
}

const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI = import.meta.env.VITE_LINKEDIN_REDIRECT_URI;
const LINKEDIN_SCOPE = 'openid profile email';

/**
 * Initiate LinkedIn OAuth flow
 * Redirects user to LinkedIn authorization page
 */
export function initiateLinkedInAuth(): void {
  console.log('LinkedIn Client ID:', LINKEDIN_CLIENT_ID);
  console.log('LinkedIn Redirect URI:', LINKEDIN_REDIRECT_URI);
  
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_REDIRECT_URI) {
    console.error('Missing LinkedIn credentials in environment variables');
    alert('LinkedIn credentials not configured. Check your .env file.');
    return;
  }

  const state = generateRandomString(16);
  sessionStorage.setItem('linkedin_oauth_state', state);

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', LINKEDIN_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', LINKEDIN_REDIRECT_URI);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', LINKEDIN_SCOPE);

  console.log('Redirecting to LinkedIn:', authUrl.toString());
  window.location.href = authUrl.toString();
}

/**
 * Handle OAuth callback and exchange code for access token
 */
export async function handleLinkedInCallback(code: string, state: string): Promise<LinkedInData | null> {
  // Verify state to prevent CSRF
  const savedState = sessionStorage.getItem('linkedin_oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter');
  }
  sessionStorage.removeItem('linkedin_oauth_state');

  try {
    // Exchange code for access token via Supabase Edge Function
    const tokenResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/linkedin-token`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ code, redirect_uri: LINKEDIN_REDIRECT_URI }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const { access_token } = await tokenResponse.json();

    // Fetch user profile data
    const linkedInData = await fetchLinkedInProfile(access_token);
    return linkedInData;
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return null;
  }
}

/**
 * Fetch LinkedIn profile data using access token
 */
async function fetchLinkedInProfile(accessToken: string): Promise<LinkedInData> {
  // Fetch basic profile
  const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch LinkedIn profile');
  }

  const profile: LinkedInProfile = await profileResponse.json();

  // Note: LinkedIn deprecated profile API v1
  // To get positions/education, you need LinkedIn Partner Program access
  // For now, we only get basic profile info
  // You can add more endpoints if you have partner access

  return {
    profile,
    positions: [],
    education: [],
    skills: [],
  };
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if we're returning from LinkedIn OAuth
 */
export function isLinkedInCallback(): { code: string; state: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  if (code && state) {
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return { code, state };
  }
  
  return null;
}

/**
 * Map LinkedIn API data to our database schema
 */
export function mapLinkedInToProfile(linkedinData: LinkedInData) {
  const { profile, positions, education, skills } = linkedinData;

  return {
    profile: {
      first_name: profile.given_name || '',
      surname: profile.family_name || '',
      bio: '',
      email: profile.email || '',
      profile_pic: profile.picture || '',
    },
    workExperience: positions?.map(pos => ({
      company: pos.companyName,
      title: pos.title,
      description: pos.description || '',
      start_date: `${pos.startDate.year}-${String(pos.startDate.month).padStart(2, '0')}-01`,
      end_date: pos.endDate ? `${pos.endDate.year}-${String(pos.endDate.month).padStart(2, '0')}-01` : null,
    })) || [],
    education: education?.map(edu => ({
      school: edu.schoolName,
      degree: edu.degreeName || '',
      field: edu.fieldOfStudy || '',
      start_date: edu.startDate ? `${edu.startDate.year}-${String(edu.startDate.month).padStart(2, '0')}-01` : '',
      end_date: edu.endDate ? `${edu.endDate.year}-${String(edu.endDate.month).padStart(2, '0')}-01` : '',
    })) || [],
    skills: skills || [],
  };
}
