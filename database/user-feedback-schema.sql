-- User Feedback Schema
-- Stores user feedback responses for app improvement tracking

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profile(user_id) ON DELETE CASCADE,
  
  -- Rating questions (0-5 scale)
  usefulness_rating INT CHECK (usefulness_rating BETWEEN 0 AND 5),
  usage_likelihood_rating INT CHECK (usage_likelihood_rating BETWEEN 0 AND 5),
  recommendation_rating INT CHECK (recommendation_rating BETWEEN 0 AND 5),
  
  -- Open text questions
  positive_feedback TEXT,
  improvement_suggestions TEXT,
  
  -- Metadata
  user_type VARCHAR(20) CHECK (user_type IN ('jobseeker', 'organization')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate submissions (one per user for now)
  UNIQUE(user_id)
);

-- Add index for querying by user type and date
CREATE INDEX idx_user_feedback_user_type ON public.user_feedback(user_type);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at DESC);

-- Add index for user_id lookups
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);

-- Row Level Security Policies
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.user_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own feedback (allow editing submission)
CREATE POLICY "Users can update their own feedback"
  ON public.user_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_feedback TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Comment on table
COMMENT ON TABLE public.user_feedback IS 'Stores user feedback responses including ratings and open text suggestions';
COMMENT ON COLUMN public.user_feedback.usefulness_rating IS 'How well does Talendeur help you showcase your strengths? (0-5)';
COMMENT ON COLUMN public.user_feedback.usage_likelihood_rating IS 'How likely are you to continue using Talendeur? (0-5)';
COMMENT ON COLUMN public.user_feedback.recommendation_rating IS 'How likely are you to recommend Talendeur? (0-5)';
COMMENT ON COLUMN public.user_feedback.positive_feedback IS 'What do you like most about Talendeur?';
COMMENT ON COLUMN public.user_feedback.improvement_suggestions IS 'What could we improve?';
