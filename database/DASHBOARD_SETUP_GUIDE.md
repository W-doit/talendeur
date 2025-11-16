# 📊 Talendeur Dashboard Setup Guide

## Overview
This guide helps you set up the complete database schema for the Talendeur dashboard, based on the streamlit app analysis. The dashboard will include:

- **Work Experience Timeline** (8 positions)
- **Education History** (4 qualifications including Master's degree)
- **Certifications** (12 professional certs)
- **References** (3 detailed recommendations)
- **Volunteering Experience** (8 activities with ESG scoring)
- **International Experience** (5 countries on world map)
- **Skills Radar Chart** (15 dimensions)
- **Personality Test Results** (Big Five with 30 facets)
- **Key Metrics** (total experience, highest degree, avg years per job)

---

## 🗂️ Database Structure

### New Tables Created

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `work_experience` | Job history | job_title, company, dates, description |
| `education` | Academic credentials | degree, institution, field_of_study |
| `certifications` | Professional certs | certification_name, category, dates |
| `references` | Recommendations | reference_text, relationship |
| `volunteering` | Volunteer work | organization, cause, description |
| `international_experience` | Global exposure | country, duration_months |
| `skills_dimensions` | 15 skill metrics | creativity, leadership, empathy, etc. |
| `esg_scores` | ESG impact | environment, social, governance |
| `personality_traits` | Big Five scores | extraversion, openness, etc. |
| `personality_facets` | 30 facet scores | friendliness, altruism, etc. |
| `certification_summary` | Cert categories | counts by category |

### Views Created

- `profile_experience_metrics` - Calculates total_years_experience, avg_years_per_job
- `profile_highest_qualification` - Determines highest degree (PhD > Master > Bachelor)

---

## 🚀 Setup Instructions

### Step 1: Run the Schema Script

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Create a new query
3. Copy the contents of `dashboard-schema.sql`
4. Click **Run**
5. Wait for confirmation (should take 10-15 seconds)

✅ **Success message:** "Success. No rows returned"

This creates:
- 11 new tables
- Row Level Security policies
- Indexes for performance
- Triggers for updated_at timestamps
- 2 views for calculated metrics

---

### Step 2: Run the Fake Data Script

1. **IMPORTANT:** First, find your user ID
   - In Supabase Dashboard → **Authentication** → **Users**
   - Copy your user ID (UUID format)
   
   OR run this query:
   ```sql
   SELECT id, email FROM auth.users;
   ```

2. Open `dashboard-fake-data.sql`

3. **Option A - Auto-detect user (recommended):**
   - The script will automatically use the first user
   - Just run it as-is

4. **Option B - Specify by email:**
   - Find this line (around line 20):
   ```sql
   SELECT id INTO user_id FROM auth.users LIMIT 1;
   ```
   - Replace with:
   ```sql
   SELECT id INTO user_id FROM auth.users WHERE email = 'your-email@example.com';
   ```

5. Run the script in SQL Editor

6. Check for success message:
   ```
   NOTICE: Fake data successfully inserted for user: [your-user-id]
   ```

---

### Step 3: Verify Data

Run these queries to check everything worked:

```sql
-- Check work experience (should return 8 rows)
SELECT job_title, company, start_date, end_date 
FROM work_experience 
ORDER BY start_date DESC;

-- Check education (should return 4 rows)
SELECT degree, field_of_study, institution 
FROM education 
ORDER BY end_date DESC;

-- Check certifications (should return 12 rows)
SELECT certification_name, category 
FROM certifications;

-- Check personality traits (should return 5 trait scores)
SELECT extraversion, agreeableness, conscientiousness, neuroticism, openness 
FROM personality_traits;

-- Check calculated metrics
SELECT * FROM profile_experience_metrics;

-- Check highest qualification
SELECT * FROM profile_highest_qualification;

-- Check skills dimensions
SELECT creativity, communication, critical_thinking, social_impact 
FROM skills_dimensions;

-- Check ESG scores
SELECT environment_score, social_score, governance_score 
FROM esg_scores;
```

---

## 📋 What Data Was Created

### Work Experience (8 positions, 2017-2024)
- **Current:** Senior Data Scientist at Talendeur (Paris)
- **Previous:** Data Scientist, ML Engineer, Data Analyst
- **Early Career:** Research Assistant, Intern, Volunteer Coordinator

### Education (Master's Degree)
- **Master's:** Data Science from UC Berkeley (3.9 GPA)
- **Bachelor's:** Computer Science from Cal State LA (3.7 GPA)
- **Certificates:** Sustainable Development (Stanford), ML Specialization

### Certifications (12 certs)
- **Data Analysis:** CAP, Tableau, Google Data Analytics
- **Technology:** AWS ML, Python, Deep Learning
- **Project Management:** Scrum Master, CSM
- **Business:** B Corp Leadership, ESG Analyst

### Volunteering (8 activities)
- **Tech:** Code for Social Good, Girls Who Code
- **Environment:** Environmental Action Network, Beach Cleanup
- **Social:** Refugee Support, Food Bank, Habitat for Humanity
- **Education:** Youth Literacy Project

### International Experience (5 countries)
- 🇫🇷 France (Paris) - 21 months work
- 🇲🇽 Mexico (Mexico City) - 15 months work
- 🇰🇪 Kenya (Nairobi) - 3 months volunteer
- 🇪🇸 Spain (Barcelona) - 3 months study
- 🇯🇵 Japan (Tokyo) - 3 months cultural exchange

### Personality Profile (Big Five)
- **Openness:** 89/100 (very high - creative, curious)
- **Conscientiousness:** 85/100 (high - organized, reliable)
- **Agreeableness:** 78/100 (high - cooperative, empathetic)
- **Extraversion:** 62/100 (moderate - balanced social energy)
- **Neuroticism:** 38/100 (low - emotionally stable)

Plus 30 facet scores (e.g., Intellect: 95, Achievement Striving: 92, Altruism: 85)

### Skills Dimensions (15 metrics, 0-100 scale)
- **Highest:** Social Impact (94.6), Critical Thinking (92.3), Commitment (91.2)
- **Strong:** Technology (88.7), Collaboration (89.3), Depth (90.5)
- **Good:** Creativity (78.5), Innovation (81.9), Leadership (82.7)

### ESG Scores (from volunteering)
- **Social:** 52.8% (education, refugee support, food bank)
- **Environment:** 35.2% (beach cleanup, environmental advocacy)
- **Governance:** 12.0% (data ethics, transparency)

---

## 🎨 Next Steps: Build the Dashboard

Now that you have the data, you can build React components to visualize it!

### Phase 2: Data Display Components
1. Create profile overview with key metrics
2. Work experience timeline
3. Education cards
4. Certifications list

### Phase 3: Visualizations
1. **Skills Polar Chart** (15 dimensions using Recharts)
2. **Certifications Bar Chart** (top 5 categories)
3. **Volunteering Donut Chart** (by cause)
4. **ESG Bar Chart** (Environment/Social/Governance)

### Phase 4: Advanced Features
1. **International Map** (choropleth with country colors)
2. **Personality Sunburst** (Big Five + facets hierarchy)
3. **Personality Radar Charts** (5 main traits + 5 facet radars)
4. **Biography Word Cloud** (from bio text)

---

## 🔧 Troubleshooting

### "No rows returned" error
- Make sure you ran `complete-setup.sql` first (creates base tables)
- Check that your user exists: `SELECT * FROM auth.users;`

### "User not found" error
- Update the email in `dashboard-fake-data.sql` line 20
- Or manually set user_id variable

### Data not showing
- Verify RLS policies allow SELECT: `SELECT * FROM work_experience;`
- Check you're logged in as the correct user in your app

### Want to reset data?
```sql
-- Delete all dashboard data for a user
DELETE FROM work_experience WHERE profile_id = 'your-user-id';
DELETE FROM education WHERE profile_id = 'your-user-id';
DELETE FROM certifications WHERE profile_id = 'your-user-id';
-- ... repeat for all tables
-- Then re-run dashboard-fake-data.sql
```

---

## 📊 Data Model Diagram

```
profile (main table)
  ├── work_experience (1-to-many)
  ├── education (1-to-many)
  ├── certifications (1-to-many)
  ├── references (1-to-many)
  ├── volunteering (1-to-many)
  ├── international_experience (1-to-many)
  ├── skills_dimensions (1-to-1)
  ├── esg_scores (1-to-1)
  ├── certification_summary (1-to-1)
  └── personality_traits (1-to-many)
        └── personality_facets (1-to-1)
```

---

## 💡 Tips

1. **Performance:** All tables have indexes on `profile_id` for fast queries
2. **Security:** RLS policies ensure users can only modify their own data
3. **Flexibility:** Add more work experience, education, etc. anytime with INSERT
4. **Metrics:** Use the views (`profile_experience_metrics`) for calculated data
5. **Updates:** All tables have `updated_at` triggers for automatic timestamps

---

## 📞 Need Help?

- Check Supabase logs: Dashboard → Database → Logs
- Test queries in SQL Editor first
- Verify authentication: `SELECT auth.uid();` should return your user ID

---

## ✅ Checklist

- [ ] Ran `dashboard-schema.sql` successfully
- [ ] Ran `dashboard-fake-data.sql` successfully  
- [ ] Verified work_experience has 8 rows
- [ ] Verified education has 4 rows
- [ ] Verified certifications has 12 rows
- [ ] Checked personality_traits returns 5 scores
- [ ] Viewed profile_experience_metrics (shows ~8 years total experience)
- [ ] Ready to build React dashboard components!

---

**You're all set!** 🎉 Your database now has rich, realistic data ready for visualization. Time to build those beautiful dashboards!
