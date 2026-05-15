-- 003_sessions.sql
-- Sessions table for concurrent session management and device tracking

CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_active ON public.sessions(user_id, is_active) WHERE is_active = TRUE;  
CREATE INDEX idx_sessions_expiry ON public.sessions(expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_sessions_last_activity ON public.sessions(last_activity);

-- RLS Policies
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can revoke their own sessions (delete)
CREATE POLICY "Users can revoke own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.sessions
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND expires_at < NOW();

  -- Delete old inactive sessions (older than 30 days)
  DELETE FROM public.sessions
  WHERE is_active = FALSE
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
