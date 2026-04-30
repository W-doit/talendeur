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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell
} from 'recharts';

interface AIProficiencyData {
  ai_tool_usage: number;
  data_analysis_ai: number;
  machine_learning: number;
  generative_ai_prompting: number;
  ai_strategy_implementation: number;
  ai_ethics_governance: number;
  years_working_with_ai: number;
}

interface AIToolsUsed {
  tool_name: string;
  tool_category: string;
  proficiency_level: number;
}

interface AIProficiencyChartProps {
  data: AIProficiencyData | null;
  tools?: AIToolsUsed[];
}

interface CategoryData {
  category: string;
  score: number;
  fullMark: 5;
  color: string;
  description: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  ai_tool_usage: 'AI Tools',
  generative_ai_prompting: 'Gen AI',
  data_analysis_ai: 'Data & AI',
  machine_learning: 'ML',
  ai_strategy_implementation: 'Strategy',
  ai_ethics_governance: 'Ethics'
};

const CATEGORY_INFO: Record<string, { color: string; description: string }> = {
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

const LEVEL_NAMES = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert'];

export const AIProficiencyChart = ({ data, tools = [] }: AIProficiencyChartProps) => {
  const [radarData, setRadarData] = useState<CategoryData[]>([]);
  const [topTools, setTopTools] = useState<any[]>([]);

  useEffect(() => {
    if (!data) return;

    // Check if user has any proficiency
    const hasAnySkills = Object.entries(data)
      .filter(([key]) => key !== 'years_working_with_ai')
      .some(([, value]) => value > 1);

    if (!hasAnySkills) {
      return;
    }

    // Build radar chart data
    const categories: CategoryData[] = [
      {
        category: CATEGORY_LABELS.ai_tool_usage,
        score: data.ai_tool_usage,
        fullMark: 5,
        color: CATEGORY_INFO.ai_tool_usage.color,
        description: CATEGORY_INFO.ai_tool_usage.description
      },
      {
        category: CATEGORY_LABELS.generative_ai_prompting,
        score: data.generative_ai_prompting,
        fullMark: 5,
        color: CATEGORY_INFO.generative_ai_prompting.color,
        description: CATEGORY_INFO.generative_ai_prompting.description
      },
      {
        category: CATEGORY_LABELS.data_analysis_ai,
        score: data.data_analysis_ai,
        fullMark: 5,
        color: CATEGORY_INFO.data_analysis_ai.color,
        description: CATEGORY_INFO.data_analysis_ai.description
      },
      {
        category: CATEGORY_LABELS.machine_learning,
        score: data.machine_learning,
        fullMark: 5,
        color: CATEGORY_INFO.machine_learning.color,
        description: CATEGORY_INFO.machine_learning.description
      },
      {
        category: CATEGORY_LABELS.ai_strategy_implementation,
        score: data.ai_strategy_implementation,
        fullMark: 5,
        color: CATEGORY_INFO.ai_strategy_implementation.color,
        description: CATEGORY_INFO.ai_strategy_implementation.description
      },
      {
        category: CATEGORY_LABELS.ai_ethics_governance,
        score: data.ai_ethics_governance,
        fullMark: 5,
        color: CATEGORY_INFO.ai_ethics_governance.color,
        description: CATEGORY_INFO.ai_ethics_governance.description
      }
    ];

    setRadarData(categories);

    // Get top tools by proficiency level
    const sortedTools = [...tools]
      .filter(tool => tool.proficiency_level > 0)
      .sort((a, b) => b.proficiency_level - a.proficiency_level)
      .slice(0, 8)
      .map(tool => ({
        name: tool.tool_name,
        score: tool.proficiency_level,
        category: tool.tool_category
      }));

    setTopTools(sortedTools);
  }, [data, tools]);

  if (!data || radarData.length === 0) {
    return null;
  }

  const yearsExp = data.years_working_with_ai || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-talendeur-primary" />
          AI Proficiency Profile
          {yearsExp > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {yearsExp} {yearsExp === 1 ? 'year' : 'years'} experience
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Your AI skills and tool proficiency levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Category Overview</h3>
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 5]} 
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickCount={6}
                />
                <Radar
                  name="Proficiency"
                  dataKey="score"
                  stroke="#D1163E"
                  fill="#D1163E"
                  fillOpacity={0.2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  formatter={(value: number) => [
                    `Level ${value}/5: ${LEVEL_NAMES[value - 1] || 'N/A'}`,
                    'Proficiency'
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Scores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Detailed Scores</h3>
            {radarData.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{item.category}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: item.color }}>
                    {item.score}/5
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.score / 5) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tools Bar Chart */}
        {topTools.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Top AI Tools & Proficiency</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topTools} layout="vertical">
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `Level ${value}/5: ${LEVEL_NAMES[value - 1]}`}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={20}>
                  {topTools.map((entry, index) => {
                    // Get color based on tool category
                    const categoryMap: Record<string, string> = {
                      'generative_ai': CATEGORY_INFO.generative_ai_prompting.color,
                      'ml_framework': CATEGORY_INFO.machine_learning.color,
                      'data_science': CATEGORY_INFO.data_analysis_ai.color,
                      'ai_platform': CATEGORY_INFO.ai_tool_usage.color,
                      'productivity': CATEGORY_INFO.ai_tool_usage.color
                    };
                    const color = categoryMap[entry.category] || CATEGORY_INFO.ai_tool_usage.color;
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
