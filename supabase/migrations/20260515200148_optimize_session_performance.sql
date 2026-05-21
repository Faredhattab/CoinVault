-- Performance optimizations for session management
-- Eliminates sequential COUNT queries during login

-- 1. Create trigger function to enforce concurrent session limit
CREATE OR REPLACE FUNCTION public.enforce_session_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_session_count INTEGER;
  max_sessions INTEGER := 3; -- Default from settings, can be overridden
BEGIN
  -- Count active sessions for this user
  SELECT COUNT(*) INTO active_session_count
  FROM public.sessions
  WHERE user_id = NEW.user_id
    AND is_active = TRUE
    AND id != NEW.id; -- Exclude the current session being inserted/updated

  -- Raise exception if limit exceeded
  IF active_session_count >= max_sessions THEN
    RAISE EXCEPTION 'session_limit_exceeded: Maximum concurrent sessions (%) reached', max_sessions
      USING ERRCODE = '23505'; -- unique_violation code for easier handling
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach trigger to sessions table
DROP TRIGGER IF EXISTS enforce_session_limit_trigger ON public.sessions;
CREATE TRIGGER enforce_session_limit_trigger
  BEFORE INSERT ON public.sessions
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION public.enforce_session_limit();

-- 3. Add composite index for faster session limit checks (if not exists)
-- This makes the COUNT query in the trigger much faster
CREATE INDEX IF NOT EXISTS idx_sessions_user_active_count
  ON public.sessions(user_id)
  WHERE is_active = TRUE;

-- 4. Add partial index for session validation queries
-- Optimizes the validate_session lookup by (id, is_active, expires_at)
CREATE INDEX IF NOT EXISTS idx_sessions_validation
  ON public.sessions(id, is_active, expires_at)
  WHERE is_active = TRUE;
