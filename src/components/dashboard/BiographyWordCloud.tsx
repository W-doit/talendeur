import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface WordFrequency {
  text: string;
  value: number;
  color: string;
  size: number;
  x: number;
  y: number;
  rotation: number;
}

const COLORS = ['#9EBC9E', '#CFC6B8', '#FFCFD2', '#FFAFC5', '#AA778A', '#553E4E'];

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'can', 'that', 'this', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
  'its', 'our', 'their', 'me', 'him', 'them', 'us', 'am', 'been', 'being',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down',
  'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'now', 'also', 'well'
]);

// Common nouns and verbs (expanded list for better filtering)
const MEANINGFUL_WORDS = new Set([
  // Professional nouns
  'team', 'project', 'experience', 'work', 'role', 'position', 'skills', 'knowledge',
  'development', 'management', 'leadership', 'strategy', 'innovation', 'results',
  'business', 'client', 'customer', 'product', 'service', 'solution', 'technology',
  'design', 'research', 'analysis', 'data', 'system', 'process', 'quality', 'growth',
  'success', 'achievement', 'goal', 'objective', 'performance', 'delivery', 'value',
  'collaboration', 'communication', 'organization', 'company', 'industry', 'market',
  'sales', 'marketing', 'finance', 'operations', 'engineering', 'software', 'platform',
  'infrastructure', 'architecture', 'implementation', 'optimization', 'efficiency',
  'improvement', 'transformation', 'initiative', 'program', 'budget', 'timeline',
  'stakeholder', 'partner', 'vendor', 'resource', 'talent', 'people', 'culture',
  
  // Action verbs
  'lead', 'manage', 'develop', 'create', 'build', 'design', 'implement', 'execute',
  'deliver', 'achieve', 'improve', 'optimize', 'drive', 'grow', 'increase', 'enhance',
  'establish', 'launch', 'coordinate', 'collaborate', 'communicate', 'present', 'report',
  'analyze', 'evaluate', 'assess', 'monitor', 'track', 'measure', 'identify', 'solve',
  'resolve', 'support', 'provide', 'ensure', 'maintain', 'oversee', 'supervise', 'mentor',
  'train', 'coach', 'guide', 'facilitate', 'negotiate', 'plan', 'organize', 'prioritize',
  'streamline', 'automate', 'innovate', 'transform', 'modernize', 'scale', 'expand',
  'integrate', 'deploy', 'migrate', 'upgrade', 'troubleshoot', 'debug', 'test', 'review'
]);

interface BiographyWordCloudProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const BiographyWordCloud = ({ userId, accessTokenOverride }: BiographyWordCloudProps = {}) => {
  const { user, accessToken } = useAuth();
  const [words, setWords] = useState<WordFrequency[]>([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const effectiveUserId = userId ?? user?.id;
      const effectiveToken = accessTokenOverride !== undefined ? (accessTokenOverride || supabaseKey) : (accessToken || supabaseKey);
      if (!effectiveUserId) return;

      try {
        const headers = {
          apikey: supabaseKey,
          Authorization: `Bearer ${effectiveToken}`,
        };

        // Fetch all profile-related data in parallel
        const [workResponse, educationResponse, certificationsResponse, profileResponse] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/work_experience?user_id=eq.${effectiveUserId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/education_history?user_id=eq.${effectiveUserId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/certifications?user_id=eq.${effectiveUserId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/profile?user_id=eq.${effectiveUserId}&select=bio`, { headers }),
        ]);

        const [workData, educationData, certificationsData, profileData] = await Promise.all([
          workResponse.ok ? workResponse.json() : Promise.resolve([]),
          educationResponse.ok ? educationResponse.json() : Promise.resolve([]),
          certificationsResponse.ok ? certificationsResponse.json() : Promise.resolve([]),
          profileResponse.ok ? profileResponse.json() : Promise.resolve([]),
        ]);

        // Combine all text sources
        const textSources = [];
        
        // Add bio
        const bio = profileData?.[0]?.bio || '';
        if (bio) textSources.push(bio);

        // Add work experience
        workData.forEach((work: any) => {
          if (work.job_title) textSources.push(work.job_title);
          if (work.company) textSources.push(work.company);
        });

        // Add education
        educationData.forEach((edu: any) => {
          if (edu.institution) textSources.push(edu.institution);
          if (edu.qualification_type) textSources.push(edu.qualification_type);
          if (edu.subject) textSources.push(edu.subject);
        });

        // Add certifications
        certificationsData.forEach((cert: any) => {
          if (cert.course_name) textSources.push(cert.course_name);
          if (cert.certification_type) textSources.push(cert.certification_type);
        });

        if (textSources.length === 0) {
          setWords([]);
          return;
        }

        // Combine all text
        const combinedText = textSources.join(' ');

        // Extract words and count frequency, filtering for meaningful nouns and verbs
        const wordCounts: { [key: string]: number } = {};
        const cleanedText = combinedText
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => 
            word.length > 3 && 
            !STOP_WORDS.has(word) &&
            MEANINGFUL_WORDS.has(word) // Only include nouns and verbs
          );

        cleanedText.forEach(word => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });

    cleanedText.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Convert to array and sort by frequency
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20); // Top 20 words

    if (sortedWords.length === 0) {
      setWords([]);
      return;
    }

    const maxCount = sortedWords[0]?.[1] || 1;
    const minCount = sortedWords[sortedWords.length - 1]?.[1] || 1;

    // Simple collision detection helper
    const hasCollision = (x: number, y: number, size: number, rotation: number, placedWords: WordFrequency[]) => {
      const buffer = 15; // Minimum distance between words
      for (const word of placedWords) {
        const distance = Math.sqrt(Math.pow(x - word.x, 2) + Math.pow(y - word.y, 2));
        const minDistance = (size + word.size) / 6 + buffer; // Scale based on combined sizes
        if (distance < minDistance) {
          return true;
        }
      }
      return false;
    };

    // Create word cloud data with collision avoidance
    const cloudWords: WordFrequency[] = [];
    
    sortedWords.forEach(([text, count], index) => {
      // Size based on frequency with bigger range
      const normalizedSize = ((count - minCount) / (maxCount - minCount)) * 260 + 100;
      
      // Varied rotations
      const rotations = [0, 0, 0, 0, 90, -90, 45, -45, 30, -30, 15, -15];
      const rotation = rotations[Math.floor(Math.random() * rotations.length)];
      
      let x = 0, y = 0;
      let attempts = 0;
      const maxAttempts = 100;
      
      // Try to find non-colliding position
      if (index < 5) {
        // Top 5 words - center-left area
        while (attempts < maxAttempts) {
          x = 20 + Math.random() * 40;
          y = 25 + Math.random() * 50;
          if (!hasCollision(x, y, normalizedSize, rotation, cloudWords)) break;
          attempts++;
        }
      } else {
        // Rest spread out more, biased towards center-left
        while (attempts < maxAttempts) {
          x = 10 + Math.random() * 60;
          y = 10 + Math.random() * 80;
          if (!hasCollision(x, y, normalizedSize, rotation, cloudWords)) break;
          attempts++;
        }
      }
      
      cloudWords.push({
        text,
        value: count,
        color: COLORS[index % COLORS.length],
        size: normalizedSize,
        x: Math.max(12, Math.min(88, x)),
        y: Math.max(12, Math.min(88, y)),
        rotation: index < 5 ? [0, 0, 0, 15, -15][Math.floor(Math.random() * 5)] : rotation
      });
    });

    setWords(cloudWords);
      } catch (error) {
        console.error('Error fetching profile data for word cloud:', error);
        setWords([]);
      }
    };

    fetchProfileData();
  }, [user, accessToken, userId, accessTokenOverride]);

  if (words.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You in a Wordcloud</CardTitle>
          <CardDescription>Most significant nouns and verbs from your profile</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No meaningful keywords found. Add more details about your experience and skills.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>You in a Wordcloud</CardTitle>
        <CardDescription>
          Top {words.length} nouns and verbs highlighting your expertise
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-lg border border-gray-200 p-6 overflow-hidden">
          <div className="relative w-full h-[350px]">
            {words.map((word, index) => (
              <div
                key={index}
                className="absolute font-bold cursor-pointer transition-all duration-300 hover:scale-110 hover:z-50"
                style={{
                  left: `${word.x}%`,
                  top: `${word.y}%`,
                  fontSize: `${Math.max(18, word.size / 3)}px`,
                  color: word.color,
                  transform: `translate(-50%, -50%) rotate(${word.rotation}deg)`,
                  textShadow: '2px 2px 4px rgba(255,255,255,0.9)',
                  fontWeight: 600 + (word.value * 100),
                  animation: `cloudFadeIn 0.8s ease-out ${index * 0.05}s both`,
                  whiteSpace: 'nowrap',
                }}
                title={`"${word.text}" appears ${word.value} time${word.value !== 1 ? 's' : ''}`}
              >
                {word.text}
              </div>
            ))}
          </div>
        </div>

        {/* Top Words Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {words.slice(0, 5).map((word, index) => (
            <div 
              key={index}
              className="text-center p-3 rounded-lg border-2 hover:shadow-md transition-all hover:scale-105"
              style={{ borderColor: word.color }}
            >
              <div className="text-2xl font-bold" style={{ color: word.color }}>
                #{index + 1}
              </div>
              <div className="text-sm font-semibold text-gray-700 mt-1 capitalize">
                {word.text}
              </div>
              <div className="text-xs text-gray-500">
                {word.value}x
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes cloudFadeIn {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg) scale(0.3);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) rotate(var(--rotation)) scale(1);
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
};
