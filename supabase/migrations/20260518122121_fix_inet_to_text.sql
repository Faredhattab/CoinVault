-- Fix: INET columns cause PostgREST text comparison mismatch
-- PostgREST sends '127.0.0.1' but INET stores '127.0.0.1/32',
-- so .eq() never matches. Change to TEXT for reliable equality checks.

ALTER TABLE public.sessions
  ALTER COLUMN ip_address TYPE TEXT USING host(ip_address);

ALTER TABLE public.auth_audit_log
  ALTER COLUMN ip_address TYPE TEXT USING host(ip_address);
