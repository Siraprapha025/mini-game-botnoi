CREATE TABLE public.wolf_mock_sessions (
 id uuid PRIMARY KEY,
 owner_hash text NOT NULL,
 session jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 0,
 revoked boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 day')
);
GRANT ALL ON public.wolf_mock_sessions TO service_role;
REVOKE ALL ON public.wolf_mock_sessions FROM anon, authenticated;
ALTER TABLE public.wolf_mock_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX wolf_mock_sessions_owner ON public.wolf_mock_sessions(owner_hash);
COMMENT ON TABLE public.wolf_mock_sessions IS 'Temporary Mock sessions, capability-cookie scoped by server handlers; no direct browser access.';