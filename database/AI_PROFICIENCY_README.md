# AI Proficiency Feature

## Overview
The AI Proficiency feature allows users (both technical and non-technical) to showcase their AI knowledge, tool usage, and experience. This is particularly valuable for matching job seekers with organizations looking for AI skills at various levels.

## Design Philosophy
**Inclusive by Design**: This feature is designed for everyone from casual ChatGPT users to ML engineers. We recognize that AI proficiency exists on a spectrum and is valuable at all levels.

## Components

### 1. Database Schema (`database/ai-proficiency-schema.sql`)
Three tables power this feature:

#### `ai_proficiency` - Core Skills Profile
Tracks proficiency (1-5 scale) across 6 inclusive categories:
- **AI Tool Usage**: Using AI assistants like ChatGPT, Copilot
- **Generative AI & Prompting**: Creating content through effective prompting
- **Data Analysis & AI**: Using AI for insights and decision-making
- **Machine Learning & Development**: Building/training ML models
- **AI Strategy & Implementation**: Leading AI initiatives
- **AI Ethics & Governance**: Understanding responsible AI practices

#### `ai_tools_used` - Specific Tool Tracking
Tracks individual AI tools with:
- Tool name and category
- Proficiency level (1-5)
- Usage frequency (daily/weekly/monthly/rarely)
- Context (professional/personal/academic)

#### `ai_certifications` - Credentials
Optional tracking of AI-related certifications and courses.

### 2. Form Component (`src/components/profile/AIProficiencyForm.tsx`)
**Features:**
- Slider-based proficiency ratings with clear descriptions
- 20+ popular AI tools to select from (checkboxes with proficiency sliders)
- Years of experience and project count tracking
- "Currently learning" section for growth-minded users
- Clean, user-friendly interface with icons and colors

**User Flow:**
1. Overall experience metrics
2. Rate 6 AI categories (with helpful descriptions)
3. Select AI tools used (optional per-tool proficiency)
4. Indicate learning status

### 3. Chart Visualization (`src/components/dashboard/AIProficiencyChart.tsx`)
**Radar/Spider Chart** showing:
- 6-axis radar plot for visual comparison
- Color-coded proficiency levels
- Years of experience display
- Hover tooltips with level descriptions
- Professional gradient styling matching brand colors

**Why Radar Chart?**
- Shows balanced vs. specialized profiles at a glance
- Easy to compare multiple candidates visually
- Familiar format for recruiters
- Works well with 5-6 data points

### 4. Integration Points

#### Profile Page (`src/pages/Profile.tsx`)
- New "AI Skills" tab between Education and Certifications
- Flows naturally in profile completion journey
- Tab count updated from 6 to 7

#### Public Profile/Dashboard (`src/pages/PublicProfile.tsx`)
- Chart displayed above Biography Word Cloud
- Only shown if user has AI proficiency data
- Fetched via Supabase REST API (respects RLS policies)

## Data Privacy & Access

### Row Level Security (RLS)
- Users can CRUD their own AI proficiency
- **Publicly readable** for matching purposes
- Organization recruiters can view all profiles

### Public Visibility
AI proficiency is intentionally public because:
- Core to matching algorithm
- Helps organizations find right talent
- Encourages community learning

## Usage Examples

### For Job Seekers
**Non-Technical User (HR Professional):**
```
AI Tool Usage: 5/5 (Daily ChatGPT user)
Generative AI: 4/5 (Advanced prompting)
Data Analysis: 2/5 (Basic Excel)
ML Development: 1/5 (Not applicable)
AI Strategy: 3/5 (Implementing AI in HR processes)
AI Ethics: 4/5 (Actively concerned about bias)
```

**Data Analyst:**
```
AI Tool Usage: 4/5
Generative AI: 4/5
Data Analysis: 5/5 (Tableau + AI, Power BI)
ML Development: 3/5 (scikit-learn basics)
AI Strategy: 2/5
AI Ethics: 3/5
```

**ML Engineer:**
```
AI Tool Usage: 5/5
Generative AI: 5/5
Data Analysis: 5/5
ML Development: 5/5 (PyTorch, TensorFlow, Hugging Face)
AI Strategy: 3/5
AI Ethics: 4/5
```

### For Organizations
Can filter/match candidates by:
- Minimum proficiency in specific categories
- Specific tool requirements
- Years of AI experience
- Learning mindset (currently_learning_ai flag)

## Future Enhancements

### Phase 2 (Optional)
1. **AI Project Portfolio**: Link to GitHub/demos
2. **Skill Verification**: Badges for completed assessments
3. **Learning Path Recommendations**: Based on current skills
4. **Peer Endorsements**: Others can validate your AI skills
5. **Trend Tracking**: How skills evolved over time
6. **Tool Recommendations**: Suggest tools based on goals

### Matching Algorithm Integration
```sql
-- Example: Find candidates with intermediate+ prompt engineering
SELECT p.*, ai.generative_ai_prompting
FROM profile p
JOIN ai_proficiency ai ON p.user_id = ai.user_id
WHERE ai.generative_ai_prompting >= 3
AND p.user_type = 'jobseeker'
ORDER BY ai.generative_ai_prompting DESC;

-- Find candidates using specific tools
SELECT p.*, array_agg(ait.tool_name) as tools
FROM profile p
JOIN ai_tools_used ait ON p.user_id = ait.user_id
WHERE ait.tool_name IN ('ChatGPT', 'GitHub Copilot')
AND ait.proficiency_level >= 4
GROUP BY p.user_id;
```

## Setup Instructions

1. **Run the schema**:
   ```bash
   # Execute in Supabase SQL Editor
   database/ai-proficiency-schema.sql
   ```

2. **Verify tables created**:
   - `ai_proficiency`
   - `ai_tools_used`
   - `ai_certifications`

3. **Test with sample data** (optional):
   ```bash
   # Uncomment and replace <user_id_here> in:
   database/sample-ai-proficiency-data.sql
   ```

4. **Component is auto-integrated** - no additional config needed!

## Accessibility

- Keyboard navigable (tab through sliders)
- Screen reader friendly labels
- High contrast color scheme
- Clear proficiency level descriptions
- No time pressure to complete

## Mobile Responsive
- Stacked layout on small screens
- Touch-friendly sliders
- Condensed radar chart for mobile
- Tab-based navigation works well

## Brand Alignment
- Uses Talendeur primary colors (#D1163E)
- Gradient styling matches existing UI
- Icons consistent with design system
- Professional yet approachable tone

## Questions for Future Consideration

1. Should we weight certain AI skills higher in matching?
2. Do we want AI proficiency to be optional or encouraged?
3. Should we gamify skill improvement (badges, levels)?
4. Integration with LinkedIn AI skills?
5. Allow custom tool additions beyond preset list?
