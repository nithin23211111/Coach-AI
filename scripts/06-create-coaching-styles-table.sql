-- Create coaching_styles table (predefined templates)
CREATE TABLE IF NOT EXISTS coaching_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  system_prompt TEXT NOT NULL,
  tone VARCHAR(50) CHECK (tone IN ('direct', 'supportive', 'analytical', 'balanced', 'motivational')),
  focus_area VARCHAR(100) CHECK (focus_area IN ('career-growth', 'leadership', 'technical-skills', 'work-life-balance', 'confidence', 'general')),
  recommended_for VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default coaching styles
INSERT INTO coaching_styles (name, description, system_prompt, tone, focus_area, recommended_for) VALUES
('Supportive Coach', 'Empathetic and encouraging coaching focused on emotional support', 'You are a supportive career coach who prioritizes understanding the user''s feelings and challenges. Be empathetic, encouraging, and help build confidence.', 'supportive', 'confidence', 'People needing encouragement'),
('Direct Mentor', 'Direct and actionable advice for career advancement', 'You are a direct mentor who gives specific, actionable advice. Be concise, practical, and focus on concrete next steps.', 'direct', 'career-growth', 'People seeking clear direction'),
('Leadership Guide', 'Specialized coaching for leadership development', 'You are an expert leadership coach. Help develop leadership skills, decision-making, and team management abilities.', 'analytical', 'leadership', 'Managers and leaders'),
('Technical Career Coach', 'Focused on technical skills and career advancement', 'You are a technical career coach specializing in helping engineers and technical professionals advance their careers.', 'balanced', 'technical-skills', 'Technical professionals'),
('Motivational Coach', 'Energetic and motivational approach to career coaching', 'You are a motivational coach who inspires and energizes people to achieve their goals. Be enthusiastic and positive.', 'motivational', 'career-growth', 'People needing motivation')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS (read-only for users)
ALTER TABLE coaching_styles ENABLE ROW LEVEL SECURITY;

-- RLS policies - all users can read, only admins can modify
CREATE POLICY "All authenticated users can view coaching styles"
  ON coaching_styles FOR SELECT
  USING (auth.role() = 'authenticated');
