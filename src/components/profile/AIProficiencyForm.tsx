import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type FrequencyOption = 'very_often' | 'usually' | 'sometimes' | 'rarely' | 'never';

interface AIUsageData {
  // Content management
  document_search: FrequencyOption;
  meeting_summarization: FrequencyOption;
  drafting_communication: FrequencyOption;
  creative_content: FrequencyOption;
  
  // Information Management
  research_complex_info: FrequencyOption;
  report_generation: FrequencyOption;
  data_analysis_visualization: FrequencyOption;
  
  // Work management
  calendar_management: FrequencyOption;
  task_automation: FrequencyOption;
  workflow_automation: FrequencyOption;
  
  // Technical
  custom_prompts: FrequencyOption;
  coding_assistant: FrequencyOption;
  ai_application_creation: FrequencyOption;
}

interface AIToolsData {
  chatgpt: boolean;
  claude: boolean;
  github_copilot: boolean;
  amazon_q: boolean;
  google_gemini: boolean;
  other_tools: string;
}

const FREQUENCY_OPTIONS: { value: FrequencyOption; label: string }[] = [
  { value: 'very_often', label: 'Very Often' },
  { value: 'usually', label: 'Usually' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'never', label: 'Never' }
];

const AI_USAGE_CATEGORIES = [
  {
    title: 'Content Management',
    items: [
      { key: 'document_search', label: 'Document search and insights' },
      { key: 'meeting_summarization', label: 'Meetings and Document Summarisation' },
      { key: 'drafting_communication', label: 'Drafting and reviewing communication' },
      { key: 'creative_content', label: 'Creative content generation' }
    ]
  },
  {
    title: 'Information Management',
    items: [
      { key: 'research_complex_info', label: 'Research for complex information' },
      { key: 'report_generation', label: 'Report generation' },
      { key: 'data_analysis_visualization', label: 'Data analysis and visualisation' }
    ]
  },
  {
    title: 'Work Management',
    items: [
      { key: 'calendar_management', label: 'Calendar management (Scheduling meetings)' },
      { key: 'task_automation', label: 'Task automation (Data entry)' },
      { key: 'workflow_automation', label: 'Workflow automation (Agentic automation)' }
    ]
  },
  {
    title: 'Technical',
    items: [
      { key: 'custom_prompts', label: 'Creation of custom prompts' },
      { key: 'coding_assistant', label: 'Coding assistant' },
      { key: 'ai_application_creation', label: 'Creation of AI application/solution' }
    ]
  }
];

const AI_TOOLS_LIST = [
  { key: 'chatgpt', label: 'ChatGPT' },
  { key: 'claude', label: 'Claude' },
  { key: 'github_copilot', label: 'GitHub Copilot' },
  { key: 'amazon_q', label: 'Amazon Q' },
  { key: 'google_gemini', label: 'Google Gemini' }
];


interface AIProficiencyFormProps {
  onSaveComplete?: () => void;
}

export const AIProficiencyForm = ({ onSaveComplete }: AIProficiencyFormProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [usageData, setUsageData] = useState<AIUsageData>({
    document_search: 'never',
    meeting_summarization: 'never',
    drafting_communication: 'never',
    creative_content: 'never',
    research_complex_info: 'never',
    report_generation: 'never',
    data_analysis_visualization: 'never',
    calendar_management: 'never',
    task_automation: 'never',
    workflow_automation: 'never',
    custom_prompts: 'never',
    coding_assistant: 'never',
    ai_application_creation: 'never'
  });

  const [toolsData, setToolsData] = useState<AIToolsData>({
    chatgpt: false,
    claude: false,
    github_copilot: false,
    amazon_q: false,
    google_gemini: false,
    other_tools: ''
  });

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
        .from('ai_fluency_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profError && profError.code !== 'PGRST116') throw profError;

      if (profData) {
        setUsageData({
          document_search: profData.document_search || 'never',
          meeting_summarization: profData.meeting_summarization || 'never',
          drafting_communication: profData.drafting_communication || 'never',
          creative_content: profData.creative_content || 'never',
          research_complex_info: profData.research_complex_info || 'never',
          report_generation: profData.report_generation || 'never',
          data_analysis_visualization: profData.data_analysis_visualization || 'never',
          calendar_management: profData.calendar_management || 'never',
          task_automation: profData.task_automation || 'never',
          workflow_automation: profData.workflow_automation || 'never',
          custom_prompts: profData.custom_prompts || 'never',
          coding_assistant: profData.coding_assistant || 'never',
          ai_application_creation: profData.ai_application_creation || 'never'
        });
      }

      const { data: toolsDbData, error: toolsError } = await supabase
        .from('ai_fluency_tools')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (toolsError && toolsError.code !== 'PGRST116') throw toolsError;

      if (toolsDbData) {
        setToolsData({
          chatgpt: toolsDbData.chatgpt || false,
          claude: toolsDbData.claude || false,
          github_copilot: toolsDbData.github_copilot || false,
          amazon_q: toolsDbData.amazon_q || false,
          google_gemini: toolsDbData.google_gemini || false,
          other_tools: toolsDbData.other_tools || ''
        });
      }
    } catch (error) {
      console.error('Error fetching AI fluency:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsageChange = (key: keyof AIUsageData, value: FrequencyOption) => {
    setUsageData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleToolToggle = (key: keyof Omit<AIToolsData, 'other_tools'>) => {
    setToolsData(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Check if any technical option is selected (not "never")
  const isTechnicalSectionActive = 
    usageData.custom_prompts !== 'never' || 
    usageData.coding_assistant !== 'never' || 
    usageData.ai_application_creation !== 'never';

  const saveProficiency = async () => {
    if (!user) return;

    setSaving(true);
    
    console.log('💾 Saving AI Fluency Data:', {
      usageData,
      toolsData
    });
    
    try {
      // Save usage data
      const { error: usageError } = await supabase
        .from('ai_fluency_usage')
        .upsert({
          user_id: user.id,
          ...usageData
        }, {
          onConflict: 'user_id'
        });

      if (usageError) throw usageError;

      // Save tools data
      const { error: toolsError } = await supabase
        .from('ai_fluency_tools')
        .upsert({
          user_id: user.id,
          ...toolsData
        }, {
          onConflict: 'user_id'
        });

      if (toolsError) throw toolsError;

      toast({
        title: 'AI Fluency saved',
        description: 'Your AI fluency profile has been updated successfully.',
        duration: 3000,
      });

      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error('Error saving AI fluency:', error);
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
    return <div className="text-center py-4">Loading AI Fluency...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-talendeur-primary" />
            AI Fluency
          </CardTitle>
          <CardDescription>
            As a user, I use AI at my work for:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* AI Usage Categories */}
          {AI_USAGE_CATEGORIES.map((category, categoryIndex) => (
            <div key={category.title} className="space-y-4">
              <h3 className="font-semibold text-base">
                {categoryIndex + 1}. {category.title}
              </h3>
              <div className="space-y-6 ml-4">
                {category.items.map((item) => (
                  <div key={item.key} className="space-y-2">
                    <Label className="text-sm font-medium">{item.label}</Label>
                    <RadioGroup
                      value={usageData[item.key as keyof AIUsageData]}
                      onValueChange={(value) => handleUsageChange(item.key as keyof AIUsageData, value as FrequencyOption)}
                      className="flex flex-wrap gap-4"
                    >
                      {FREQUENCY_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`${item.key}-${option.value}`} />
                          <Label 
                            htmlFor={`${item.key}-${option.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* AI Tools Section */}
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h3 className="font-semibold text-base mb-2">
                Select AI tools you use from the list below
              </h3>
              {!isTechnicalSectionActive && (
                <p className="text-sm text-muted-foreground italic mb-4">
                  This section is enabled only if at least 1 option is selected from 'Technical' section
                </p>
              )}
            </div>
            <div className={`space-y-3 ${!isTechnicalSectionActive ? 'opacity-50 pointer-events-none' : ''}`}>
              {AI_TOOLS_LIST.map((tool) => (
                <div key={tool.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={tool.key}
                    checked={toolsData[tool.key as keyof Omit<AIToolsData, 'other_tools'>]}
                    onCheckedChange={() => handleToolToggle(tool.key as keyof Omit<AIToolsData, 'other_tools'>)}
                    disabled={!isTechnicalSectionActive}
                  />
                  <Label 
                    htmlFor={tool.key}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {tool.label}
                  </Label>
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="other_tools" className="text-sm font-medium">
                  Others (please specify)
                </Label>
                <Input
                  id="other_tools"
                  value={toolsData.other_tools}
                  onChange={(e) => setToolsData(prev => ({ ...prev, other_tools: e.target.value }))}
                  placeholder="Enter other AI tools you use..."
                  disabled={!isTechnicalSectionActive}
                  className="max-w-md"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={saveProficiency} 
            disabled={saving}
            className="w-full bg-gradient-to-r from-talendeur-primary to-talendeur-orange hover:opacity-90"
          >
            {saving ? 'Saving...' : 'Save AI Fluency'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
