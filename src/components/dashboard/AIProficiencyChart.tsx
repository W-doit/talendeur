import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface AIFluencyData {
  // Content management
  document_search?: string;
  meeting_summarization?: string;
  drafting_communication?: string;
  creative_content?: string;
  
  // Information Management
  research_complex_info?: string;
  report_generation?: string;
  data_analysis_visualization?: string;
  
  // Work management
  calendar_management?: string;
  task_automation?: string;
  workflow_automation?: string;
  
  // Technical
  custom_prompts?: string;
  coding_assistant?: string;
  ai_application_creation?: string;
}

interface AIToolsData {
  chatgpt?: boolean;
  claude?: boolean;
  github_copilot?: boolean;
  amazon_q?: boolean;
  google_gemini?: boolean;
  other_tools?: string;
}

// Legacy support - will handle both old and new data
interface AIProficiencyData {
  ai_tool_usage?: number;
  data_analysis_ai?: number;
  machine_learning?: number;
  generative_ai_prompting?: number;
  ai_strategy_implementation?: number;
  ai_ethics_governance?: number;
  years_working_with_ai?: number;
}

interface AIToolsUsed {
  tool_name: string;
  tool_category: string;
  proficiency_level: number;
}

interface AIProficiencyChartProps {
  data: AIFluencyData | AIProficiencyData | null;
  tools?: AIToolsUsed[] | AIToolsData;
}

interface CategoryData {
  category: string;
  score: number;
  label: string;
  color: string;
}

// Map frequency to numeric values for visualization
const FREQUENCY_TO_SCORE: Record<string, number> = {
  'very_often': 5,
  'usually': 4,
  'sometimes': 3,
  'rarely': 2,
  'never': 1
};

const FREQUENCY_LABELS: Record<number, string> = {
  5: 'Very Often',
  4: 'Usually',
  3: 'Sometimes',
  2: 'Rarely',
  1: 'Never'
};

// Consistent color palette matching other dashboard components
const CATEGORY_CONFIG = [
  {
    title: 'Content Management',
    color: '#9EBC9E', // Sage green
    items: [
      { key: 'document_search', label: 'Document Search' },
      { key: 'meeting_summarization', label: 'Meeting Summarization' },
      { key: 'drafting_communication', label: 'Drafting Communication' },
      { key: 'creative_content', label: 'Creative Content' }
    ]
  },
  {
    title: 'Information Management',
    color: '#CFC6B8', // Taupe
    items: [
      { key: 'research_complex_info', label: 'Research' },
      { key: 'report_generation', label: 'Report Generation' },
      { key: 'data_analysis_visualization', label: 'Data Analysis' }
    ]
  },
  {
    title: 'Work Management',
    color: '#FFCFD2', // Soft pink
    items: [
      { key: 'calendar_management', label: 'Calendar Management' },
      { key: 'task_automation', label: 'Task Automation' },
      { key: 'workflow_automation', label: 'Workflow Automation' }
    ]
  },
  {
    title: 'Technical',
    color: '#AA778A', // Mauve/dusty rose
    items: [
      { key: 'custom_prompts', label: 'Custom Prompts' },
      { key: 'coding_assistant', label: 'Coding Assistant' },
      { key: 'ai_application_creation', label: 'AI App Creation' }
    ]
  }
];

// Legacy chart configuration
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  ai_tool_usage: 'AI Tools',
  generative_ai_prompting: 'Gen AI',
  data_analysis_ai: 'Data & AI',
  machine_learning: 'ML',
  ai_strategy_implementation: 'Strategy',
  ai_ethics_governance: 'Ethics'
};

const LEGACY_CATEGORY_INFO: Record<string, { color: string; description: string }> = {
  ai_tool_usage: {
    color: '#9EBC9E',
    description: 'Proficiency with AI tools and platforms'
  },
  generative_ai_prompting: {
    color: '#FFAFC5',
    description: 'Skill in prompting and using generative AI'
  },
  data_analysis_ai: {
    color: '#CFC6B8',
    description: 'AI-powered data analysis capabilities'
  },
  machine_learning: {
    color: '#AA778A',
    description: 'Machine learning and model development'
  },
  ai_strategy_implementation: {
    color: '#FFCFD2',
    description: 'Strategic AI implementation and planning'
  },
  ai_ethics_governance: {
    color: '#9EBC9E',
    description: 'Understanding of AI ethics and governance'
  }
};


export const AIProficiencyChart = ({ data, tools = [] }: AIProficiencyChartProps) => {
  const [chartData, setChartData] = useState<CategoryData[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<any[]>([]);
  const [aiTools, setAITools] = useState<string[]>([]);
  const [isLegacyData, setIsLegacyData] = useState(false);

  useEffect(() => {
    if (!data) return;

    // Check if this is legacy data (has ai_tool_usage field) or new data (has document_search field)
    const hasLegacyFields = 'ai_tool_usage' in data;
    const hasNewFields = 'document_search' in data;

    setIsLegacyData(hasLegacyFields && !hasNewFields);

    if (hasNewFields) {
      // Process new frequency-based data - Group by category
      const fluencyData = data as AIFluencyData;
      const categoryAverages: CategoryData[] = [];
      const detailedBreakdown: any[] = [];

      CATEGORY_CONFIG.forEach(category => {
        let totalScore = 0;
        let count = 0;
        const subcategories: any[] = [];
        
        category.items.forEach(item => {
          const value = fluencyData[item.key as keyof AIFluencyData];
          if (value) {
            const score = FREQUENCY_TO_SCORE[value] || 0;
            totalScore += score;
            count++;
            subcategories.push({
              name: item.label,
              score: score,
              frequency: value
            });
          }
        });

        if (count > 0) {
          const avgScore = totalScore / count;
          categoryAverages.push({
            category: category.title,
            score: avgScore,
            label: FREQUENCY_LABELS[Math.round(avgScore)] || '',
            color: category.color
          });
          
          detailedBreakdown.push({
            title: category.title,
            color: category.color,
            avgScore: avgScore,
            subcategories: subcategories
          });
        }
      });

      setChartData(categoryAverages);
      setCategoryDetails(detailedBreakdown);

      // Process tools data (new structure)
      if (tools && typeof tools === 'object' && !Array.isArray(tools)) {
        const toolsData = tools as AIToolsData;
        const selectedTools: string[] = [];
        if (toolsData.chatgpt) selectedTools.push('ChatGPT');
        if (toolsData.claude) selectedTools.push('Claude');
        if (toolsData.github_copilot) selectedTools.push('GitHub Copilot');
        if (toolsData.amazon_q) selectedTools.push('Amazon Q');
        if (toolsData.google_gemini) selectedTools.push('Google Gemini');
        if (toolsData.other_tools) selectedTools.push(toolsData.other_tools);
        setAITools(selectedTools);
      }
    } else if (hasLegacyFields) {
      // Process legacy proficiency data
      const legacyData = data as AIProficiencyData;
      const processedData: CategoryData[] = [];

      Object.entries(legacyData).forEach(([key, value]) => {
        if (key !== 'years_working_with_ai' && typeof value === 'number' && value > 1) {
          const label = LEGACY_CATEGORY_LABELS[key] || key;
          const info = LEGACY_CATEGORY_INFO[key];
          processedData.push({
            category: label,
            score: value,
            label: `Level ${value}`,
            color: info?.color || '#999999'
          });
        }
      });

      setChartData(processedData);

      // Process tools data (legacy structure)
      if (Array.isArray(tools)) {
        setAITools(tools.map(t => t.tool_name));
      }
    }
  }, [data, tools]);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Fluency Overview
          </CardTitle>
          <CardDescription>
            Complete your AI fluency profile to see your visualization here
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Fluency Overview
          </CardTitle>
          <CardDescription>
            No AI usage data to display yet
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].payload.category}</p>
          <p className="text-sm text-gray-600">{payload[0].payload.label}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Fluency Overview
        </CardTitle>
        <CardDescription>
          {isLegacyData 
            ? 'Your AI proficiency levels across key areas'
            : 'How frequently you use AI at work'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Radar Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis 
                dataKey="category" 
                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 5]} 
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickCount={6}
              />
              <Radar
                name="AI Usage Frequency"
                dataKey="score"
                stroke="#AA778A"
                fill="#AA778A"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                formatter={(value: number) => [
                  `${value.toFixed(1)} - ${FREQUENCY_LABELS[Math.round(value)] || ''}`,
                  'Frequency'
                ]}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Category Breakdown with Mini Bar Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categoryDetails.map((category) => (
              <div 
                key={category.title} 
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: `${category.color}10`,
                  borderColor: category.color
                }}
              >
                {/* Category Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="font-semibold text-base text-gray-700">{category.title}</div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: category.color }}
                  >
                    {category.avgScore.toFixed(1)}
                  </div>
                </div>
                
                {/* Mini Bar Chart for Subcategories */}
                <div className="space-y-2">
                  {category.subcategories.map((sub: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 font-medium">{sub.name}</span>
                        <span className="text-gray-500">{FREQUENCY_LABELS[sub.score]}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${(sub.score / 5) * 100}%`,
                            backgroundColor: category.color,
                            opacity: 0.8
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* AI Tools Section */}
          {aiTools.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">AI Tools Used</h4>
              <div className="flex flex-wrap gap-2">
                {aiTools.map((tool, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
