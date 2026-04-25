import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import { ResponsiveSunburst } from '@nivo/sunburst';

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

const CATEGORY_LABELS: Record<string, string> = {
  ai_tool_usage: 'AI Tools',
  generative_ai_prompting: 'Generative AI',
  data_analysis_ai: 'Data & AI',
  machine_learning: 'Machine Learning',
  ai_strategy_implementation: 'AI Strategy',
  ai_ethics_governance: 'AI Ethics'
};

// Using personality test color palette
const PROFICIENCY_COLORS = [
  '#FFCFD2', // Level 1 - light pink (Extraversion)
  '#FFAFC5', // Level 2 - pink (Agreeableness)
  '#AA778A', // Level 3 - mauve (Neuroticism)
  '#9EBC9E', // Level 4 - sage green (Openness)
  '#CFC6B8', // Level 5 - beige/tan (Conscientiousness)
];

// Alternative: Category-specific colors from personality traits
const CATEGORY_COLORS: Record<string, string> = {
  ai_tool_usage: '#9EBC9E',           // Sage green
  generative_ai_prompting: '#FFAFC5', // Pink
  data_analysis_ai: '#CFC6B8',        // Beige
  machine_learning: '#AA778A',        // Mauve
  ai_strategy_implementation: '#FFCFD2', // Light pink
  ai_ethics_governance: '#9EBC9E'     // Sage green
};

export const AIProficiencyChart = ({ data, tools = [] }: AIProficiencyChartProps) => {
  const [sunburstData, setSunburstData] = useState<any>(null);

  useEffect(() => {
    console.log('AIProficiencyChart - received data:', data);
    console.log('AIProficiencyChart - received tools:', tools);
    
    if (!data) return;

    // Check if user has any proficiency
    const hasAnySkills = Object.entries(data)
      .filter(([key]) => key !== 'years_working_with_ai')
      .some(([, value]) => value > 1);

    if (!hasAnySkills) {
      console.log('AIProficiencyChart - not rendering: all skills are level 1 or below');
      return;
    }

    // Build hierarchical structure for sunburst
    const categories = [
      { key: 'ai_tool_usage', label: CATEGORY_LABELS.ai_tool_usage, value: data.ai_tool_usage },
      { key: 'generative_ai_prompting', label: CATEGORY_LABELS.generative_ai_prompting, value: data.generative_ai_prompting },
      { key: 'data_analysis_ai', label: CATEGORY_LABELS.data_analysis_ai, value: data.data_analysis_ai },
      { key: 'machine_learning', label: CATEGORY_LABELS.machine_learning, value: data.machine_learning },
      { key: 'ai_strategy_implementation', label: CATEGORY_LABELS.ai_strategy_implementation, value: data.ai_strategy_implementation },
      { key: 'ai_ethics_governance', label: CATEGORY_LABELS.ai_ethics_governance, value: data.ai_ethics_governance }
    ];

    // Map tools to categories
    const toolsByCategory: Record<string, AIToolsUsed[]> = {
      ai_tool_usage: [],
      generative_ai_prompting: [],
      data_analysis_ai: [],
      machine_learning: [],
      ai_strategy_implementation: [],
      ai_ethics_governance: []
    };

    tools.forEach(tool => {
      // Map tool categories to our main categories
      const categoryMap: Record<string, string> = {
        'generative_ai': 'generative_ai_prompting',
        'ml_framework': 'machine_learning',
        'data_science': 'data_analysis_ai',
        'ai_platform': 'ai_tool_usage',
        'productivity': 'ai_tool_usage'
      };
      
      const mainCategory = categoryMap[tool.tool_category] || 'ai_tool_usage';
      if (toolsByCategory[mainCategory]) {
        toolsByCategory[mainCategory].push(tool);
      }
    });

    // Build sunburst structure
    const children = categories
      .filter(cat => cat.value > 0) // Only include categories with proficiency
      .map(category => {
        const categoryTools = toolsByCategory[category.key] || [];
        
        // If category has tools, create children for them
        const toolChildren = categoryTools.map(tool => ({
          name: tool.tool_name,
          value: tool.proficiency_level,
          proficiency: tool.proficiency_level
        }));

        // If no tools, create a single child representing the category proficiency
        const children = toolChildren.length > 0 
          ? toolChildren 
          : [{ name: `${category.label} Skills`, value: category.value, proficiency: category.value }];

        return {
          name: category.label,
          value: category.value,
          proficiency: category.value,
          children
        };
      });

    const hierarchicalData = {
      name: 'AI Proficiency',
      children
    };

    console.log('AIProficiencyChart - sunburst data:', hierarchicalData);
    setSunburstData(hierarchicalData);
  }, [data, tools]);

  if (!data || !sunburstData) {
    console.log('AIProficiencyChart - not rendering: no data or sunburst data');
    return null;
  }

  const yearsExp = data.years_working_with_ai || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-talendeur-primary" />
          AI Proficiency
          {yearsExp > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {yearsExp} {yearsExp === 1 ? 'year' : 'years'} experience
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '500px' }}>
          <ResponsiveSunburst
            data={sunburstData}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            id="name"
            value="value"
            cornerRadius={2}
            borderWidth={2}
            borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
            colors={(node) => {
              // Use category-specific colors for main categories (depth 1)
              if (node.depth === 1) {
                // Map category labels to their keys
                const labelToKey: Record<string, string> = {
                  'AI Tools': 'ai_tool_usage',
                  'Generative AI': 'generative_ai_prompting',
                  'Data & AI': 'data_analysis_ai',
                  'Machine Learning': 'machine_learning',
                  'AI Strategy': 'ai_strategy_implementation',
                  'AI Ethics': 'ai_ethics_governance'
                };
                const categoryKey = labelToKey[node.data.name];
                if (categoryKey && CATEGORY_COLORS[categoryKey]) {
                  return CATEGORY_COLORS[categoryKey];
                }
              }
              // Use proficiency-based colors for tools (child nodes at depth 2)
              const proficiency = node.data.proficiency || 1;
              return PROFICIENCY_COLORS[Math.min(proficiency - 1, 4)];
            }}
            childColor={{ from: 'color', modifiers: [['brighter', 0.2]] }}
            enableArcLabels={true}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            arcLabel={(node) => {
              // For categories (depth 1), show category name
              if (node.depth === 1) {
                return String(node.id);
              }
              // For tools (depth 2), show proficiency level
              const proficiency = node.data.proficiency || 1;
              const levelNames = ['L1', 'L2', 'L3', 'L4', 'L5'];
              return `${node.id} (${levelNames[proficiency - 1]})`;
            }}
            tooltip={({ id, value, data }) => {
              const proficiency = data.proficiency || 1;
              const levels = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert'];
              return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                  <p className="font-semibold">{id}</p>
                  <p className="text-sm text-gray-600">
                    Level {proficiency}/5: {levels[proficiency - 1]}
                  </p>
                </div>
              );
            }}
            animate={true}
            motionConfig="gentle"
          />
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROFICIENCY_COLORS[0] }} />
            <span>Level 1</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROFICIENCY_COLORS[2] }} />
            <span>Level 3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PROFICIENCY_COLORS[4] }} />
            <span>Level 5</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
