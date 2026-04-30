import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface SkillsDimensions {
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

interface SkillsProfileFormProps {
  parsedData?: Partial<SkillsDimensions>;
  onSaveComplete?: () => void;
}

const SKILLS_CONFIG = [
  {
    key: 'creativity' as keyof SkillsDimensions,
    label: 'Creativity',
    description: 'Your ability to generate innovative ideas and think outside the box'
  },
  {
    key: 'communication' as keyof SkillsDimensions,
    label: 'Communication',
    description: 'Effectiveness in conveying information and collaborating with others'
  },
  {
    key: 'critical_thinking' as keyof SkillsDimensions,
    label: 'Critical Thinking',
    description: 'Analytical and logical problem-solving abilities'
  },
  {
    key: 'technology_development' as keyof SkillsDimensions,
    label: 'Technology Development',
    description: 'Technical skills and software development capabilities'
  },
  {
    key: 'operations' as keyof SkillsDimensions,
    label: 'Operations',
    description: 'Efficiency in managing processes and operational workflows'
  },
  {
    key: 'social_impact' as keyof SkillsDimensions,
    label: 'Social Impact',
    description: 'Focus on creating positive change in communities and society'
  },
  {
    key: 'business_acumen' as keyof SkillsDimensions,
    label: 'Business Acumen',
    description: 'Understanding of business strategy, markets, and financial concepts'
  },
  {
    key: 'innovation' as keyof SkillsDimensions,
    label: 'Innovation',
    description: 'Drive to develop new solutions and improve existing processes'
  },
  {
    key: 'collaboration' as keyof SkillsDimensions,
    label: 'Collaboration',
    description: 'Ability to work effectively in teams and build partnerships'
  },
  {
    key: 'leadership' as keyof SkillsDimensions,
    label: 'Leadership',
    description: 'Capacity to guide, motivate, and inspire others'
  },
  {
    key: 'precision' as keyof SkillsDimensions,
    label: 'Precision',
    description: 'Attention to detail and accuracy in work'
  },
  {
    key: 'depth' as keyof SkillsDimensions,
    label: 'Depth',
    description: 'Specialized expertise and deep knowledge in specific areas'
  },
  {
    key: 'commitment' as keyof SkillsDimensions,
    label: 'Commitment',
    description: 'Dedication and follow-through on responsibilities'
  },
  {
    key: 'empathy' as keyof SkillsDimensions,
    label: 'Empathy',
    description: 'Understanding and sensitivity to others\' perspectives and needs'
  },
  {
    key: 'flexibility' as keyof SkillsDimensions,
    label: 'Flexibility',
    description: 'Adaptability to change and diverse working conditions'
  },
];

export const SkillsProfileForm: React.FC<SkillsProfileFormProps> = ({ parsedData, onSaveComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAISuggestions, setHasAISuggestions] = useState(false);
  const [skills, setSkills] = useState<SkillsDimensions>({
    creativity: 0,
    communication: 0,
    critical_thinking: 0,
    technology_development: 0,
    operations: 0,
    social_impact: 0,
    business_acumen: 0,
    innovation: 0,
    collaboration: 0,
    leadership: 0,
    precision: 0,
    depth: 0,
    commitment: 0,
    empathy: 0,
    flexibility: 0,
  });

  useEffect(() => {
    const fetchExistingSkills = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('skills_dimensions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setSkills({
          creativity: data.creativity || 0,
          communication: data.communication || 0,
          critical_thinking: data.critical_thinking || 0,
          technology_development: data.technology_development || 0,
          operations: data.operations || 0,
          social_impact: data.social_impact || 0,
          business_acumen: data.business_acumen || 0,
          innovation: data.innovation || 0,
          collaboration: data.collaboration || 0,
          leadership: data.leadership || 0,
          precision: data.precision || 0,
          depth: data.depth || 0,
          commitment: data.commitment || 0,
          empathy: data.empathy || 0,
          flexibility: data.flexibility || 0,
        });
      }
    };

    fetchExistingSkills();
  }, [user]);

  useEffect(() => {
    if (parsedData && Object.keys(parsedData).length > 0) {
      setSkills(prev => ({
        ...prev,
        ...parsedData,
      }));
      setHasAISuggestions(true);
    }
  }, [parsedData]);

  const handleSkillChange = (key: keyof SkillsDimensions, value: number) => {
    setSkills(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('skills_dimensions')
        .upsert({
          user_id: user.id,
          ...skills,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Skills Profile Saved',
        description: 'Your skills assessment has been saved successfully.',
      });

      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error('Error saving skills:', error);
      toast({
        title: 'Error',
        description: 'Failed to save skills profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skills Profile</CardTitle>
          <CardDescription>
            Assess your competency across 15 key dimensions. Rate yourself from 0 (beginner) to 100 (expert).
            {hasAISuggestions && (
              <span className="block mt-2">
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Suggested values loaded
                </Badge>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {SKILLS_CONFIG.map((skill) => (
            <div key={skill.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium leading-none">
                    {skill.label}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {skill.description}
                  </p>
                </div>
                <span className="text-2xl font-bold text-talendeur-primary min-w-[60px] text-right">
                  {skills[skill.key]}
                </span>
              </div>
              <Slider
                value={[skills[skill.key]]}
                onValueChange={(value) => handleSkillChange(skill.key, value[0])}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-talendeur-primary to-talendeur-orange hover:opacity-90 text-white"
        >
          {isSubmitting ? 'Saving...' : 'Save Skills Profile'}
        </Button>
      </div>
    </form>
  );
};
