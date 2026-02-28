-- Create progress_tracking table
CREATE TABLE IF NOT EXISTS progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES user_goals(id) ON DELETE SET NULL,
  session_count INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_session_rating NUMERIC(3,2),
  last_session_date TIMESTAMP WITH TIME ZONE,
  coaching_hours NUMERIC(8,2) DEFAULT 0,
  insights_generated INTEGER DEFAULT 0,
  milestones_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user_id ON progress_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_goal_id ON progress_tracking(goal_id);

-- Enable RLS
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own progress"
  ON progress_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON progress_tracking FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_progress_tracking_updated_at
BEFORE UPDATE ON progress_tracking
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
