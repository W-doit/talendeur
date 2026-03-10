## RECOMMENDATION SYSTEM

# Overview
This repository contains two Python scripts for a job recommendation system:

**recommender_simple.py**: A basic version that recommends jobs based on user preferences and job descriptions.
**recommender_with-scoring-system.py**: An advanced version that includes a detailed scoring system for job fit, company fit, and skills/certifications.

# Files
1. **recommender_simple.py**

<u>Purpose</u>
A simple job recommender that matches user preferences with job descriptions using cosine similarity.

<u>Key Features</u>
User Input: Collects user preferences (e.g., seniority, company type, work setup).
Job Matching: Uses cosine similarity to match user preferences with job descriptions.
Output: Recommends jobs based on similarity scores.

<u>Dependencies</u>
pandas
scikit-learn (for cosine_similarity)
sentence-transformers (for text embeddings)
supabase (for database interaction)

<u>How to Use</u>
Install dependencies: pip install pandas scikit-learn sentence-transformers supabase
Run the script: python recommender_simple.py

2. **recommender_with-scoring-system.py**
<u>Purpose</u>
An advanced job recommender that provides a detailed breakdown of job fit, company fit, and skills/certifications. 

<u>Key Features</u>
Scoring System: Evaluates job fit based on multiple criteria:
Job Fit: Skills, certifications, and seniority.
Company Fit: Company type, work setup, culture values, and main goals.
Detailed Explanation: Provides a breakdown of match percentages for each criterion.
User Input: Collects user preferences and skills/certifications.

<u>Dependencies</u>
Same as recommender_simple.py.

<u>How to Use</u>
Install dependencies (if not already installed). 
Run the script: python recommender_with-scoring-system.py

# Methodology
<u>Data Structure</u>
User Preferences: Collected via prompts (e.g., seniority, company type, work setup).
Job Data: Simulated or fetched from a database (e.g., Supabase).
Scoring: Uses cosine similarity for text-based matching and custom logic for fit scores.

<u>Scoring Logic</u>
Job Fit: Based on skills, certifications, and seniority.
Company Fit: Based on company type, work setup, culture values, and main goals.
Output: A ranked list of jobs with detailed match explanations.

# Notes
Replace the *SUPABASE_URL* and *SUPABASE_KEY* with your actual Supabase credentials if you’re using a real database.
The scripts include mock data for demonstration. Replace with real data as needed.