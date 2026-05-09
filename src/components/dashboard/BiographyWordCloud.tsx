import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Wordcloud from '@visx/wordcloud/lib/Wordcloud';
import { Text } from '@visx/text';

interface WordData {
  text: string;
  value: number;
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

// Extended stop words to filter out more generic terms
const EXTENDED_STOP_WORDS = new Set([
  ...STOP_WORDS,
  // Time-related
  'year', 'years', 'month', 'months', 'day', 'days', 'time', 'date',
  // Common generic words
  'work', 'working', 'worked', 'experience', 'including', 'various', 'several',
  'many', 'multiple', 'different', 'various', 'general', 'specific', 'related',
  'based', 'using', 'used', 'made', 'within', 'across', 'throughout'
]);

interface BiographyWordCloudProps {
  userId?: string;
  accessTokenOverride?: string | null;
}

export const BiographyWordCloud = ({ userId, accessTokenOverride }: BiographyWordCloudProps = {}) => {
  const { user, accessToken } = useAuth();
  const [words, setWords] = useState<WordData[]>([]);

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
        const [workResponse, educationResponse, certificationsResponse, profileResponse, skillsResponse] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/work_experience?user_id=eq.${effectiveUserId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/education_history?user_id=eq.${effectiveUserId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/certifications?user_id=eq.${effectiveUserId}&select=*`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/profile?user_id=eq.${effectiveUserId}&select=bio`, { headers }),
          fetch(`${supabaseUrl}/rest/v1/jobseeker_skill_rating?user_id=eq.${effectiveUserId}&select=interests`, { headers }),
        ]);

        const [workData, educationData, certificationsData, profileData, skillsData] = await Promise.all([
          workResponse.ok ? workResponse.json() : Promise.resolve([]),
          educationResponse.ok ? educationResponse.json() : Promise.resolve([]),
          certificationsResponse.ok ? certificationsResponse.json() : Promise.resolve([]),
          profileResponse.ok ? profileResponse.json() : Promise.resolve([]),
          skillsResponse.ok ? skillsResponse.json() : Promise.resolve([]),
        ]);

        // Combine all text sources
        const textSources = [];
        
        // Add bio
        const bio = profileData?.[0]?.bio || '';
        if (bio) textSources.push(bio);

        // Add interests (these are important!)
        const interests = skillsData?.[0]?.interests || [];
        if (Array.isArray(interests)) {
          interests.forEach((interest: string) => {
            if (interest) textSources.push(interest);
          });
        }

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
          if (cert.details) textSources.push(cert.details);
        });

        if (textSources.length === 0) {
          setWords([]);
          return;
        }

        // Combine all text
        const combinedText = textSources.join(' ');

        // Extract words and count frequency, filtering out stop words only
        const wordCounts: { [key: string]: number } = {};
        const cleanedText = combinedText
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(word => 
            word.length > 3 && 
            !EXTENDED_STOP_WORDS.has(word) &&
            !/^\d+$/.test(word) // Exclude pure numbers
          );

        cleanedText.forEach(word => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });

        // Convert to array and sort by frequency
        const sortedWords = Object.entries(wordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 25) // Top 25 words
          .map(([text, value]) => ({ text, value }));

        setWords(sortedWords);
      } catch (error) {
        console.error('Error fetching profile data for word cloud:', error);
        setWords([]);
      }
    };

    fetchProfileData();
  }, [user, accessToken, userId, accessTokenOverride]);

  const colors = COLORS;
  const fontScale = useMemo(() => {
    const maxValue = Math.max(...words.map(w => w.value), 1);
    const minValue = Math.min(...words.map(w => w.value), 1);
    return (word: WordData) => {
      const value = word.value;
      const normalized = (value - minValue) / (maxValue - minValue || 1);
      const fontSize = 24 + normalized * 56;
      return fontSize; // Font size range: 24-80px
    };
  }, [words]);

  if (words.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You in a Wordcloud</CardTitle>
          <CardDescription>Most frequent words from your entire profile</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No keywords found. Add more details to your bio, interests, experience, education, and certifications.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>You in a Wordcloud</CardTitle>
        <CardDescription>
          Top {words.length} words from your bio, interests, experience, education, and certifications
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        <div className="relative bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30 rounded-lg border border-gray-200 p-3">
          <svg width="100%" height="240" viewBox="0 0 700 240">
            <Wordcloud
              words={words}
              width={700}
              height={240}
              fontSize={fontScale}
              font="Raleway, sans-serif"
              padding={2}
              spiral="archimedean"
              rotate={() => {
                const rotations = [0, 0, 0, 0, 90, -90];
                return rotations[Math.floor(Math.random() * rotations.length)];
              }}
              random={() => 0.5}
            >
              {(cloudWords) => cloudWords.map((w, i) => (
                    <Text
                      key={w.text}
                      fill={colors[i % colors.length]}
                      textAnchor="middle"
                      transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                      fontSize={w.size}
                      fontFamily={w.font}
                      fontWeight={600}
                      style={{
                        cursor: 'pointer',
                      }}
                    >
                      {w.text}
                    </Text>
                  ))}
            </Wordcloud>
          </svg>
        </div>

        {/* Top Words Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          {words.slice(0, 5).map((word, index) => (
            <div 
              key={index}
              className="text-center p-3 rounded-lg border-2 hover:shadow-md transition-all hover:scale-105"
              style={{ borderColor: colors[index % colors.length] }}
            >
              <div className="text-2xl font-bold" style={{ color: colors[index % colors.length] }}>
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
      </CardContent>
    </Card>
  );
};
