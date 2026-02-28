-- Create feedback_records table
CREATE TABLE IF NOT EXISTS feedback_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  helpful_count INTEGER DEFAULT 0,
  clarity_rating INTEGER CHECK (clarity_rating IS NULL OR (clarity_rating >= 1 AND clarity_rating <= 5)),
  relevance_rating INTEGER CHECK (relevance_rating IS NULL OR (relevance_rating >= 1 AND relevance_rating <= 5)),
  comment TEXT,
  suggested_improvements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_records_session_id ON feedback_records(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_records_user_id ON feedback_records(user_id);

-- Enable RLS
ALTER TABLE feedback_records ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own feedback"
  ON feedback_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON feedback_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON feedback_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_feedback_records_updated_at
BEFORE UPDATE ON feedback_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
