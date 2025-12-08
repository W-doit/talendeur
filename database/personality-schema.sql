-- Personality test results tables

-- Main Big Five scores
CREATE TABLE IF NOT EXISTS personality_traits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    openness DECIMAL(5,2) DEFAULT 0,
    conscientiousness DECIMAL(5,2) DEFAULT 0,
    extraversion DECIMAL(5,2) DEFAULT 0,
    agreeableness DECIMAL(5,2) DEFAULT 0,
    neuroticism DECIMAL(5,2) DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed facet scores (30 facets, 6 per trait)
CREATE TABLE IF NOT EXISTS personality_facets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Openness facets
    imagination DECIMAL(5,2) DEFAULT 0,
    artistic_interests DECIMAL(5,2) DEFAULT 0,
    emotionality DECIMAL(5,2) DEFAULT 0,
    adventurousness DECIMAL(5,2) DEFAULT 0,
    intellect DECIMAL(5,2) DEFAULT 0,
    liberalism DECIMAL(5,2) DEFAULT 0,
    -- Conscientiousness facets
    self_efficacy DECIMAL(5,2) DEFAULT 0,
    orderliness DECIMAL(5,2) DEFAULT 0,
    dutifulness DECIMAL(5,2) DEFAULT 0,
    achievement_striving DECIMAL(5,2) DEFAULT 0,
    self_discipline DECIMAL(5,2) DEFAULT 0,
    cautiousness DECIMAL(5,2) DEFAULT 0,
    -- Extraversion facets
    friendliness DECIMAL(5,2) DEFAULT 0,
    gregariousness DECIMAL(5,2) DEFAULT 0,
    assertiveness DECIMAL(5,2) DEFAULT 0,
    activity_level DECIMAL(5,2) DEFAULT 0,
    excitement_seeking DECIMAL(5,2) DEFAULT 0,
    cheerfulness DECIMAL(5,2) DEFAULT 0,
    -- Agreeableness facets
    trust DECIMAL(5,2) DEFAULT 0,
    morality DECIMAL(5,2) DEFAULT 0,
    altruism DECIMAL(5,2) DEFAULT 0,
    cooperation DECIMAL(5,2) DEFAULT 0,
    modesty DECIMAL(5,2) DEFAULT 0,
    sympathy DECIMAL(5,2) DEFAULT 0,
    -- Neuroticism facets
    anxiety DECIMAL(5,2) DEFAULT 0,
    anger DECIMAL(5,2) DEFAULT 0,
    depression DECIMAL(5,2) DEFAULT 0,
    self_consciousness DECIMAL(5,2) DEFAULT 0,
    immoderation DECIMAL(5,2) DEFAULT 0,
    vulnerability DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE personality_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_facets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own personality traits" ON personality_traits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personality traits" ON personality_traits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personality traits" ON personality_traits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own personality facets" ON personality_facets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personality facets" ON personality_facets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personality facets" ON personality_facets
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_personality_traits_user_id ON personality_traits(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_facets_user_id ON personality_facets(user_id);
