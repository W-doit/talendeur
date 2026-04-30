-- AI Proficiency tracking for both technical and non-technical users
-- Includes categories suitable for coders and non-coders

-- Main AI proficiency categories table
CREATE TABLE IF NOT EXISTS public.ai_proficiency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  
  -- High-level categories (1-5 scale)
  ai_tool_usage INTEGER CHECK (ai_tool_usage BETWEEN 1 AND 5),
  data_analysis_ai INTEGER CHECK (data_analysis_ai BETWEEN 1 AND 5),
  machine_learning INTEGER CHECK (machine_learning BETWEEN 1 AND 5),
  generative_ai_prompting INTEGER CHECK (generative_ai_prompting BETWEEN 1 AND 5),
  ai_strategy_implementation INTEGER CHECK (ai_strategy_implementation BETWEEN 1 AND 5),
  ai_ethics_governance INTEGER CHECK (ai_ethics_governance BETWEEN 1 AND 5),
  
  -- Experience metrics
  years_working_with_ai DECIMAL(3,1) DEFAULT 0,
  ai_projects_completed INTEGER DEFAULT 0,
  currently_learning_ai BOOLEAN DEFAULT FALSE,
  learning_focus TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Specific AI tools used
CREATE TABLE IF NOT EXISTS public.ai_tools_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  
  tool_name VARCHAR(100) NOT NULL,
  tool_category VARCHAR(50) NOT NULL, -- 'generative_ai', 'ml_framework', 'data_science', 'ai_platform', 'productivity'
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  usage_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly', 'rarely'
  usage_context VARCHAR(20), -- 'professional', 'personal', 'academic'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI certifications and courses
CREATE TABLE IF NOT EXISTS public.ai_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  
  certification_name VARCHAR(200) NOT NULL,
  issuing_organization VARCHAR(200),
  date_obtained DATE,
  credential_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_proficiency_user_id ON public.ai_proficiency(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tools_user_id ON public.ai_tools_used(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_certifications_user_id ON public.ai_certifications(user_id);

-- RLS Policies
ALTER TABLE public.ai_proficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_certifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI proficiency
CREATE POLICY "Users can view own AI proficiency"
  ON public.ai_proficiency FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own AI proficiency
CREATE POLICY "Users can insert own AI proficiency"
  ON public.ai_proficiency FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI proficiency
CREATE POLICY "Users can update own AI proficiency"
  ON public.ai_proficiency FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own AI proficiency
CREATE POLICY "Users can delete own AI proficiency"
  ON public.ai_proficiency FOR DELETE
  USING (auth.uid() = user_id);

-- AI proficiency is publicly readable for matching purposes
CREATE POLICY "AI proficiency is publicly readable"
  ON public.ai_proficiency FOR SELECT
  USING (true);

-- Similar policies for ai_tools_used
CREATE POLICY "Users can view own AI tools"
  ON public.ai_tools_used FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI tools"
  ON public.ai_tools_used FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI tools"
  ON public.ai_tools_used FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI tools"
  ON public.ai_tools_used FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "AI tools are publicly readable"
  ON public.ai_tools_used FOR SELECT
  USING (true);

-- Similar policies for ai_certifications
CREATE POLICY "Users can view own AI certifications"
  ON public.ai_certifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI certifications"
  ON public.ai_certifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI certifications"
  ON public.ai_certifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI certifications"
  ON public.ai_certifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "AI certifications are publicly readable"
  ON public.ai_certifications FOR SELECT
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_proficiency_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_ai_proficiency_timestamp
  BEFORE UPDATE ON public.ai_proficiency
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_proficiency_updated_at();

CREATE TRIGGER update_ai_tools_timestamp
  BEFORE UPDATE ON public.ai_tools_used
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_proficiency_updated_at();

CREATE TRIGGER update_ai_certifications_timestamp
  BEFORE UPDATE ON public.ai_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_proficiency_updated_at();
