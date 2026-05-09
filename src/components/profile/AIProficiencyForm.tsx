import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Sparkles, BarChart3, Lightbulb, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AIProficiency {
  ai_tool_usage: number;
  data_analysis_ai: number;
  machine_learning: number;
  generative_ai_prompting: number;
  ai_strategy_implementation: number;
  ai_ethics_governance: number;
  years_working_with_ai: number;
  ai_projects_completed: number;
  currently_learning_ai: boolean;
  learning_focus: string;
}

interface AITool {
  id?: string;
  tool_name: string;
  tool_category: string;
  proficiency_level: number;
  usage_frequency: string;
  usage_context: string;
}

const AI_CATEGORIES = [
  {
    key: 'ai_tool_usage',
    label: 'AI Tool Usage',
    icon: Zap,
    description: 'Using AI assistants like ChatGPT, Copilot, or AI-powered apps',
    color: 'text-purple-500'
  },
  {
    key: 'generative_ai_prompting',
    label: 'Generative AI & Prompting',
    icon: Sparkles,
    description: 'Creating content with AI (text, images, code) through effective prompting',
    color: 'text-pink-500'
  },
  {
    key: 'data_analysis_ai',
    label: 'Data Analysis & AI',
    icon: BarChart3,
    description: 'Using AI for data analysis, insights, and decision-making',
    color: 'text-blue-500'
  },
  {
    key: 'machine_learning',
    label: 'Machine Learning & Development',
    icon: Brain,
    description: 'Building, training, or implementing ML models and algorithms',
    color: 'text-green-500'
  },
  {
    key: 'ai_strategy_implementation',
    label: 'AI Strategy & Implementation',
    icon: Lightbulb,
    description: 'Planning, managing, or leading AI initiatives in organizations',
    color: 'text-orange-500'
  },
  {
    key: 'ai_ethics_governance',
    label: 'AI Ethics & Governance',
    icon: Shield,
    description: 'Understanding AI ethics, bias, privacy, and responsible AI practices',
    color: 'text-red-500'
  }
];

const POPULAR_AI_TOOLS = [
  { name: 'ChatGPT', category: 'generative_ai' },
  { name: 'GitHub Copilot', category: 'productivity' },
  { name: 'Claude', category: 'generative_ai' },
  { name: 'Midjourney', category: 'generative_ai' },
  { name: 'Stable Diffusion', category: 'generative_ai' },
  { name: 'Google Gemini', category: 'generative_ai' },
  { name: 'Microsoft Copilot', category: 'productivity' },
  { name: 'Notion AI', category: 'productivity' },
  { name: 'Grammarly', category: 'productivity' },
  { name: 'TensorFlow', category: 'ml_framework' },
  { name: 'PyTorch', category: 'ml_framework' },
  { name: 'scikit-learn', category: 'ml_framework' },
  { name: 'Hugging Face', category: 'ai_platform' },
  { name: 'LangChain', category: 'ml_framework' },
  { name: 'Azure OpenAI', category: 'ai_platform' },
  { name: 'AWS SageMaker', category: 'ai_platform' },
  { name: 'Google Vertex AI', category: 'ai_platform' },
  { name: 'Tableau with AI', category: 'data_science' },
  { name: 'Power BI with AI', category: 'data_science' },
  { name: 'DataRobot', category: 'ai_platform' }
];

const PROFICIENCY_LEVELS = [
  { value: 1, label: 'Beginner', description: 'Just starting to learn' },
  { value: 2, label: 'Novice', description: 'Basic understanding' },
  { value: 3, label: 'Intermediate', description: 'Can work independently' },
  { value: 4, label: 'Advanced', description: 'Strong expertise' },
  { value: 5, label: 'Expert', description: 'Can teach others' }
];

interface AIProficiencyFormProps {
  onSaveComplete?: () => void;
}

export const AIProficiencyForm = ({ onSaveComplete }: AIProficiencyFormProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [proficiency, setProficiency] = useState<AIProficiency>({
    ai_tool_usage: 1,
    data_analysis_ai: 1,
    machine_learning: 1,
    generative_ai_prompting: 1,
    ai_strategy_implementation: 1,
    ai_ethics_governance: 1,
    years_working_with_ai: 0,
    ai_projects_completed: 0,
    currently_learning_ai: false,
    learning_focus: ''
  });

  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [toolDetails, setToolDetails] = useState<Map<string, { proficiency: number, frequency: string, context: string }>>(new Map());

  useEffect(() => {
    fetchAIProficiency();
  }, [user]);

  const fetchAIProficiency = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: profData, error: profError } = await supabase
        .from('ai_proficiency')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profError && profError.code !== 'PGRST116') throw profError;

      if (profData) {
        setProficiency({
          ai_tool_usage: profData.ai_tool_usage || 1,
          data_analysis_ai: profData.data_analysis_ai || 1,
          machine_learning: profData.machine_learning || 1,
          generative_ai_prompting: profData.generative_ai_prompting || 1,
          ai_strategy_implementation: profData.ai_strategy_implementation || 1,
          ai_ethics_governance: profData.ai_ethics_governance || 1,
          years_working_with_ai: profData.years_working_with_ai ?? 0,
          ai_projects_completed: profData.ai_projects_completed ?? 0,
          currently_learning_ai: profData.currently_learning_ai ?? false,
          learning_focus: profData.learning_focus ?? ''
        });
      }

      // Fetch tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('ai_tools_used')
        .select('*')
        .eq('user_id', user.id);

      if (toolsError) throw toolsError;

      if (toolsData && toolsData.length > 0) {
        const tools = new Set(toolsData.map(t => t.tool_name));
        setSelectedTools(tools);

        const details = new Map();
        toolsData.forEach(tool => {
          details.set(tool.tool_name, {
            proficiency: tool.proficiency_level,
            frequency: tool.usage_frequency,
            context: tool.usage_context
          });
        });
        setToolDetails(details);
      }
    } catch (error) {
      console.error('Error fetching AI proficiency:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string, value: number[]) => {
    setProficiency(prev => ({
      ...prev,
      [category]: value[0]
    }));
  };

  const handleToolToggle = (toolName: string, toolCategory: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolName)) {
      newSelected.delete(toolName);
      const newDetails = new Map(toolDetails);
      newDetails.delete(toolName);
      setToolDetails(newDetails);
    } else {
      newSelected.add(toolName);
      setToolDetails(prev => new Map(prev).set(toolName, {
        proficiency: 3,
        frequency: 'weekly',
        context: 'professional'
      }));
    }
    setSelectedTools(newSelected);
  };

  const handleToolDetailChange = (toolName: string, field: string, value: any) => {
    setToolDetails(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(toolName) || { proficiency: 3, frequency: 'weekly', context: 'professional' };
      newMap.set(toolName, { ...current, [field]: value });
      return newMap;
    });
  };

  const saveProficiency = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Upsert main proficiency data
      const { error: profError } = await supabase
        .from('ai_proficiency')
        .upsert({
          user_id: user.id,
          ...proficiency,
          learning_focus: proficiency.learning_focus || null
        }, {
          onConflict: 'user_id'
        });

      if (profError) throw profError;

      // Delete all existing tools
      const { error: deleteError } = await supabase
        .from('ai_tools_used')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert selected tools
      if (selectedTools.size > 0) {
        const toolsToInsert = Array.from(selectedTools).map(toolName => {
          const tool = POPULAR_AI_TOOLS.find(t => t.name === toolName);
          const details = toolDetails.get(toolName) || { proficiency: 3, frequency: 'weekly', context: 'professional' };
          
          return {
            user_id: user.id,
            tool_name: toolName,
            tool_category: tool?.category || 'other',
            proficiency_level: details.proficiency,
            usage_frequency: details.frequency,
            usage_context: details.context
          };
        });

        const { error: toolsError } = await supabase
          .from('ai_tools_used')
          .insert(toolsToInsert);

        if (toolsError) throw toolsError;
      }

      toast({
        title: 'AI fluency saved',
        description: 'Your AI fluency profile has been updated successfully.',
        duration: 3000,
      });

      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error('Error saving AI proficiency:', error);
      toast({
        title: 'Error',
        description: 'Failed to save AI fluency. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading AI fluency...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-talendeur-primary" />
            AI Fluency Profile
          </CardTitle>
          <CardDescription>
            Share your AI knowledge and experience - from everyday AI tool usage to advanced ML development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="years">Years Working with AI</Label>
              <Input
                id="years"
                type="number"
                step="0.5"
                min="0"
                max="30"
                value={proficiency.years_working_with_ai}
                onChange={(e) => setProficiency(prev => ({ ...prev, years_working_with_ai: parseFloat(e.target.value) || 0 }))}
                placeholder="0.5"
              />
            </div>
            <div>
              <Label htmlFor="projects">AI Projects Completed</Label>
              <Input
                id="projects"
                type="number"
                min="0"
                value={proficiency.ai_projects_completed}
                onChange={(e) => setProficiency(prev => ({ ...prev, ai_projects_completed: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Category Proficiencies */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Rate Your AI Fluency</h3>
            {AI_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const value = proficiency[category.key as keyof AIProficiency] as number;
              const level = PROFICIENCY_LEVELS.find(l => l.value === value);
              
              return (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-1 ${category.color}`} />
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-base font-medium">{category.label}</Label>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="space-y-1">
                        <Slider
                          value={[value]}
                          onValueChange={(val) => handleCategoryChange(category.key, val)}
                          min={1}
                          max={5}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{level?.label}</span>
                          <span className="text-right">{level?.description}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Popular AI Tools */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">AI Tools You Use</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POPULAR_AI_TOOLS.map((tool) => (
                <div key={tool.name} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={tool.name}
                      checked={selectedTools.has(tool.name)}
                      onCheckedChange={() => handleToolToggle(tool.name, tool.category)}
                    />
                    <Label htmlFor={tool.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {tool.name}
                    </Label>
                  </div>
                  {selectedTools.has(tool.name) && (
                    <div className="ml-6 space-y-2 text-xs">
                      <div>
                        <Label className="text-xs">Proficiency</Label>
                        <Slider
                          value={[toolDetails.get(tool.name)?.proficiency || 3]}
                          onValueChange={(val) => handleToolDetailChange(tool.name, 'proficiency', val[0])}
                          min={1}
                          max={5}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Learning Status */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="learning"
                checked={proficiency.currently_learning_ai}
                onCheckedChange={(checked) => setProficiency(prev => ({ ...prev, currently_learning_ai: checked as boolean }))}
              />
              <Label htmlFor="learning">I'm currently learning AI</Label>
            </div>
            {proficiency.currently_learning_ai && (
              <div>
                <Label htmlFor="focus">What are you learning?</Label>
                <Textarea
                  id="focus"
                  value={proficiency.learning_focus}
                  onChange={(e) => setProficiency(prev => ({ ...prev, learning_focus: e.target.value }))}
                  placeholder="e.g., Prompt engineering, Python for ML, AI ethics..."
                  rows={2}
                />
              </div>
            )}
          </div>

          <Button 
            onClick={saveProficiency} 
            disabled={saving}
            className="w-full bg-gradient-to-r from-talendeur-primary to-talendeur-orange hover:opacity-90"
          >
            {saving ? 'Saving...' : 'Save AI Profile'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
