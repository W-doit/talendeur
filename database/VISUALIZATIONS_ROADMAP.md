# 📊 Dashboard Visualizations Roadmap

Based on streamlit app analysis: **W-doit/talendeur-streamlit**

---

## 🎯 Phase 1: Database Schema ✅ COMPLETE

- ✅ Created 11 new database tables
- ✅ Generated realistic fake data (8 years of work, Master's degree, 12 certs, etc.)
- ✅ Added calculated metrics views
- ✅ Set up RLS policies

**Files created:**
- `database/dashboard-schema.sql` - Full schema with 11 tables
- `database/dashboard-fake-data.sql` - Realistic sample data
- `database/DASHBOARD_SETUP_GUIDE.md` - Setup instructions

---

## 🚀 Phase 2: Data Display Components (NEXT)

### 2.1 Profile Header
**Component:** `ProfileHeader.tsx`
- Profile picture + name
- Bio text (with word cloud option later)
- Country of origin + cultural heritage flags

### 2.2 Key Metrics Cards
**Component:** `ProfileMetrics.tsx`
```tsx
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  Highest Degree     │  Total Experience   │  Avg Years/Job      │
│  Master's           │  8.2 years          │  1.0 years          │
└─────────────────────┴─────────────────────┴─────────────────────┘
```
**Data:** From `profile_experience_metrics` view

### 2.3 Work Experience Timeline
**Component:** `WorkExperienceTimeline.tsx`
- Vertical timeline with company logos
- Job title, company, dates
- Expandable descriptions
- "Current" badge for active position

**Data:** `work_experience` table (8 positions)

### 2.4 Education Cards
**Component:** `EducationCards.tsx`
- Card grid layout
- Degree badge (Master's, Bachelor's, Certificate)
- Institution, dates, GPA

**Data:** `education` table (4 entries)

### 2.5 Certifications List
**Component:** `CertificationsList.tsx`
- Grouped by category
- Badge with expiration status
- Category icons

**Data:** `certifications` table (12 certs)

---

## 📈 Phase 3: Basic Visualizations

### 3.1 Skills Polar/Radar Chart ⭐ PRIORITY
**Component:** `SkillsRadarChart.tsx`
**Library:** Recharts `<RadarChart>`

```
         Creativity
              📊
    Social Impact   Innovation
           \  |  /
            \ | /
     Business ⊕ Tech
            / | \
           /  |  \
  Operations  |  Critical Thinking
        Communication
```

**15 Dimensions:**
- creativity, communication, critical_thinking
- technology_development, operations, social_impact
- business_acumen, innovation
- collaboration, leadership, precision
- depth, commitment, empathy, flexibility

**Data:** `skills_dimensions` table

**Chart Config:**
```tsx
<RadarChart data={skillsData}>
  <PolarGrid />
  <PolarAngleAxis dataKey="dimension" />
  <PolarRadiusAxis domain={[0, 100]} />
  <Radar name="Skills" dataKey="value" fill="#D1163E" fillOpacity={0.6} />
</RadarChart>
```

### 3.2 Top 5 Certifications Bar Chart
**Component:** `CertificationsBarChart.tsx`
**Library:** Recharts `<BarChart>`

```
Technology        ████████████ 5
Data Analysis     ██████████ 4
Project Mgmt      ████ 2
Business Strategy ████ 2
Leadership        ██ 1
```

**Data:** `certification_summary` table

### 3.3 Volunteering Donut Chart
**Component:** `VolunteeringDonutChart.tsx`
**Library:** Recharts `<PieChart>` with innerRadius

```
     ┌─────────────┐
     │ Environment │ 25% 🌿
     │ Education   │ 37.5% 📚
     │ Social      │ 37.5% 🤝
     └─────────────┘
      8 experiences
      Total: 32 hours/week
```

**Data:** `volunteering` table grouped by cause

### 3.4 ESG Bar Chart
**Component:** `ESGScoresChart.tsx`
**Library:** Recharts `<BarChart>` horizontal

```
Social        ████████████████████ 52.8%
Environment   ██████████████ 35.2%
Governance    ████ 12.0%
```

**Data:** `esg_scores` table

---

## 🌍 Phase 4: Advanced Visualizations

### 4.1 International Experience Map
**Component:** `InternationalMap.tsx`
**Library:** `react-simple-maps` + `d3-geo`

- Choropleth world map
- Countries colored by time spent
- Tooltip with city, duration, purpose
- Legend: 0-6 months (light) to 18+ months (dark)

**Data:** `international_experience` table (5 countries)

**Countries:**
- 🇫🇷 France (21 months) - darkest
- 🇲🇽 Mexico (15 months)
- 🇰🇪 Kenya (3 months)
- 🇪🇸 Spain (3 months)
- 🇯🇵 Japan (3 months)

### 4.2 Biography Word Cloud
**Component:** `BioWordCloud.tsx`
**Library:** `react-wordcloud` or `d3-cloud`

- Extract words from profile.bio
- Remove stopwords
- Size by frequency
- Color palette: Talendeur brand colors

**Data:** `profile.bio` text field

---

## 🧠 Phase 5: Personality Visualizations

### 5.1 Big Five Sunburst Chart
**Component:** `PersonalitySunburst.tsx`
**Library:** Plotly React (`react-plotly.js`) or D3

```
                  YOU
         /  /  |  \  \
    E   A   C   N   O
   /|\ /|\ /|\ /|\ /|\
  (30 facets displayed)
```

**Hierarchy:**
1. Center: "You"
2. Ring 1: 5 traits (Extraversion, Agreeableness, etc.)
3. Ring 2: 30 facets (6 per trait)

**Data:** 
- `personality_traits` table (5 scores)
- `personality_facets` table (30 scores)

**Interactions:**
- Click to zoom into trait
- Hover shows score percentage
- Color-coded by trait

### 5.2 Big Five Radar Chart
**Component:** `PersonalityRadarChart.tsx`
**Library:** Recharts

```
      Openness (89)
           📊
    Extraversion  Conscientiousness
    (62)      \  |  /    (85)
               \ | /
                ⊕
               / | \
              /  |  \
   Agreeableness  Neuroticism
      (78)          (38)
```

**Data:** `personality_traits` table

### 5.3 Facet Radar Charts (5 separate charts)
**Component:** `PersonalityFacetRadar.tsx`
**One chart per trait, showing 6 facets each**

**Example - Extraversion facets:**
- Friendliness: 65
- Gregariousness: 58
- Assertiveness: 70
- Activity Level: 68
- Excitement-Seeking: 55
- Cheerfulness: 66

**Data:** `personality_facets` table

---

## 🗂️ Component Structure

```
src/
  components/
    dashboard/
      ProfileHeader.tsx
      ProfileMetrics.tsx           ← Key metrics cards
      WorkExperienceTimeline.tsx
      EducationCards.tsx
      CertificationsList.tsx
      SkillsRadarChart.tsx         ⭐ PRIORITY
      CertificationsBarChart.tsx
      VolunteeringDonutChart.tsx
      ESGScoresChart.tsx
      InternationalMap.tsx
      BioWordCloud.tsx
      PersonalitySunburst.tsx
      PersonalityRadarChart.tsx
      PersonalityFacetRadar.tsx
  pages/
    Dashboard.tsx                  ← Main page combining all components
```

---

## 📦 Required Libraries

### Already Installed (likely)
- `recharts` - For most charts
- `react` + `@supabase/supabase-js`

### Need to Install
```bash
bun add react-plotly.js plotly.js          # For sunburst chart
bun add react-simple-maps d3-geo           # For world map
bun add react-wordcloud                    # For word cloud
bun add lucide-react                       # For icons
bun add date-fns                           # For date formatting
```

---

## 🎨 Design Guidelines

### Color Palette (Talendeur Brand)
- Primary: `#D1163E` (burnt orange/red)
- Pink: `#E30F68`
- Orange: `#FF9F14`
- Navy: `#180D51`
- Gradients: `from-talendeur-primary to-talendeur-orange`

### Chart Styling
- Rounded corners: `rounded-xl`
- Card shadows: `shadow-md hover:shadow-lg`
- Gradient backgrounds for headers
- White cards on gradient page background

### Responsive Breakpoints
- Mobile: Single column
- Tablet: 2-column grid
- Desktop: 3-column grid for metrics, 2-column for charts

---

## 📊 Data Fetching Strategy

### Option 1: Individual Queries (Simple)
```tsx
const { data: workExperience } = await supabase
  .from('work_experience')
  .select('*')
  .eq('profile_id', userId)
  .order('start_date', { ascending: false });
```

### Option 2: Comprehensive Query (Efficient)
```tsx
const { data: dashboardData } = await supabase
  .from('profile')
  .select(`
    *,
    work_experience (*),
    education (*),
    certifications (*),
    skills_dimensions (*),
    esg_scores (*),
    personality_traits (*, personality_facets (*))
  `)
  .eq('id', userId)
  .single();
```

---

## 🎯 Implementation Order

### Week 1: Core Display
1. ✅ Database setup (DONE)
2. Profile header + metrics
3. Work experience timeline
4. Education + certifications lists

### Week 2: Skills & Impact
5. **Skills radar chart** ⭐
6. Certifications bar chart
7. Volunteering donut + ESG bar

### Week 3: Advanced
8. International map
9. Word cloud
10. Personality visualizations

---

## 📝 Notes

- **Streamlit app** uses Plotly for most charts → can use Recharts for React
- **ESG scoring** in streamlit uses SentenceTransformer embeddings → we'll use pre-calculated scores
- **Skills mapping** in streamlit uses AI job title matching → we'll use manual scores for now
- **Personality test** is separate 120-question app → can integrate later

---

## ✅ Ready to Start?

When you're ready to build the dashboard:
1. Run the SQL scripts in Supabase
2. Verify data with test queries
3. Start with Phase 2 (Profile Header + Metrics)
4. Then build Skills Radar Chart (most impressive visual)

**Current Status:** Phase 1 Complete ✅
**Next Up:** Phase 2 - Data Display Components
