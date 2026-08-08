import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

interface AIFluencyData {
  document_search?: string;
  meeting_summarization?: string;
  drafting_communication?: string;
  creative_content?: string;
  research_complex_info?: string;
  report_generation?: string;
  data_analysis_visualization?: string;
  calendar_management?: string;
  task_automation?: string;
  workflow_automation?: string;
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
  shortLabel: string;
  score: number;
  industry: number;
  gap: number;
  label: string;
  color: string;
}

const FREQUENCY_TO_SCORE: Record<string, number> = {
  very_often: 5,
  usually: 4,
  sometimes: 3,
  rarely: 2,
  never: 1,
};

const FREQUENCY_LABELS: Record<number, string> = {
  5: 'Very Often',
  4: 'Usually',
  3: 'Sometimes',
  2: 'Rarely',
  1: 'Never',
};

/**
 * Indicative industry AI-usage benchmarks (1–5 frequency scale).
 * Reflects typical knowledge-worker adoption: content & research are common;
 * automation and technical AI building still lag for most professionals.
 */
const INDUSTRY_BENCHMARKS: Record<string, number> = {
  'Content Management': 3.8,
  'Information Management': 3.6,
  'Work Management': 2.9,
  Technical: 2.4,
  'AI Tools': 3.7,
  'Gen AI': 3.5,
  'Data & AI': 3.0,
  ML: 2.2,
  Strategy: 2.8,
  Ethics: 2.5,
};

const CATEGORY_CONFIG = [
  {
    title: 'Content Management',
    shortLabel: 'Content',
    color: '#9EBC9E',
    items: [
      { key: 'document_search', label: 'Document Search' },
      { key: 'meeting_summarization', label: 'Meeting Summarization' },
      { key: 'drafting_communication', label: 'Drafting Communication' },
      { key: 'creative_content', label: 'Creative Content' },
    ],
  },
  {
    title: 'Information Management',
    shortLabel: 'Information',
    color: '#CFC6B8',
    items: [
      { key: 'research_complex_info', label: 'Research' },
      { key: 'report_generation', label: 'Report Generation' },
      { key: 'data_analysis_visualization', label: 'Data Analysis' },
    ],
  },
  {
    title: 'Work Management',
    shortLabel: 'Work Mgmt',
    color: '#FFCFD2',
    items: [
      { key: 'calendar_management', label: 'Calendar Management' },
      { key: 'task_automation', label: 'Task Automation' },
      { key: 'workflow_automation', label: 'Workflow Automation' },
    ],
  },
  {
    title: 'Technical',
    shortLabel: 'Technical',
    color: '#AA778A',
    items: [
      { key: 'custom_prompts', label: 'Custom Prompts' },
      { key: 'coding_assistant', label: 'Coding Assistant' },
      { key: 'ai_application_creation', label: 'AI App Creation' },
    ],
  },
];

const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  ai_tool_usage: 'AI Tools',
  generative_ai_prompting: 'Gen AI',
  data_analysis_ai: 'Data & AI',
  machine_learning: 'ML',
  ai_strategy_implementation: 'Strategy',
  ai_ethics_governance: 'Ethics',
};

const LEGACY_CATEGORY_INFO: Record<string, { color: string }> = {
  ai_tool_usage: { color: '#9EBC9E' },
  generative_ai_prompting: { color: '#FFAFC5' },
  data_analysis_ai: { color: '#CFC6B8' },
  machine_learning: { color: '#AA778A' },
  ai_strategy_implementation: { color: '#FFCFD2' },
  ai_ethics_governance: { color: '#9EBC9E' },
};

export const AIProficiencyChart = ({ data, tools = [] }: AIProficiencyChartProps) => {
  const [chartData, setChartData] = useState<CategoryData[]>([]);
  const [categoryDetails, setCategoryDetails] = useState<any[]>([]);
  const [aiTools, setAITools] = useState<string[]>([]);
  const [isLegacyData, setIsLegacyData] = useState(false);

  useEffect(() => {
    if (!data) return;

    const hasLegacyFields = 'ai_tool_usage' in data;
    const hasNewFields = 'document_search' in data;

    setIsLegacyData(hasLegacyFields && !hasNewFields);

    if (hasNewFields) {
      const fluencyData = data as AIFluencyData;
      const categoryAverages: CategoryData[] = [];
      const detailedBreakdown: any[] = [];

      CATEGORY_CONFIG.forEach((category) => {
        let totalScore = 0;
        let count = 0;
        const subcategories: any[] = [];

        category.items.forEach((item) => {
          const value = fluencyData[item.key as keyof AIFluencyData];
          if (value) {
            const score = FREQUENCY_TO_SCORE[value] || 0;
            totalScore += score;
            count++;
            subcategories.push({
              name: item.label,
              score,
              frequency: value,
            });
          }
        });

        if (count > 0) {
          const avgScore = totalScore / count;
          const industry = INDUSTRY_BENCHMARKS[category.title] ?? 3;
          categoryAverages.push({
            category: category.title,
            shortLabel: category.shortLabel,
            score: Number(avgScore.toFixed(2)),
            industry,
            gap: Number((avgScore - industry).toFixed(2)),
            label: FREQUENCY_LABELS[Math.round(avgScore)] || '',
            color: category.color,
          });

          detailedBreakdown.push({
            title: category.title,
            color: category.color,
            avgScore,
            industry,
            gap: avgScore - industry,
            subcategories,
          });
        }
      });

      setChartData(categoryAverages);
      setCategoryDetails(detailedBreakdown);

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
      const legacyData = data as AIProficiencyData;
      const processedData: CategoryData[] = [];

      Object.entries(legacyData).forEach(([key, value]) => {
        if (key !== 'years_working_with_ai' && typeof value === 'number' && value > 1) {
          const label = LEGACY_CATEGORY_LABELS[key] || key;
          const info = LEGACY_CATEGORY_INFO[key];
          const industry = INDUSTRY_BENCHMARKS[label] ?? 3;
          processedData.push({
            category: label,
            shortLabel: label,
            score: value,
            industry,
            gap: Number((value - industry).toFixed(2)),
            label: `Level ${value}`,
            color: info?.color || '#999999',
          });
        }
      });

      setChartData(processedData);
      setCategoryDetails([]);

      if (Array.isArray(tools)) {
        setAITools(tools.map((t) => t.tool_name));
      }
    }
  }, [data, tools]);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-talendeur-navy" />
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
            <Sparkles className="h-5 w-5 text-talendeur-navy" />
            AI Fluency Overview
          </CardTitle>
          <CardDescription>No AI usage data to display yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const aheadCount = chartData.filter((d) => d.gap >= 0).length;
  const behindCount = chartData.length - aheadCount;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload as CategoryData;
    const gapLabel =
      row.gap >= 0.15
        ? `Ahead of industry by ${row.gap.toFixed(1)}`
        : row.gap <= -0.15
          ? `Behind industry by ${Math.abs(row.gap).toFixed(1)}`
          : 'Roughly on industry level';

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm space-y-1">
        <p className="font-semibold">{row.category}</p>
        <p className="text-gray-700">
          You: {row.score.toFixed(1)}
          {!isLegacyData && row.label ? ` (${row.label})` : ''}
        </p>
        <p className="text-talendeur-navy">Industry need: {row.industry.toFixed(1)}</p>
        <p className={row.gap >= 0 ? 'text-green-700' : 'text-amber-700'}>{gapLabel}</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-talendeur-navy" />
          AI Fluency Overview
        </CardTitle>
        <CardDescription>
          {isLegacyData
            ? 'Your AI levels vs typical industry needs'
            : 'Your AI usage frequency vs indicative industry needs — the gap shows where to catch up or lean in'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-talendeur-navy/80" />
              Your fluency
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 bg-talendeur-orange" />
              Industry need
            </span>
            <span>
              {aheadCount} at/above · {behindCount} below industry
            </span>
          </div>

          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
                width={78}
                tick={{ fill: '#9ca3af', fontSize: 11, dx: 4 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  isLegacyData ? String(v) : FREQUENCY_LABELS[v] || String(v)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={28}
                formatter={(value) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
              <Bar dataKey="score" name="Your fluency" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={entry.color}
                    fillOpacity={0.85}
                    stroke={entry.gap < 0 ? '#A01130' : 'transparent'}
                    strokeWidth={entry.gap < 0 ? 1.5 : 0}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="industry"
                name="Industry need"
                stroke="#FF9F14"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#FF9F14', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {!isLegacyData && categoryDetails.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {categoryDetails.map((category) => {
                const gap = category.gap as number;
                const gapText =
                  gap >= 0.15
                    ? `+${gap.toFixed(1)} vs industry`
                    : gap <= -0.15
                      ? `${gap.toFixed(1)} vs industry`
                      : 'On industry level';

                return (
                  <div
                    key={category.title}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: `${category.color}10`,
                      borderColor: category.color,
                    }}
                  >
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div>
                        <div className="font-semibold text-base text-gray-700">{category.title}</div>
                        <div
                          className={`text-xs mt-0.5 ${
                            gap >= 0 ? 'text-green-700' : 'text-amber-700'
                          }`}
                        >
                          {gapText} (need {category.industry.toFixed(1)})
                        </div>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: category.color }}>
                        {category.avgScore.toFixed(1)}
                      </div>
                    </div>

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
                                opacity: 0.8,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {aiTools.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">AI Tools Used</h4>
              <div className="flex flex-wrap gap-2">
                {aiTools.map((tool, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-talendeur-navy/10 text-talendeur-navy rounded-full text-sm"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Industry need is an indicative benchmark for typical knowledge-worker AI adoption in each
            area — not a live labour-market feed. Use the gap to prioritise where to practise more.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
