-- Ensure skills_dimensions exists and RLS allows users to save their own rows.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.skills_dimensions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    creativity DECIMAL(5,2) DEFAULT 0,
    communication DECIMAL(5,2) DEFAULT 0,
    critical_thinking DECIMAL(5,2) DEFAULT 0,
    technology_development DECIMAL(5,2) DEFAULT 0,
    operations DECIMAL(5,2) DEFAULT 0,
    social_impact DECIMAL(5,2) DEFAULT 0,
    business_acumen DECIMAL(5,2) DEFAULT 0,
    innovation DECIMAL(5,2) DEFAULT 0,
    collaboration DECIMAL(5,2) DEFAULT 0,
    leadership DECIMAL(5,2) DEFAULT 0,
    precision DECIMAL(5,2) DEFAULT 0,
    depth DECIMAL(5,2) DEFAULT 0,
    commitment DECIMAL(5,2) DEFAULT 0,
    empathy DECIMAL(5,2) DEFAULT 0,
    flexibility DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.skills_dimensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own skills dimensions" ON public.skills_dimensions;
DROP POLICY IF EXISTS "Users can insert their own skills dimensions" ON public.skills_dimensions;
DROP POLICY IF EXISTS "Users can update their own skills dimensions" ON public.skills_dimensions;

CREATE POLICY "Users can view their own skills dimensions" ON public.skills_dimensions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills dimensions" ON public.skills_dimensions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills dimensions" ON public.skills_dimensions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
