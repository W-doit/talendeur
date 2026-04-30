-- Sample AI proficiency data for testing
-- This demonstrates profiles for different user types:
-- 1. Non-technical AI tool user (HR professional)
-- 2. Data analyst with AI skills
-- 3. ML engineer with deep technical skills

-- Example 1: HR Professional using AI tools daily
-- INSERT INTO public.ai_proficiency (user_id, ai_tool_usage, data_analysis_ai, machine_learning, generative_ai_prompting, ai_strategy_implementation, ai_ethics_governance, years_working_with_ai, ai_projects_completed, currently_learning_ai, learning_focus)
-- VALUES 
-- ('<user_id_here>', 5, 2, 1, 4, 3, 4, 1.5, 5, true, 'Learning advanced prompt engineering and AI ethics for HR applications');

-- Example tools for HR professional:
-- INSERT INTO public.ai_tools_used (user_id, tool_name, tool_category, proficiency_level, usage_frequency, usage_context)
-- VALUES
-- ('<user_id_here>', 'ChatGPT', 'generative_ai', 5, 'daily', 'professional'),
-- ('<user_id_here>', 'Grammarly', 'productivity', 5, 'daily', 'professional'),
-- ('<user_id_here>', 'Notion AI', 'productivity', 4, 'daily', 'professional'),
-- ('<user_id_here>', 'Microsoft Copilot', 'productivity', 3, 'weekly', 'professional');

-- Example 2: Data Analyst
-- INSERT INTO public.ai_proficiency (user_id, ai_tool_usage, data_analysis_ai, machine_learning, generative_ai_prompting, ai_strategy_implementation, ai_ethics_governance, years_working_with_ai, ai_projects_completed, currently_learning_ai, learning_focus)
-- VALUES 
-- ('<user_id_here>', 4, 5, 3, 4, 2, 3, 3.0, 15, true, 'Deep learning for advanced analytics and predictive modeling');

-- Example tools for Data Analyst:
-- INSERT INTO public.ai_tools_used (user_id, tool_name, tool_category, proficiency_level, usage_frequency, usage_context)
-- VALUES
-- ('<user_id_here>', 'ChatGPT', 'generative_ai', 4, 'daily', 'professional'),
-- ('<user_id_here>', 'GitHub Copilot', 'productivity', 4, 'daily', 'professional'),
-- ('<user_id_here>', 'Tableau with AI', 'data_science', 5, 'daily', 'professional'),
-- ('<user_id_here>', 'Power BI with AI', 'data_science', 4, 'weekly', 'professional'),
-- ('<user_id_here>', 'scikit-learn', 'ml_framework', 3, 'weekly', 'professional'),
-- ('<user_id_here>', 'Azure OpenAI', 'ai_platform', 3, 'monthly', 'professional');

-- Example 3: ML Engineer
-- INSERT INTO public.ai_proficiency (user_id, ai_tool_usage, data_analysis_ai, machine_learning, generative_ai_prompting, ai_strategy_implementation, ai_ethics_governance, years_working_with_ai, ai_projects_completed, currently_learning_ai, learning_focus)
-- VALUES 
-- ('<user_id_here>', 5, 5, 5, 5, 3, 4, 5.0, 30, true, 'Exploring latest transformer architectures and LLM fine-tuning techniques');

-- Example tools for ML Engineer:
-- INSERT INTO public.ai_tools_used (user_id, tool_name, tool_category, proficiency_level, usage_frequency, usage_context)
-- VALUES
-- ('<user_id_here>', 'PyTorch', 'ml_framework', 5, 'daily', 'professional'),
-- ('<user_id_here>', 'TensorFlow', 'ml_framework', 5, 'daily', 'professional'),
-- ('<user_id_here>', 'Hugging Face', 'ai_platform', 5, 'daily', 'professional'),
-- ('<user_id_here>', 'LangChain', 'ml_framework', 4, 'daily', 'professional'),
-- ('<user_id_here>', 'GitHub Copilot', 'productivity', 5, 'daily', 'professional'),
-- ('<user_id_here>', 'AWS SageMaker', 'ai_platform', 4, 'weekly', 'professional'),
-- ('<user_id_here>', 'Google Vertex AI', 'ai_platform', 4, 'monthly', 'professional'),
-- ('<user_id_here>', 'scikit-learn', 'ml_framework', 5, 'weekly', 'professional'),
-- ('<user_id_here>', 'ChatGPT', 'generative_ai', 5, 'daily', 'professional');

-- AI Certifications example:
-- INSERT INTO public.ai_certifications (user_id, certification_name, issuing_organization, date_obtained, credential_url)
-- VALUES
-- ('<user_id_here>', 'Machine Learning Specialization', 'Coursera/Stanford', '2024-01-15', 'https://coursera.org/verify/...'),
-- ('<user_id_here>', 'Deep Learning Specialization', 'Coursera/deeplearning.ai', '2024-03-20', 'https://coursera.org/verify/...'),
-- ('<user_id_here>', 'AI Ethics Certificate', 'MIT', '2024-06-10', 'https://mit.edu/verify/...');
