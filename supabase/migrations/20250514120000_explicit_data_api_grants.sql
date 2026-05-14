-- Explicit privileges for PostgREST / supabase-js (Data API).
-- New Supabase projects (from 2026-05-30) and all projects (from 2026-10-30)
-- require GRANTs on public tables; RLS still governs row access.
-- These tables are used only with a logged-in JWT (authenticated) or the
-- secret key (service_role); anon is intentionally omitted.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_config TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_person_scope TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_person_scope TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notion_sync_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notion_sync_cache TO service_role;
