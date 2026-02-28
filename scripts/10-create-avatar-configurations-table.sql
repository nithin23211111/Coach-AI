-- Create avatar_configurations table
CREATE TABLE IF NOT EXISTS avatar_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spline_scene_url VARCHAR(500),
  avatar_name VARCHAR(100),
  avatar_personality VARCHAR(100),
  appearance_style VARCHAR(100) CHECK (appearance_style IN ('professional', 'casual', 'formal', 'creative')),
  animation_speed NUMERIC(3,2) DEFAULT 1.0,
  voice_enabled BOOLEAN DEFAULT TRUE,
  voice_type VARCHAR(50),
  expression_intensity NUMERIC(3,2) DEFAULT 1.0,
  gesture_preferences TEXT,
  color_scheme VARCHAR(50),
  custom_traits TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_avatar_configurations_user_id ON avatar_configurations(user_id);

-- Enable RLS
ALTER TABLE avatar_configurations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own avatar configuration"
  ON avatar_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatar configuration"
  ON avatar_configurations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own avatar configuration"
  ON avatar_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_avatar_configurations_updated_at
BEFORE UPDATE ON avatar_configurations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
