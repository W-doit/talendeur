import random
import uuid
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from supabase import create_client, Client
from datetime import datetime

# ======================================================
# 0. CONNECT TO SUPABASE
# ======================================================
SUPABASE_URL = "https://clmnzuqgybreszqphvgt.supabase.co"
SUPABASE_KEY = "sb_publishable___RjeUinWtk3BcJ0YQvCWw_mGAFIdXn"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ======================================================
# 1. SYNTHETIC QUESTIONS & OPTIONS (mocking supabase)
# ======================================================
questions = [
    {"id": 1, "text": "Seniority Level", "answer_type": "multi_select"},
    {"id": 2, "text": "Skills Confidence", "answer_type": "scale", "scale_min": 1, "scale_max": 5},
    {"id": 3, "text": "Company Type", "answer_type": "multi_select"},
    {"id": 4, "text": "Work Setup", "answer_type": "multi_select"},
    {"id": 5, "text": "Main Goals", "answer_type": "multi_select"},
    {"id": 6, "text": "Company Culture Values", "answer_type": "multi_select"},
]

options = [
    # Seniority
    {"id": 101, "question_id": 1, "label": "Intern"},
    {"id": 102, "question_id": 1, "label": "Junior"},
    {"id": 103, "question_id": 1, "label": "Mid-level"},
    {"id": 104, "question_id": 1, "label": "Senior"},
    {"id": 105, "question_id": 1, "label": "Staff"},
    {"id": 106, "question_id": 1, "label": "Principal"},
    # Company Type
    {"id": 201, "question_id": 3, "label": "Startup"},
    {"id": 202, "question_id": 3, "label": "Scale-up"},
    {"id": 203, "question_id": 3, "label": "Enterprise"},
    {"id": 204, "question_id": 3, "label": "Agency"},
    {"id": 205, "question_id": 3, "label": "Research-focused"},
    {"id": 206, "question_id": 3, "label": "Non-profit"},
    {"id": 207, "question_id": 3, "label": "Public"},
    # Work Setup
    {"id": 301, "question_id": 4, "label": "Remote"},
    {"id": 302, "question_id": 4, "label": "Hybrid"},
    {"id": 303, "question_id": 4, "label": "On-site"},
    # Main Goals
    {"id": 401, "question_id": 5, "label": "Learning & Growth"},
    {"id": 402, "question_id": 5, "label": "Career Stability"},
    {"id": 403, "question_id": 5, "label": "High Compensation"},
    {"id": 404, "question_id": 5, "label": "Work-life Balance"},
    # Culture Values
    {"id": 501, "question_id": 6, "label": "Fast-paced Environment"},
    {"id": 502, "question_id": 6, "label": "Strong Mentorship"},
    {"id": 503, "question_id": 6, "label": "Work-life Balance"},
    {"id": 504, "question_id": 6, "label": "Modern Tech Stack"},
    {"id": 505, "question_id": 6, "label": "Cross-functional Collaboration"},
]

# Organize options by question_id
options_by_question = {}
for opt in options:
    options_by_question.setdefault(opt["question_id"], []).append(opt)

# ======================================================
# 2. USER ARCHETYPES
# ======================================================
USER_ARCHETYPES = {
    "data_scientist": {
        "bio": "Data scientist experienced in ML.",
        "skills": ["Python", "Machine Learning", "Statistics", "Pandas", "SQL"],
        "education": ["Data Science", "Computer Science"],
        "roles": ["AI Research Scientist", "Research Engineer"]  # Updated roles
    },
    "backend_engineer": {
        "bio": "Backend engineer building scalable APIs.",
        "skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Docker"],
        "education": ["Computer Science"],
        "roles": ["Senior Software Engineer", "Software Developer"]  # Updated roles
    },
    "frontend_engineer": {
        "bio": "Frontend engineer focused on UI.",
        "skills": ["JavaScript", "React", "HTML", "CSS", "TypeScript"],
        "education": ["Web Development"],
        "roles": ["Full Stack Developer", "Software Developer"]  # Updated roles
    },
    "devops": {
        "bio": "DevOps engineer automating cloud infrastructure.",
        "skills": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
        "education": ["IT"],
        "roles": ["Cloud Solutions Architect", "Solutions Engineer"]  # Updated roles
    },
    "product_manager": {
        "bio": "Product manager coordinating teams.",
        "skills": ["Agile", "Roadmapping", "Stakeholder Management", "Analytics"],
        "education": ["Business"],
        "roles": ["Product Manager", "EdTech Product Manager"]  # Updated roles
    }
}

NOISE_SKILLS = ["Excel", "Communication", "Git", "Problem Solving", "Time Management"]

# ======================================================
# 3. GENERATE USERS WITH RANDOM PREFERENCES
# ======================================================
def generate_users(n=5):
    users = []
    for _ in range(n):
        archetype = random.choice(list(USER_ARCHETYPES.keys()))
        base = USER_ARCHETYPES[archetype]

        skills = base["skills"].copy()
        if random.random() < 0.3:
            skills += random.sample(NOISE_SKILLS, 2)

        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "archetype": archetype,
            "bio": base["bio"],
            "skills": skills,
            "education": random.choice(base["education"]),
            "roles": base["roles"],
            "experience": random.randint(1, 10)  # Add the 'experience' column
        }

        # Assign preferences (unchanged)
        assigned_preferences = []
        for q in questions:
            q_id = q["id"]
            q_type = q.get("answer_type", "multi_select")
            q_opts = options_by_question.get(q_id, [])

            if q_type == "multi_select" and q_opts:
                selected = random.sample(q_opts, k=random.randint(1, min(3, len(q_opts))))
                for opt in selected:
                    assigned_preferences.append({
                        "user_id": user_id,
                        "question_id": q_id,
                        "option_id": opt["id"],
                        "option_label": opt["label"],
                        "question_text": q["text"],
                        "scale_value": None,
                        "created_at": datetime.utcnow()
                    })
            elif q_type == "scale":
                scale_val = random.randint(q.get("scale_min", 1), q.get("scale_max", 5))
                assigned_preferences.append({
                    "user_id": user_id,
                    "question_id": q_id,
                    "option_id": None,
                    "option_label": None,
                    "question_text": q["text"],
                    "scale_value": scale_val,
                    "created_at": datetime.utcnow()
                })

        user["assigned_preferences"] = assigned_preferences
        users.append(user)
    return pd.DataFrame(users)

df_users = generate_users(n=5)

# ======================================================
# 4. FETCH COMPANIES AND JOBS FROM SUPABASE
# ======================================================
def fetch_companies_from_supabase():
    response = supabase.table("organizations_mig").select("*").execute()
    return pd.DataFrame(response.data)

def fetch_jobs_from_supabase():
    response = supabase.table("job_postings_mig").select("*").execute()
    return pd.DataFrame(response.data)

# Fetch data from Supabase
df_companies = fetch_companies_from_supabase()  # organizations_mig
df_jobs = fetch_jobs_from_supabase()            # job_postings_mig

# Merge jobs with company info
df_jobs = df_jobs.merge(
    df_companies[["id", "company_name", "bio"]],
    left_on="company_id",
    right_on="id",
    how="left",
    suffixes=("_job", "_company")  # Optional: Explicitly set suffixes
)

# Drop redundant columns
df_jobs.drop(columns=["id", "company_name_job"], inplace=True)  # Drop the redundant 'id' and 'company_name_x'

# Rename the company_name column if needed
df_jobs.rename(columns={"company_name_company": "company_name"}, inplace=True)

# Verify
print("Columns in df_jobs after merge:", df_jobs.columns)
print("First few rows of df_jobs after merge:")
print(df_jobs.head())

# ======================================================
# 5. TEXT EMBEDDINGS
# ======================================================
def build_user_text(df):
    return (
        df["bio"] + " " +
        ("skills "*3) + df["skills"].apply(lambda x: " ".join(x)) + " " +
        ("roles "*2) + df["roles"].apply(lambda x: " ".join(x))
    )

def build_job_text(df):
    return (
        df["job_post"] + " " +
        df["technical_skills"] + " " +
        df["soft_skills"] + " " +
        df["keyword_1"] + " " +
        df["keyword_2"] + " " +
        df["keyword_3"]
    )

df_users["profile_text"] = build_user_text(df_users)
df_jobs["job_text"] = build_job_text(df_jobs)

model = SentenceTransformer("all-MiniLM-L6-v2")
user_embeddings = model.encode(df_users["profile_text"].tolist(), normalize_embeddings=True)
job_embeddings = model.encode(df_jobs["job_text"].tolist(), normalize_embeddings=True)
similarity_matrix = cosine_similarity(user_embeddings, job_embeddings)

# ======================================================
# 6. SCORING FUNCTION
# ======================================================
def hybrid_score_verbose(user_idx, job_idx):
    user = df_users.iloc[user_idx]
    job = df_jobs.iloc[job_idx]
    base = similarity_matrix[user_idx, job_idx]
    breakdown = {"base_cosine": base}

    # --- Job Fit Score ---
    # Technical Skills
    user_skills = set(user["skills"])
    job_skills = set(job["technical_skills"].split(", "))
    technical_skills_match = len(user_skills.intersection(job_skills)) / len(job_skills) if job_skills else 0
    matching_skills = list(user_skills.intersection(job_skills))
    missing_skills = list(job_skills - user_skills)

    # Experience
    experience_match = 0
    if "experience" in user and pd.notna(user["experience"]):
        experience_match = 1 if (job["minimum_work_experience"] <= user["experience"] <= job["max_work_experience"]) else 0
        experience_status = "within range" if experience_match else "outside range"

    # Education
    education_match = 1 if user["education"] == job["education"] else 0
    education_status = "matches" if education_match else "does not match"

    # Certifications (if available)
    user_certifications = set(user.get("certifications", []))
    job_certifications = set(job["certifications"].split(", "))
    certifications_match = len(user_certifications.intersection(job_certifications)) / len(job_certifications) if job_certifications else 0
    matching_certifications = list(user_certifications.intersection(job_certifications))
    missing_certifications = list(job_certifications - user_certifications)

    job_fit_score = (
        0.40 * technical_skills_match +
        0.25 * experience_match +
        0.20 * education_match +
        0.15 * certifications_match
    )
    breakdown["job_fit_score"] = job_fit_score
    breakdown["job_fit_explanation"] = {
        "technical_skills": {
            "match_percentage": technical_skills_match * 100,
            "matching_skills": matching_skills,
            "missing_skills": missing_skills
        },
        "experience": {
            "match_percentage": experience_match * 100,
            "status": experience_status
        },
        "education": {
            "match_percentage": education_match * 100,
            "status": education_status
        },
        "certifications": {
            "match_percentage": certifications_match * 100,
            "matching_certifications": matching_certifications,
            "missing_certifications": missing_certifications
        }
    }

    # --- Company Fit Score ---
    # Company Type
    user_company_types = [p["option_label"] for p in user["assigned_preferences"] if p["option_label"] and p["question_text"].lower() == "company type"]
    company_type_match = 1 if any(ct.lower() in job["company_name"].lower() for ct in user_company_types) else 0
    matching_company_types = [ct for ct in user_company_types if ct.lower() in job["company_name"].lower()]

    # Work Setup
    user_work_setup = [p["option_label"] for p in user["assigned_preferences"] if p["option_label"] and p["question_text"].lower() == "work setup"]
    work_setup_match = 1 if any(ws.lower() in job["job_post"].lower() for ws in user_work_setup) else 0
    matching_work_setup = [ws for ws in user_work_setup if ws.lower() in job["job_post"].lower()]

    # Culture Values
    user_culture_values = [p["option_label"] for p in user["assigned_preferences"] if p["option_label"] and p["question_text"].lower() == "company culture values"]
    company_culture_values = [job["keyword_1"], job["keyword_2"], job["keyword_3"]]
    culture_values_match = len(set(user_culture_values).intersection(company_culture_values)) / len(user_culture_values) if user_culture_values else 0
    matching_culture_values = list(set(user_culture_values).intersection(company_culture_values))

    # Main Goals
    user_main_goals = [p["option_label"] for p in user["assigned_preferences"] if p["option_label"] and p["question_text"].lower() == "main goals"]
    main_goals_match = len(set(user_main_goals).intersection(company_culture_values)) / len(user_main_goals) if user_main_goals else 0
    matching_main_goals = list(set(user_main_goals).intersection(company_culture_values))

    company_fit_score = (
        0.20 * company_type_match +
        0.20 * work_setup_match +
        0.30 * culture_values_match +
        0.30 * main_goals_match
    )
    breakdown["company_fit_score"] = company_fit_score
    breakdown["company_fit_explanation"] = {
        "company_type": {
            "match_percentage": company_type_match * 100,
            "matching_types": matching_company_types
        },
        "work_setup": {
            "match_percentage": work_setup_match * 100,
            "matching_setup": matching_work_setup
        },
        "culture_values": {
            "match_percentage": culture_values_match * 100,
            "matching_values": matching_culture_values
        },
        "main_goals": {
            "match_percentage": main_goals_match * 100,
            "matching_goals": matching_main_goals
        }
    }

    # --- Technical Skills Bonus ---
    breakdown["technical_skills_bonus"] = 0.1 * technical_skills_match

    # --- Keywords Bonus ---
    user_keywords = set([p["option_label"] for p in user["assigned_preferences"] if p["option_label"] and p["question_text"].lower() in ["main goals", "company culture values"]])
    job_keywords = set([job["keyword_1"], job["keyword_2"], job["keyword_3"]])
    keywords_match = len(user_keywords.intersection(job_keywords)) / len(job_keywords) if job_keywords else 0
    breakdown["keywords_bonus"] = 0.08 * keywords_match

    # --- Total Score ---
    total_bonus = sum([v for k, v in breakdown.items() if k != "base_cosine" and isinstance(v, (int, float))])
    total_score = base + total_bonus
    breakdown["total_score"] = total_score

    # Scale up Job Fit and Company Fit Scores
    scaled_job_fit = breakdown["job_fit_score"] * 0.5  # Increase weight
    scaled_company_fit = breakdown["company_fit_score"] * 0.3  # Increase weight

    # Add scaled scores to total_bonus
    total_bonus = sum([v for k, v in breakdown.items() if k != "base_cosine" and isinstance(v, (int, float))]) + scaled_job_fit + scaled_company_fit
    total_score = base + total_bonus

    return total_score, breakdown

def filter_jobs_for_user(user_row):
    user_role = user_row["roles"][0].lower()  # Use the first role
    eligible_jobs = df_jobs[df_jobs["job_post"].str.lower().str.contains(user_role)]
    return eligible_jobs

def recommend_jobs_verbose(user_index, top_n=5):
    user_row = df_users.iloc[user_index]
    print(f"User role: {user_row['roles'][0]}")
    eligible_jobs = filter_jobs_for_user(user_row)
    print(f"Number of eligible jobs: {len(eligible_jobs)}")
    print("Indices of eligible_jobs:", eligible_jobs.index)  # Debug line

    results = []
    for idx in eligible_jobs.index:
        print(f"Accessing index: {idx}")  # Debug line
        score, breakdown = hybrid_score_verbose(user_index, idx)
        results.append({
            "company_name": eligible_jobs.loc[idx, "company_name"],  # Use .loc for clarity
            "role": eligible_jobs.loc[idx, "job_post"],
            "job_id": eligible_jobs.loc[idx, "job_id"],
            "score": score,
            "breakdown": breakdown
        })

    if not results:
        return pd.DataFrame()
    return pd.DataFrame(results).sort_values("score", ascending=False).head(top_n)

# ======================================================
# 7. TESTING
# ======================================================
test_user = 0
print("User archetype:", df_users.iloc[test_user]["archetype"])
print("User roles:", df_users.iloc[test_user]["roles"])

print("\nAssigned preferences:")
for p in df_users.iloc[test_user]["assigned_preferences"]:
    if p["option_label"]:
        print(f"  {p['question_text']}: {p['option_label']}")
    else:
        print(f"  {p['question_text']}: scale {p['scale_value']}")

print("\nRecommended jobs with breakdown:")
df_verbose = recommend_jobs_verbose(test_user, top_n=5)
if not df_verbose.empty:
    for _, row in df_verbose.iterrows():
        print(f"\nCompany: {row['company_name']}, Role: {row['role']}")
        print(f"  Total Score: {row['score']:.2f}")

        # Job Fit Score explanation
        job_fit_explanation = row['breakdown']['job_fit_explanation']
        print(f"\n  Job Fit Score: {row['breakdown']['job_fit_score'] * 100:.1f}% (your alignment with the job requirements)")
        print(f"    Technical Skills: {job_fit_explanation['technical_skills']['match_percentage']:.1f}% match")
        print(f"      Matching skills: {', '.join(job_fit_explanation['technical_skills']['matching_skills']) if job_fit_explanation['technical_skills']['matching_skills'] else 'None'}")
        print(f"      Missing skills: {', '.join(job_fit_explanation['technical_skills']['missing_skills']) if job_fit_explanation['technical_skills']['missing_skills'] else 'None'}")
        print(f"    Experience: {job_fit_explanation['experience']['match_percentage']:.1f}% ({job_fit_explanation['experience']['status']})")
        print(f"    Education: {job_fit_explanation['education']['match_percentage']:.1f}% ({job_fit_explanation['education']['status']})")
        print(f"    Certifications: {job_fit_explanation['certifications']['match_percentage']:.1f}% match")
        print(f"      Matching certifications: {', '.join(job_fit_explanation['certifications']['matching_certifications']) if job_fit_explanation['certifications']['matching_certifications'] else 'None'}")
        print(f"      Missing certifications: {', '.join(job_fit_explanation['certifications']['missing_certifications']) if job_fit_explanation['certifications']['missing_certifications'] else 'None'}")

        # Company Fit Score explanation
        company_fit_explanation = row['breakdown']['company_fit_explanation']
        print(f"\n  Company Fit Score: {row['breakdown']['company_fit_score'] * 100:.1f}% (the alignment of the company with your values and preferences)")
        print(f"    Company Type: {company_fit_explanation['company_type']['match_percentage']:.1f}% match")
        print(f"      Matching types: {', '.join(company_fit_explanation['company_type']['matching_types']) if company_fit_explanation['company_type']['matching_types'] else 'None'}")
        print(f"    Work Setup: {company_fit_explanation['work_setup']['match_percentage']:.1f}% match")
        print(f"      Matching setup: {', '.join(company_fit_explanation['work_setup']['matching_setup']) if company_fit_explanation['work_setup']['matching_setup'] else 'None'}")
        print(f"    Culture Values: {company_fit_explanation['culture_values']['match_percentage']:.1f}% match")
        print(f"      Matching values: {', '.join(company_fit_explanation['culture_values']['matching_values']) if company_fit_explanation['culture_values']['matching_values'] else 'None'}")
        print(f"    Main Goals: {company_fit_explanation['main_goals']['match_percentage']:.1f}% match")
        print(f"      Matching goals: {', '.join(company_fit_explanation['main_goals']['matching_goals']) if company_fit_explanation['main_goals']['matching_goals'] else 'None'}")
else:
    print("No jobs recommended.")
