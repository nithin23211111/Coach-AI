-- Create session_messages table
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  ai_model_used VARCHAR(50),
  tokens_used INTEGER,
  feedback_rating INTEGER CHECK (feedback_rating IS NULL OR (feedback_rating >= 1 AND feedback_rating <= 5)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_user_id ON session_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created_at ON session_messages(created_at ASC);

-- Enable RLS
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view messages from their sessions"
  ON session_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages to their sessions"
  ON session_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON session_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON session_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_session_messages_updated_at
BEFORE UPDATE ON session_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
