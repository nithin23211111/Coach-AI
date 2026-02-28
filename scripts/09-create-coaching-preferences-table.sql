-- Create coaching_preferences table
CREATE TABLE IF NOT EXISTS coaching_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_coaching_style VARCHAR(100),
  preferred_ai_model VARCHAR(50) CHECK (preferred_ai_model IN ('claude', 'grok', 'groq', 'mixed')),
  session_frequency VARCHAR(50) CHECK (session_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'asneeded')),
  preferred_session_length_minutes INTEGER CHECK (preferred_session_length_minutes > 0),
  timezone VARCHAR(50),
  language VARCHAR(50) DEFAULT 'en',
  notification_preferences TEXT,
  privacy_level VARCHAR(50) CHECK (privacy_level IN ('public', 'private', 'anonymous')),
  avatar_style VARCHAR(50),
  theme_preference VARCHAR(50) CHECK (theme_preference IN ('light', 'dark', 'auto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_coaching_preferences_user_id ON coaching_preferences(user_id);

-- Enable RLS
ALTER TABLE coaching_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own preferences"
  ON coaching_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON coaching_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON coaching_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_coaching_preferences_updated_at
BEFORE UPDATE ON coaching_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
