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

export const BiographyWordCloud = () => {
  const { user } = useAuth();
  const [words, setWords] = useState<WordFrequency[]>([]);

  useEffect(() => {
    if (!user?.profile) return;

    const bio = (user.profile as { bio?: string }).bio || '';
    
    if (!bio) return;

    // Extract words and count frequency, filtering for meaningful nouns and verbs
    const wordCounts: { [key: string]: number } = {};
    const cleanedText = bio
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

    // Convert to array and sort by frequency
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25); // Top 25 words

    if (sortedWords.length === 0) {
      setWords([]);
      return;
    }

    const maxCount = sortedWords[0]?.[1] || 1;
    const minCount = sortedWords[sortedWords.length - 1]?.[1] || 1;

    // Create word cloud data with random positioning
    const cloudWords = sortedWords.map(([text, count], index) => {
      // Size based on frequency (much larger range for bigger words)
      const normalizedSize = ((count - minCount) / (maxCount - minCount)) * 200 + 80;
      
      // More varied rotations including vertical orientations
      const rotations = [0, 0, 90, -90, 45, -45, 30, -30, 60, -60, 15, -15, 75, -75];
      const rotation = rotations[Math.floor(Math.random() * rotations.length)];
      
      // Position with better spacing - use grid-like positions with random offset
      const cols = 5;
      const rows = Math.ceil(sortedWords.length / cols);
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      // Calculate position with spacing
      const xBase = (100 / (cols + 1)) * (col + 1);
      const yBase = (100 / (rows + 1)) * (row + 1);
      
      // Add random offset for organic look
      const xOffset = (Math.random() - 0.5) * 15;
      const yOffset = (Math.random() - 0.5) * 15;
      
      const x = Math.max(10, Math.min(90, xBase + xOffset));
      const y = Math.max(10, Math.min(90, yBase + yOffset));
      
      return {
        text,
        value: count,
        color: COLORS[index % COLORS.length],
        size: normalizedSize,
        x,
        y,
        rotation
      };
    });

    setWords(cloudWords);
  }, [user]);

  if (!user?.profile) return null;

  const bio = (user.profile as { bio?: string }).bio || '';

  if (!bio || words.length === 0) {
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
          <div className="relative w-full h-[320px]">
            {words.map((word, index) => (
              <div
                key={index}
                className="absolute font-bold cursor-pointer transition-all duration-300 hover:scale-110 hover:z-50 whitespace-nowrap"
                style={{
                  left: `${word.x}%`,
                  top: `${word.y}%`,
                  fontSize: `${Math.max(16, word.size / 3.5)}px`,
                  color: word.color,
                  transform: `translate(-50%, -50%) rotate(${word.rotation}deg)`,
                  textShadow: '1px 1px 2px rgba(255,255,255,0.8)',
                  fontWeight: 600 + (word.value * 100),
                  animation: `cloudFadeIn 0.8s ease-out ${index * 0.05}s both`,
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
