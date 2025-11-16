import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface WordFrequency {
  text: string;
  value: number;
  color: string;
  size: number;
}

const COLORS = ['#D1163E', '#E30F68', '#FF9F14', '#180D51', '#10B981'];
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'can', 'that', 'this', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
  'its', 'our', 'their', 'me', 'him', 'them', 'us'
]);

export const BiographyWordCloud = () => {
  const { user } = useAuth();
  const [words, setWords] = useState<WordFrequency[]>([]);

  useEffect(() => {
    if (!user?.profile) return;

    const bio = (user.profile as { bio?: string }).bio || '';
    
    if (!bio) return;

    // Extract words and count frequency
    const wordCounts: { [key: string]: number } = {};
    const cleanedText = bio
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !STOP_WORDS.has(word));

    cleanedText.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Convert to array and sort by frequency
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30); // Top 30 words

    const maxCount = sortedWords[0]?.[1] || 1;
    const minCount = sortedWords[sortedWords.length - 1]?.[1] || 1;

    // Create word cloud data
    const cloudWords = sortedWords.map(([text, count], index) => {
      const normalizedSize = ((count - minCount) / (maxCount - minCount)) * 100 + 50;
      return {
        text,
        value: count,
        color: COLORS[index % COLORS.length],
        size: normalizedSize
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
          <CardTitle>Biography Word Cloud</CardTitle>
          <CardDescription>Key themes and concepts from your profile</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-gray-500">
          No biography text available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biography Word Cloud</CardTitle>
        <CardDescription>
          Most frequently used words in your profile ({words.length} key terms)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-8 min-h-[400px] flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full flex flex-wrap items-center justify-center gap-2">
            {words.map((word, index) => (
              <span
                key={index}
                className="inline-block font-bold cursor-pointer transition-all duration-300 hover:scale-110 hover:opacity-80"
                style={{
                  fontSize: `${Math.max(12, word.size / 5)}px`,
                  color: word.color,
                  padding: '4px 8px',
                  animation: `fadeIn 0.5s ease-in-out ${index * 0.05}s both`,
                  transform: `rotate(${Math.random() * 20 - 10}deg)`,
                }}
                title={`Used ${word.value} time${word.value !== 1 ? 's' : ''}`}
              >
                {word.text}
              </span>
            ))}
          </div>
        </div>

        {/* Top Words Summary */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          {words.slice(0, 5).map((word, index) => (
            <div 
              key={index}
              className="text-center p-3 rounded-lg border-2 hover:shadow-md transition-shadow"
              style={{ borderColor: word.color }}
            >
              <div className="text-2xl font-bold" style={{ color: word.color }}>
                #{index + 1}
              </div>
              <div className="text-sm font-semibold text-gray-700 mt-1">
                {word.text}
              </div>
              <div className="text-xs text-gray-500">
                {word.value}x
              </div>
            </div>
          ))}
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.8) rotate(0deg);
            }
            to {
              opacity: 1;
              transform: scale(1) rotate(var(--rotation));
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
};
