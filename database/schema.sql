-- Jobseeker profile information
CREATE TABLE public.profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name VARCHAR(55) NOT NULL,
  surname VARCHAR(55) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- constraint here using regex
  profile_pic TEXT,
  cv_url TEXT,
  bio TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('jobseeker', 'organization'))
);
-- Jobseeker education history
CREATE TABLE education_hisotry (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES public.profile(user_id),
institution TEXT,
qualification_type TEXT,
subject TEXT,
start_date DATE,
end_date DATE,
still_studying BOOLEAN
);

-- Jobseeker work history
CREATE TABLE work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profile(user_id),
  job_title TEXT,
  company TEXT,
  start_date DATE,
  end_date DATE,
  still_work_here BOOLEAN
);

-- Jobseeker certifications history
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profile(user_id),
  course_name TEXT,
  certification_type TEXT,
  date_attained DATE,
  details VARCHAR(100)
);

-- Jobseeker references
CREATE TABLE reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profile(user_id),
  relationship VARCHAR(55),
  email VARCHAR(100),
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  number INTEGER 
);

-- Jobseeker social media links 
CREATE TABLE socials (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES public.profile(user_id),
platform TEXT,
url TEXT
);

-- Jobseeker skills portion
CREATE TABLE public.jobseeker_skill_rating (
  user_id UUID PRIMARY KEY REFERENCES public.profile(user_id),
  interests TEXT[],
  soft_skills INTEGER CHECK (soft_skills >= 0 AND soft_skills <= 100),
  hard_skills INTEGER CHECK (hard_skills >= 0 AND hard_skills <= 100),
  feedback_score INTEGER CHECK (feedback_score >= 0 AND feedback_score <= 100),
  learning_score INTEGER CHECK (learning_score >= 0 AND learning_score <= 100)
);

-- Hiring company details
CREATE TABLE public.organization_details (
  organization_id UUID PRIMARY KEY REFERENCES auth.users(id),
  logo TEXT,
  company_name TEXT NOT NULL,
  website TEXT,
  about TEXT,
  needs TEXT[] NOT NULL
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profile(user_id),
  organization_id UUID NOT NULL REFERENCES public.organization_details(organization_id),
  user_approved BOOLEAN DEFAULT FALSE,
  organization_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, organization_id)
);