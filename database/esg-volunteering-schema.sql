-- Create volunteering table to track volunteer activities
CREATE TABLE IF NOT EXISTS volunteering (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    role TEXT,
    cause_area TEXT, -- Environmental, Social, Governance
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT false,
    hours_contributed INTEGER,
    description TEXT,
    impact_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ESG scores table (can be calculated or manually set)
CREATE TABLE IF NOT EXISTS esg_scores (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    environment_score DECIMAL(5,2) DEFAULT 0,
    social_score DECIMAL(5,2) DEFAULT 0,
    governance_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create international experience table
CREATE TABLE IF NOT EXISTS international_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    experience_type TEXT, -- Work, Study, Volunteer
    duration_months INTEGER,
    start_date DATE,
    end_date DATE,
    purpose TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills dimensions table (15 dimensions for radar chart)
CREATE TABLE IF NOT EXISTS skills_dimensions (
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_volunteering_user_id ON volunteering(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteering_cause_area ON volunteering(cause_area);
CREATE INDEX IF NOT EXISTS idx_international_experience_user_id ON international_experience(user_id);

-- Create a function to automatically calculate ESG scores from volunteering data
CREATE OR REPLACE FUNCTION calculate_esg_scores(p_user_id UUID)
RETURNS TABLE(environment_score DECIMAL, social_score DECIMAL, governance_score DECIMAL) AS $$
DECLARE
    v_total_hours INTEGER;
    v_env_hours INTEGER;
    v_social_hours INTEGER;
    v_gov_hours INTEGER;
BEGIN
    -- Get total hours contributed
    SELECT COALESCE(SUM(hours_contributed), 0) INTO v_total_hours
    FROM volunteering
    WHERE user_id = p_user_id;

    -- Get hours per category
    SELECT COALESCE(SUM(hours_contributed), 0) INTO v_env_hours
    FROM volunteering
    WHERE user_id = p_user_id AND cause_area ILIKE '%environment%';

    SELECT COALESCE(SUM(hours_contributed), 0) INTO v_social_hours
    FROM volunteering
    WHERE user_id = p_user_id AND cause_area ILIKE '%social%';

    SELECT COALESCE(SUM(hours_contributed), 0) INTO v_gov_hours
    FROM volunteering
    WHERE user_id = p_user_id AND cause_area ILIKE '%governance%';

    -- Calculate percentages
    IF v_total_hours > 0 THEN
        RETURN QUERY SELECT
            (v_env_hours::DECIMAL / v_total_hours * 100)::DECIMAL(5,2),
            (v_social_hours::DECIMAL / v_total_hours * 100)::DECIMAL(5,2),
            (v_gov_hours::DECIMAL / v_total_hours * 100)::DECIMAL(5,2);
    ELSE
        -- Return default equal distribution if no data
        RETURN QUERY SELECT 33.33::DECIMAL(5,2), 33.33::DECIMAL(5,2), 33.34::DECIMAL(5,2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update ESG scores when volunteering data changes
CREATE OR REPLACE FUNCTION update_esg_scores_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_scores RECORD;
BEGIN
    -- Calculate new scores
    SELECT * INTO v_scores FROM calculate_esg_scores(COALESCE(NEW.user_id, OLD.user_id));
    
    -- Upsert into esg_scores table
    INSERT INTO esg_scores (user_id, environment_score, social_score, governance_score, updated_at)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        v_scores.environment_score,
        v_scores.social_score,
        v_scores.governance_score,
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        environment_score = EXCLUDED.environment_score,
        social_score = EXCLUDED.social_score,
        governance_score = EXCLUDED.governance_score,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS volunteering_esg_update ON volunteering;
CREATE TRIGGER volunteering_esg_update
    AFTER INSERT OR UPDATE OR DELETE ON volunteering
    FOR EACH ROW
    EXECUTE FUNCTION update_esg_scores_trigger();

-- Enable Row Level Security
ALTER TABLE volunteering ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE international_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_dimensions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own volunteering" ON volunteering
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own volunteering" ON volunteering
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own volunteering" ON volunteering
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own volunteering" ON volunteering
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ESG scores" ON esg_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ESG scores" ON esg_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ESG scores" ON esg_scores
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own international experience" ON international_experience
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own international experience" ON international_experience
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own international experience" ON international_experience
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own international experience" ON international_experience
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own skills dimensions" ON skills_dimensions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skills dimensions" ON skills_dimensions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills dimensions" ON skills_dimensions
    FOR UPDATE USING (auth.uid() = user_id);
