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

import random
import uuid
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from datetime import datetime

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
# 2. USER AND COMPANY ARCHETYPES
# ======================================================
USER_ARCHETYPES = {
    "data_scientist": {"bio":"Data scientist experienced in ML.","skills":["Python","Machine Learning","Statistics","Pandas","SQL"],"education":["Data Science","Computer Science"],"roles":["Data Scientist","ML Engineer"]},
    "backend_engineer": {"bio":"Backend engineer building scalable APIs.","skills":["Python","Django","FastAPI","PostgreSQL","Docker"],"education":["Computer Science"],"roles":["Backend Engineer"]},
    "frontend_engineer": {"bio":"Frontend engineer focused on UI.","skills":["JavaScript","React","HTML","CSS","TypeScript"],"education":["Web Development"],"roles":["Frontend Engineer"]},
    "devops": {"bio":"DevOps engineer automating cloud infrastructure.","skills":["AWS","Docker","Kubernetes","Terraform","CI/CD"],"education":["IT"],"roles":["DevOps Engineer"]},
    "product_manager": {"bio":"Product manager coordinating teams.","skills":["Agile","Roadmapping","Stakeholder Management","Analytics"],"education":["Business"],"roles":["Product Manager"]}
}

NOISE_SKILLS = ["Excel", "Communication", "Git", "Problem Solving", "Time Management"]

COMPANY_ARCHETYPES = {
    "ai_startup": {"bio":"AI startup building ML products.","roles":["Data Scientist","ML Engineer"],"skills":["Python","Machine Learning","AWS"]},
    "saas_backend": {"bio":"SaaS backend company.","roles":["Backend Engineer"],"skills":["Python","APIs","Databases"]},
    "web_agency": {"bio":"Web agency creating frontend experiences.","roles":["Frontend Engineer"],"skills":["React","JavaScript","CSS"]},
    "cloud_company": {"bio":"Cloud infrastructure company.","roles":["DevOps Engineer"],"skills":["AWS","Docker","Kubernetes"]},
    "product_company": {"bio":"Product-driven company.","roles":["Product Manager"],"skills":["Agile","Product Strategy"]}
}

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
            "role": random.choice(base["roles"])
        }

        # Assign preferences
        assigned_preferences = []
        for q in questions:
            q_id = q["id"]
            q_type = q.get("answer_type", "multi_select")
            q_opts = options_by_question.get(q_id, [])

            if q_type == "multi_select" and q_opts:
                selected = random.sample(q_opts, k=random.randint(1,min(3,len(q_opts))))
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
                scale_val = random.randint(q.get("scale_min",1), q.get("scale_max",5))
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
# 4. GENERATE COMPANIES AND JOBS
# ======================================================
def generate_companies(n=5):
    companies = []
    for i in range(n):
        archetype = random.choice(list(COMPANY_ARCHETYPES.keys()))
        base = COMPANY_ARCHETYPES[archetype]
        companies.append({
            "id": str(uuid.uuid4()),
            "archetype": archetype,
            "company_name": f"{archetype.replace('_',' ').title()} {i}",
            "bio": base["bio"] + " " + " ".join(base["skills"]),
            "roles": base["roles"]
        })
    return pd.DataFrame(companies)

df_companies = generate_companies(n=5)

def build_jobs(df_companies):
    jobs = []
    for _, row in df_companies.iterrows():
        for role in row["roles"]:
            jobs.append({
                "job_id": str(uuid.uuid4()),
                "company_id": row["id"],
                "company_name": row["company_name"],
                "company_archetype": row["archetype"],
                "role": role,
                "bio": row["bio"],
                "seniority": random.choice(["Intern","Junior","Mid-level","Senior","Staff","Principal"])
            })
    return pd.DataFrame(jobs)

df_jobs = build_jobs(df_companies)

# ======================================================
# 5. TEXT EMBEDDINGS
# ======================================================
def build_user_text(df):
    return df["bio"] + " " + ("skills "*3) + df["skills"].apply(lambda x: " ".join(x)) + " " + ("role "*2) + df["role"]

def build_job_text(df):
    return df["bio"] + " " + ("role "*3) + df["role"]

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

    # Seniority bonus
    user_seniority = [p["option_label"] for p in user["assigned_preferences"] if p["option_label"] and p["question_text"].lower()=="seniority level"]
    breakdown["seniority_bonus"] = 0.05 if job["seniority"] in user_seniority else 0

    # Company type bonus
    user_company_types = [p["option_label"] for p in user["assigned_preferences"] if p["option_label"] and p["question_text"].lower()=="company type"]
    breakdown["company_type_bonus"] = 0.07 if job["company_archetype"].replace("_"," ").title() in user_company_types else 0

    # Other preference bonuses (optional)
    total_bonus = sum([v for k,v in breakdown.items() if k != "base_cosine"])
    total_score = base + total_bonus
    breakdown["total_score"] = total_score
    return total_score, breakdown

def filter_jobs_for_user(user_row):
    return df_jobs[df_jobs["role"] == user_row["role"]]

def recommend_jobs_verbose(user_index, top_n=5):
    user_row = df_users.iloc[user_index]
    eligible_jobs = filter_jobs_for_user(user_row)
    results = []
    for idx in eligible_jobs.index:
        score, breakdown = hybrid_score_verbose(user_index, idx)
        results.append({
            "company_name": df_jobs.iloc[idx]["company_name"],
            "role": df_jobs.iloc[idx]["role"],
            "company_archetype": df_jobs.iloc[idx]["company_archetype"],
            "score": score,
            "breakdown": breakdown
        })
    return pd.DataFrame(results).sort_values("score", ascending=False).head(top_n)

# ======================================================
# 7. TESTING
# ======================================================
test_user = 0
print("User archetype:", df_users.iloc[test_user]["archetype"])
print("User role:", df_users.iloc[test_user]["role"])

print("\nAssigned preferences:")
for p in df_users.iloc[test_user]["assigned_preferences"]:
    if p["option_label"]:
        print(f"  {p['question_text']}: {p['option_label']}")
    else:
        print(f"  {p['question_text']}: scale {p['scale_value']}")

print("\nRecommended jobs with breakdown:")
df_verbose = recommend_jobs_verbose(test_user, top_n=5)
for _, row in df_verbose.iterrows():
    print(f"\nCompany: {row['company_name']}, Role: {row['role']}, Archetype: {row['company_archetype']}")
    print(f"  Total Score: {row['score']}")
    print(f"  Breakdown: {row['breakdown']}")