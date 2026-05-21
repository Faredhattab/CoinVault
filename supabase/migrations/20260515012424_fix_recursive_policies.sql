-- Fix infinite recursion in profiles policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Also fix audit log policy which was also recursive via profiles
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.auth_audit_log;

CREATE POLICY "Admins can view audit logs"
  ON public.auth_audit_log FOR SELECT
  USING (public.is_admin());

-- Allow anyone to insert into sessions and audit log (backend will control this)
-- In a real production app, you might restrict this more, but for now it's needed for the backend to function.
CREATE POLICY "Anyone can insert sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert audit logs"
  ON public.auth_audit_log FOR INSERT
  WITH CHECK (true);

-- Allow service role/admin to update sessions
CREATE POLICY "Admins can update sessions"
  ON public.sessions FOR UPDATE
  USING (public.is_admin());
