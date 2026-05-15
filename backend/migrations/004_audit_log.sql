-- 004_audit_log.sql
-- Audit log for authentication events

CREATE TABLE public.auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_success',
    'login_failure',
    'logout',
    'session_created',
    'session_revoked',
    'session_expired',
    'password_changed',
    'oauth_linked',
    'oauth_unlinked',
    'rate_limit_exceeded'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_user_id ON public.auth_audit_log(user_id);
CREATE INDEX idx_audit_log_event_type ON public.auth_audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON public.auth_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_failed_attempts ON public.auth_audit_log(ip_address, event_type, created_at)
  WHERE event_type = 'login_failure';

-- RLS Policies
ALTER TABLE public.auth_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.auth_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to archive old audit logs (older than 90 days)
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
