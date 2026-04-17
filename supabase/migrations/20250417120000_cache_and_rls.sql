-- Task 3.0: Portal cache tables + RLS (PRD §7.4)
-- Apply via Supabase CLI (`supabase db push`) or Dashboard → SQL Editor.

-- ---------------------------------------------------------------------------
-- portal_config: singleton row (optional DB mirror of env; app may use env only)
-- ---------------------------------------------------------------------------
CREATE TABLE public.portal_config (
  id integer PRIMARY KEY CHECK (id = 1),
  tasks_database_id text,
  klant_v2_property_name text NOT NULL DEFAULT 'KlantV2',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.portal_config IS 'Single-row deployment config. May duplicate NOTION_* env vars until app reads from DB.';

INSERT INTO public.portal_config (id) VALUES (1);

-- ---------------------------------------------------------------------------
-- user_person_scope: Supabase Auth user ↔ Notion person ids (KlantV2 members)
-- Populated in task 4 after email → person resolution.
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_person_scope (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  notion_person_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notion_person_id)
);

CREATE INDEX user_person_scope_user_id_idx ON public.user_person_scope (user_id);

COMMENT ON TABLE public.user_person_scope IS 'Maps auth user to one or more Notion user/person UUID strings from KlantV2.';

-- ---------------------------------------------------------------------------
-- notion_sync_cache: mirrored Notion task pages for fast reads (FR-13–FR-15)
-- ---------------------------------------------------------------------------
CREATE TABLE public.notion_sync_cache (
  notion_page_id text PRIMARY KEY,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  klant_v2_person_ids text[] NOT NULL,
  last_synced_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notion_sync_cache_last_synced_idx ON public.notion_sync_cache (last_synced_at DESC);

COMMENT ON COLUMN public.notion_sync_cache.klant_v2_person_ids IS 'All Notion person ids on KlantV2 for this page; used for RLS overlap with user_person_scope.';

COMMENT ON COLUMN public.notion_sync_cache.properties IS 'Normalized task fields from Notion; shape finalized in task 4.5.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.portal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_person_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notion_sync_cache ENABLE ROW LEVEL SECURITY;

-- portal_config: readable by any signed-in user; writes only via service_role / dashboard (no policy for authenticated write)
CREATE POLICY "portal_config_select_authenticated"
  ON public.portal_config
  FOR SELECT
  TO authenticated
  USING (true);

-- user_person_scope: each user only sees and manages their own rows
CREATE POLICY "user_person_scope_select_own"
  ON public.user_person_scope
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "user_person_scope_insert_own"
  ON public.user_person_scope
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_person_scope_update_own"
  ON public.user_person_scope
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_person_scope_delete_own"
  ON public.user_person_scope
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- notion_sync_cache: task visible iff user shares a Notion person id with KlantV2 on that row
CREATE POLICY "notion_sync_cache_select_scoped"
  ON public.notion_sync_cache
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_person_scope ups
      WHERE ups.user_id = (SELECT auth.uid())
        AND notion_sync_cache.klant_v2_person_ids @> ARRAY[ups.notion_person_id]::text[]
    )
  );

CREATE POLICY "notion_sync_cache_insert_scoped"
  ON public.notion_sync_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_person_scope ups
      WHERE ups.user_id = (SELECT auth.uid())
        AND klant_v2_person_ids @> ARRAY[ups.notion_person_id]::text[]
    )
  );

CREATE POLICY "notion_sync_cache_update_scoped"
  ON public.notion_sync_cache
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_person_scope ups
      WHERE ups.user_id = (SELECT auth.uid())
        AND notion_sync_cache.klant_v2_person_ids @> ARRAY[ups.notion_person_id]::text[]
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_person_scope ups
      WHERE ups.user_id = (SELECT auth.uid())
        AND klant_v2_person_ids @> ARRAY[ups.notion_person_id]::text[]
    )
  );

CREATE POLICY "notion_sync_cache_delete_scoped"
  ON public.notion_sync_cache
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_person_scope ups
      WHERE ups.user_id = (SELECT auth.uid())
        AND notion_sync_cache.klant_v2_person_ids @> ARRAY[ups.notion_person_id]::text[]
    )
  );
