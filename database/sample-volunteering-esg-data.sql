-- Sample volunteering data for user (replace with your actual user_id)
-- This will automatically trigger ESG score calculation

DO $$
DECLARE
    v_user_id UUID := '83930b98-7a76-4f28-8345-1f557dd0f14e'; -- Replace with actual user ID
BEGIN
    -- Insert volunteering experiences with ESG categorization
    
    -- Environmental activities (total: 180 hours)
    INSERT INTO volunteering (user_id, organization_name, role, cause_area, start_date, end_date, is_ongoing, hours_contributed, description, impact_description)
    VALUES 
    (v_user_id, 'Ocean Cleanup Initiative', 'Volunteer Coordinator', 'Environmental', '2023-01-15', '2023-06-30', false, 80,
     'Led coastal cleanup campaigns and organized community awareness programs about ocean pollution.',
     'Removed over 2 tons of plastic waste from local beaches and educated 500+ community members.'),
    
    (v_user_id, 'Urban Green Spaces Project', 'Community Gardener', 'Environmental', '2022-03-01', '2022-12-31', false, 60,
     'Helped establish community gardens in underserved neighborhoods, promoting urban agriculture.',
     'Created 3 new community gardens providing fresh produce to 200+ families.'),
    
    (v_user_id, 'Renewable Energy Education', 'Workshop Facilitator', 'Environmental', '2024-02-01', NULL, true, 40,
     'Conduct workshops on solar energy and sustainable living practices for local communities.',
     'Trained 150+ households in renewable energy adoption and energy efficiency.');

    -- Social activities (total: 280 hours)
    INSERT INTO volunteering (user_id, organization_name, role, cause_area, start_date, end_date, is_ongoing, hours_contributed, description, impact_description)
    VALUES 
    (v_user_id, 'Code for Good', 'Tech Mentor', 'Social Justice', '2021-09-01', '2023-05-31', false, 120,
     'Mentored underprivileged youth in coding and technology skills, focusing on career development.',
     'Mentored 25 students, with 18 securing tech internships or jobs.'),
    
    (v_user_id, 'Literacy First', 'Reading Tutor', 'Education', '2020-06-01', '2021-08-31', false, 90,
     'Provided one-on-one tutoring for children from low-income families to improve reading skills.',
     'Improved reading levels of 30 students by an average of 2 grade levels.'),
    
    (v_user_id, 'Healthcare Access Project', 'Data Analyst Volunteer', 'Social Justice', '2023-09-01', NULL, true, 70,
     'Analyze healthcare access data to identify gaps and support policy advocacy for underserved communities.',
     'Published 2 research reports influencing local healthcare policy decisions.');

    -- Governance activities (total: 60 hours)
    INSERT INTO volunteering (user_id, organization_name, role, cause_area, start_date, end_date, is_ongoing, hours_contributed, description, impact_description)
    VALUES 
    (v_user_id, 'Transparency International Chapter', 'Research Assistant', 'Governance', '2022-01-15', '2022-06-30', false, 35,
     'Supported anti-corruption research and transparency initiatives in local government.',
     'Contributed to corruption perception index report for the region.'),
    
    (v_user_id, 'Civic Tech Alliance', 'Board Member', 'Governance', '2023-01-01', NULL, true, 25,
     'Serve on the board to guide strategy for civic technology projects promoting government accountability.',
     'Launched 2 open data platforms improving government transparency.');

    -- Health-related (counts as Social) (total: 40 hours)
    INSERT INTO volunteering (user_id, organization_name, role, cause_area, start_date, end_date, is_ongoing, hours_contributed, description, impact_description)
    VALUES 
    (v_user_id, 'Mental Health Awareness Network', 'Community Advocate', 'Social Justice', '2024-03-01', NULL, true, 40,
     'Organize mental health awareness campaigns and support groups for young professionals.',
     'Reached 500+ individuals through workshops and support sessions.');

    -- After all inserts, the trigger will automatically calculate ESG scores
    -- Let's verify the calculation
    RAISE NOTICE 'Volunteering data inserted successfully for user %', v_user_id;
    
    -- Display calculated ESG scores
    RAISE NOTICE 'ESG Scores: %', (SELECT ROW(environment_score, social_score, governance_score) FROM esg_scores WHERE user_id = v_user_id);
    
END $$;

-- Query to view the ESG breakdown
SELECT 
    'Environmental' as category,
    COALESCE(SUM(hours_contributed), 0) as total_hours,
    ROUND(COALESCE(SUM(hours_contributed), 0) * 100.0 / NULLIF((SELECT SUM(hours_contributed) FROM volunteering WHERE user_id = '83930b98-7a76-4f28-8345-1f557dd0f14e'), 0), 2) as percentage
FROM volunteering 
WHERE user_id = '83930b98-7a76-4f28-8345-1f557dd0f14e' AND cause_area ILIKE '%environment%'
UNION ALL
SELECT 
    'Social' as category,
    COALESCE(SUM(hours_contributed), 0) as total_hours,
    ROUND(COALESCE(SUM(hours_contributed), 0) * 100.0 / NULLIF((SELECT SUM(hours_contributed) FROM volunteering WHERE user_id = '83930b98-7a76-4f28-8345-1f557dd0f14e'), 0), 2) as percentage
FROM volunteering 
WHERE user_id = '83930b98-7a76-4f28-8345-1f557dd0f14e' AND cause_area IN ('Social Justice', 'Education', 'Health')
UNION ALL
SELECT 
    'Governance' as category,
    COALESCE(SUM(hours_contributed), 0) as total_hours,
    ROUND(COALESCE(SUM(hours_contributed), 0) * 100.0 / NULLIF((SELECT SUM(hours_contributed) FROM volunteering WHERE user_id = '83930b98-7a76-4f28-8345-1f557dd0f14e'), 0), 2) as percentage
FROM volunteering 
WHERE user_id = '83930b98-7a76-4f28-8345-1f557dd0f14e' AND cause_area ILIKE '%governance%';

-- View final ESG scores
SELECT * FROM esg_scores WHERE user_id = '83930b98-7a76-4f28-8345-1f557dd0f14e';
