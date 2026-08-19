import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, CheckCircle } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  trait: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';
  facet: string;
  reverse: boolean;
}

const QUESTIONS: Question[] = [
  // Openness (10 questions)
  { id: 1, text: "I have a vivid imagination", trait: "openness", facet: "imagination", reverse: false },
  { id: 2, text: "I am interested in abstract ideas", trait: "openness", facet: "intellect", reverse: false },
  { id: 3, text: "I love to explore new places", trait: "openness", facet: "adventurousness", reverse: false },
  { id: 4, text: "I appreciate art and beauty", trait: "openness", facet: "artistic_interests", reverse: false },
  { id: 5, text: "I experience my emotions intensely", trait: "openness", facet: "emotionality", reverse: false },
  { id: 6, text: "I prefer traditional approaches", trait: "openness", facet: "liberalism", reverse: true },
  { id: 7, text: "I enjoy trying new and exotic foods", trait: "openness", facet: "adventurousness", reverse: false },
  { id: 8, text: "I think deeply about philosophical questions", trait: "openness", facet: "intellect", reverse: false },
  { id: 9, text: "I am moved by poetry and music", trait: "openness", facet: "artistic_interests", reverse: false },
  { id: 10, text: "I daydream frequently", trait: "openness", facet: "imagination", reverse: false },
  
  // Conscientiousness (10 questions)
  { id: 11, text: "I am always prepared", trait: "conscientiousness", facet: "orderliness", reverse: false },
  { id: 12, text: "I pay attention to details", trait: "conscientiousness", facet: "orderliness", reverse: false },
  { id: 13, text: "I get tasks done right away", trait: "conscientiousness", facet: "self_discipline", reverse: false },
  { id: 14, text: "I follow a schedule", trait: "conscientiousness", facet: "dutifulness", reverse: false },
  { id: 15, text: "I strive for excellence", trait: "conscientiousness", facet: "achievement_striving", reverse: false },
  { id: 16, text: "I make a mess of things", trait: "conscientiousness", facet: "orderliness", reverse: true },
  { id: 17, text: "I complete tasks successfully", trait: "conscientiousness", facet: "self_efficacy", reverse: false },
  { id: 18, text: "I think things through before acting", trait: "conscientiousness", facet: "cautiousness", reverse: false },
  { id: 19, text: "I work hard to achieve my goals", trait: "conscientiousness", facet: "achievement_striving", reverse: false },
  { id: 20, text: "I waste my time", trait: "conscientiousness", facet: "self_discipline", reverse: true },
  
  // Extraversion (10 questions)
  { id: 21, text: "I am the life of the party", trait: "extraversion", facet: "gregariousness", reverse: false },
  { id: 22, text: "I feel comfortable around people", trait: "extraversion", facet: "friendliness", reverse: false },
  { id: 23, text: "I start conversations", trait: "extraversion", facet: "assertiveness", reverse: false },
  { id: 24, text: "I am always on the go", trait: "extraversion", facet: "activity_level", reverse: false },
  { id: 25, text: "I love excitement", trait: "extraversion", facet: "excitement_seeking", reverse: false },
  { id: 26, text: "I am quiet around strangers", trait: "extraversion", facet: "friendliness", reverse: true },
  { id: 27, text: "I laugh a lot", trait: "extraversion", facet: "cheerfulness", reverse: false },
  { id: 28, text: "I take charge in group situations", trait: "extraversion", facet: "assertiveness", reverse: false },
  { id: 29, text: "I seek adventure", trait: "extraversion", facet: "excitement_seeking", reverse: false },
  { id: 30, text: "I keep in the background", trait: "extraversion", facet: "gregariousness", reverse: true },
  
  // Agreeableness (10 questions)
  { id: 31, text: "I am interested in people", trait: "agreeableness", facet: "sympathy", reverse: false },
  { id: 32, text: "I trust others", trait: "agreeableness", facet: "trust", reverse: false },
  { id: 33, text: "I believe others have good intentions", trait: "agreeableness", facet: "trust", reverse: false },
  { id: 34, text: "I help others feel at ease", trait: "agreeableness", facet: "cooperation", reverse: false },
  { id: 35, text: "I am modest and humble", trait: "agreeableness", facet: "modesty", reverse: false },
  { id: 36, text: "I insult people", trait: "agreeableness", facet: "morality", reverse: true },
  { id: 37, text: "I put others' needs before my own", trait: "agreeableness", facet: "altruism", reverse: false },
  { id: 38, text: "I am easy to get along with", trait: "agreeableness", facet: "cooperation", reverse: false },
  { id: 39, text: "I feel others' emotions", trait: "agreeableness", facet: "sympathy", reverse: false },
  { id: 40, text: "I suspect hidden motives in others", trait: "agreeableness", facet: "trust", reverse: true },
  
  // Neuroticism (10 questions)
  { id: 41, text: "I worry about things", trait: "neuroticism", facet: "anxiety", reverse: false },
  { id: 42, text: "I get stressed out easily", trait: "neuroticism", facet: "anxiety", reverse: false },
  { id: 43, text: "I get irritated easily", trait: "neuroticism", facet: "anger", reverse: false },
  { id: 44, text: "I feel blue or down", trait: "neuroticism", facet: "depression", reverse: false },
  { id: 45, text: "I am easily embarrassed", trait: "neuroticism", facet: "self_consciousness", reverse: false },
  { id: 46, text: "I remain calm in tense situations", trait: "neuroticism", facet: "anxiety", reverse: true },
  { id: 47, text: "I panic easily", trait: "neuroticism", facet: "vulnerability", reverse: false },
  { id: 48, text: "I eat too much", trait: "neuroticism", facet: "immoderation", reverse: false },
  { id: 49, text: "I get angry easily", trait: "neuroticism", facet: "anger", reverse: false },
  { id: 50, text: "I am relaxed most of the time", trait: "neuroticism", facet: "anxiety", reverse: true },
];

interface PersonalityTestProps {
  onSaveAndExit?: () => void;
}

const getStorageKey = (userId: string) => `personality-test-progress:${userId}`;

export const PersonalityTest = ({ onSaveAndExit }: PersonalityTestProps = {}) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [hasRestored, setHasRestored] = useState(false);

  const progress = (Object.keys(answers).length / QUESTIONS.length) * 100;
  const answeredCount = Object.keys(answers).length;

  const persistProgress = useCallback(
    (nextAnswers: { [key: number]: number }, nextQuestion: number) => {
      if (!user) return;
      try {
        localStorage.setItem(
          getStorageKey(user.id),
          JSON.stringify({
            answers: nextAnswers,
            currentQuestion: nextQuestion,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.warn('Failed to persist personality test progress:', error);
      }
    },
    [user]
  );

  const clearProgress = useCallback(() => {
    if (!user) return;
    try {
      localStorage.removeItem(getStorageKey(user.id));
    } catch (error) {
      console.warn('Failed to clear personality test progress:', error);
    }
  }, [user]);

  // Restore progress when the user returns
  useEffect(() => {
    if (!user) {
      setHasRestored(true);
      return;
    }

    try {
      const raw = localStorage.getItem(getStorageKey(user.id));
      if (raw) {
        const saved = JSON.parse(raw) as {
          answers?: Record<string, number>;
          currentQuestion?: number;
        };
        const restored: { [key: number]: number } = {};
        if (saved.answers) {
          Object.entries(saved.answers).forEach(([key, value]) => {
            restored[Number(key)] = value;
          });
        }

        setAnswers(restored);
        setAllQuestionsAnswered(Object.keys(restored).length === QUESTIONS.length);

        const firstUnanswered = QUESTIONS.findIndex((_, idx) => !(idx in restored));
        const savedQuestion =
          typeof saved.currentQuestion === 'number' ? saved.currentQuestion : 0;
        const resumeAt =
          firstUnanswered !== -1
            ? firstUnanswered
            : Math.min(Math.max(0, savedQuestion), QUESTIONS.length - 1);
        setCurrentQuestion(resumeAt);
      }
    } catch (error) {
      console.warn('Failed to restore personality test progress:', error);
    } finally {
      setHasRestored(true);
    }
  }, [user?.id]);

  // Auto-save as the user progresses
  useEffect(() => {
    if (!user || !hasRestored || isComplete) return;
    if (Object.keys(answers).length === 0 && currentQuestion === 0) return;
    persistProgress(answers, currentQuestion);
  }, [answers, currentQuestion, user, hasRestored, isComplete, persistProgress]);

  const handleAnswer = (score: number) => {
    const newAnswers = { ...answers, [currentQuestion]: score };
    setAnswers(newAnswers);

    // Check if all questions are answered
    if (Object.keys(newAnswers).length === QUESTIONS.length) {
      setAllQuestionsAnswered(true);
    }

    // Move to next question if not at the end
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || Object.keys(answers).length !== QUESTIONS.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSaving(true);

    // Calculate trait scores
    const traitScores: { [key: string]: number[] } = {
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      neuroticism: [],
    };

    const facetScores: { [key: string]: number[] } = {};

    QUESTIONS.forEach((q, idx) => {
      const score = answers[idx];
      if (!score) return; // Skip unanswered
      
      const adjustedScore = q.reverse ? 6 - score : score;
      
      traitScores[q.trait].push(adjustedScore);
      
      if (!facetScores[q.facet]) {
        facetScores[q.facet] = [];
      }
      facetScores[q.facet].push(adjustedScore);
    });

    // Calculate averages (0-100 scale)
    const calculateAverage = (scores: number[]) => 
      ((scores.reduce((a, b) => a + b, 0) / scores.length) / 5) * 100;

    const traits = {
      openness: calculateAverage(traitScores.openness),
      conscientiousness: calculateAverage(traitScores.conscientiousness),
      extraversion: calculateAverage(traitScores.extraversion),
      agreeableness: calculateAverage(traitScores.agreeableness),
      neuroticism: calculateAverage(traitScores.neuroticism),
    };

    const facets: { [key: string]: number } = {};
    Object.keys(facetScores).forEach(facet => {
      facets[facet] = calculateAverage(facetScores[facet]);
    });

    try {
      console.log('Saving personality test results for user:', user.id);
      console.log('Traits:', traits);
      console.log('Facets:', facets);

      // First check if user already has personality traits
      const { data: existingTraits } = await supabase
        .from('personality_traits')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let traitsData;
      
      if (existingTraits) {
        // Update existing record
        const { data, error: traitsError } = await supabase
          .from('personality_traits')
          .update({
            openness: Math.round(traits.openness),
            conscientiousness: Math.round(traits.conscientiousness),
            extraversion: Math.round(traits.extraversion),
            agreeableness: Math.round(traits.agreeableness),
            neuroticism: Math.round(traits.neuroticism),
            test_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (traitsError) {
          console.error('Error updating traits:', traitsError);
          throw traitsError;
        }
        traitsData = data;
      } else {
        // Insert new record
        const { data, error: traitsError } = await supabase
          .from('personality_traits')
          .insert({
            user_id: user.id,
            openness: Math.round(traits.openness),
            conscientiousness: Math.round(traits.conscientiousness),
            extraversion: Math.round(traits.extraversion),
            agreeableness: Math.round(traits.agreeableness),
            neuroticism: Math.round(traits.neuroticism),
            test_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (traitsError) {
          console.error('Error inserting traits:', traitsError);
          throw traitsError;
        }
        traitsData = data;
      }
      
      console.log('Traits saved successfully:', traitsData);

      // Save facets - convert to integers and link to personality_traits via personality_trait_id
      const facetsToSave: any = {
        personality_trait_id: traitsData.id,
      };

      // Round all facet scores to integers
      Object.keys(facets).forEach(key => {
        facetsToSave[key] = Math.round(facets[key]);
      });

      // Check if facets already exist
      const { data: existingFacets } = await supabase
        .from('personality_facets')
        .select('id')
        .eq('personality_trait_id', traitsData.id)
        .maybeSingle();

      if (existingFacets) {
        // Update existing facets
        const { data: facetsData, error: facetsError } = await supabase
          .from('personality_facets')
          .update(facetsToSave)
          .eq('personality_trait_id', traitsData.id);

        if (facetsError) {
          console.error('Error updating facets:', facetsError);
          throw facetsError;
        }
        console.log('Facets updated successfully:', facetsData);
      } else {
        // Insert new facets
        const { data: facetsData, error: facetsError } = await supabase
          .from('personality_facets')
          .insert(facetsToSave);

        if (facetsError) {
          console.error('Error inserting facets:', facetsError);
          throw facetsError;
        }
        console.log('Facets inserted successfully:', facetsData);
      }

      alert('Test results saved successfully!');
      clearProgress();
      setIsComplete(true);
    } catch (error) {
      console.error('Error saving personality test results:', error);
      alert('Failed to save test results. Error: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const goNext = () => {
    if (currentQuestion < QUESTIONS.length - 1 && currentQuestion in answers) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goSkip = () => {
    // Look for the next unanswered question after the current one, wrapping around
    const total = QUESTIONS.length;
    for (let offset = 1; offset < total; offset++) {
      const idx = (currentQuestion + offset) % total;
      if (!(idx in answers)) {
        setCurrentQuestion(idx);
        return;
      }
    }
  };

  const canGoNext =
    currentQuestion < QUESTIONS.length - 1 && currentQuestion in answers;

  const handleSaveAndExit = () => {
    persistProgress(answers, currentQuestion);
    onSaveAndExit?.();
  };

  if (isComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Personality Test Complete!
          </CardTitle>
          <CardDescription>
            Your results have been saved and will appear in your profile visualization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-talendeur-primary hover:bg-talendeur-primary-dark"
          >
            View My Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-talendeur-primary" />
          Personality Assessment
        </CardTitle>
        <CardDescription>
          {Object.keys(answers).length === QUESTIONS.length 
            ? `All questions answered! Click Submit Test to save your results.`
            : `Answer honestly for the most accurate results. Question ${currentQuestion + 1} of ${QUESTIONS.length}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Progress value={progress} className="mb-2" />
          <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-talendeur-primary/20 p-8">
          <p className="text-xl font-semibold text-center text-gray-800 mb-8">
            {question.text}
          </p>

          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => handleAnswer(score)}
                className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  answers[currentQuestion] === score
                    ? 'border-talendeur-primary bg-talendeur-primary text-white'
                    : 'border-gray-300 hover:border-talendeur-primary'
                }`}
              >
                <div className="text-2xl font-bold">{score}</div>
                <div className="text-xs mt-1">
                  {score === 1 && 'Strongly Disagree'}
                  {score === 2 && 'Disagree'}
                  {score === 3 && 'Neutral'}
                  {score === 4 && 'Agree'}
                  {score === 5 && 'Strongly Agree'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="text-sm text-gray-600 text-center shrink-0">
            {answeredCount} / {QUESTIONS.length} answered
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={goNext}
              disabled={!canGoNext}
            >
              Next
            </Button>

            {allQuestionsAnswered ? (
              <Button
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? 'Saving...' : 'Submit Test'}
              </Button>
            ) : (
              <Button
                onClick={goSkip}
                variant="outline"
              >
                Skip
              </Button>
            )}

            {onSaveAndExit && (
              <Button
                variant="secondary"
                onClick={handleSaveAndExit}
              >
                Save & Exit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
