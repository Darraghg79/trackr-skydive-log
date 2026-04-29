-- ============================================================
-- F-RLS-HARDENING
-- Enable RLS on all public tables. Defence-in-depth — Prisma
-- postgres role bypasses RLS, so the app behaviour is unchanged.
-- ============================================================

-- ----------------------------------------------------------------
-- GROUP A: USER-SCOPED TABLES (have a "userId" column)
-- ----------------------------------------------------------------

-- users (owns by id, not userId)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = id)
  WITH CHECK ((SELECT auth.uid())::text = id);

CREATE POLICY users_insert_self ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = id);

-- jumps
ALTER TABLE public.jumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY jumps_all_own ON public.jumps
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::text = "userId")
  WITH CHECK ((SELECT auth.uid())::text = "userId");

-- rigs
ALTER TABLE public.rigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY rigs_all_own ON public.rigs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::text = "userId")
  WITH CHECK ((SELECT auth.uid())::text = "userId");

-- gear_components
ALTER TABLE public.gear_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY gear_components_all_own ON public.gear_components
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::text = "userId")
  WITH CHECK ((SELECT auth.uid())::text = "userId");

-- dropzones (user's saved dropzones, not the global directory)
ALTER TABLE public.dropzones ENABLE ROW LEVEL SECURITY;
CREATE POLICY dropzones_all_own ON public.dropzones
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::text = "userId")
  WITH CHECK ((SELECT auth.uid())::text = "userId");

-- user_jump_types
ALTER TABLE public.user_jump_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_jump_types_all_own ON public.user_jump_types
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::text = "userId")
  WITH CHECK ((SELECT auth.uid())::text = "userId");

-- user_aircrafts
ALTER TABLE public.user_aircrafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_aircrafts_all_own ON public.user_aircrafts
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::text = "userId")
  WITH CHECK ((SELECT auth.uid())::text = "userId");

-- invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_all_own ON public.invoices
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::text = "userId")
  WITH CHECK ((SELECT auth.uid())::text = "userId");

-- jump_number_audit_logs
ALTER TABLE public.jump_number_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jump_number_audit_logs_all_own ON public.jump_number_audit_logs
  FOR ALL TO authenticated
  USING ((SELECT auth.uid())::text = "userId")
  WITH CHECK ((SELECT auth.uid())::text = "userId");

-- ----------------------------------------------------------------
-- GROUP B: CHILD TABLES (no userId; ownership via parent)
-- ----------------------------------------------------------------

-- rig_components → rig.userId
ALTER TABLE public.rig_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY rig_components_all_own ON public.rig_components
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.rigs r
    WHERE r.id = rig_components."rigId"
      AND r."userId" = (SELECT auth.uid())::text
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.rigs r
    WHERE r.id = rig_components."rigId"
      AND r."userId" = (SELECT auth.uid())::text
  ));

-- jump_gear_components → jump.userId
ALTER TABLE public.jump_gear_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY jump_gear_components_all_own ON public.jump_gear_components
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.jumps j
    WHERE j.id = jump_gear_components."jumpId"
      AND j."userId" = (SELECT auth.uid())::text
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.jumps j
    WHERE j.id = jump_gear_components."jumpId"
      AND j."userId" = (SELECT auth.uid())::text
  ));

-- jump_signatures → jump.userId
ALTER TABLE public.jump_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY jump_signatures_all_own ON public.jump_signatures
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.jumps j
    WHERE j.id = jump_signatures."jumpId"
      AND j."userId" = (SELECT auth.uid())::text
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.jumps j
    WHERE j.id = jump_signatures."jumpId"
      AND j."userId" = (SELECT auth.uid())::text
  ));

-- invoice_line_items → invoice.userId
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_line_items_all_own ON public.invoice_line_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_line_items."invoiceId"
      AND i."userId" = (SELECT auth.uid())::text
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_line_items."invoiceId"
      AND i."userId" = (SELECT auth.uid())::text
  ));

-- ----------------------------------------------------------------
-- GROUP C: GLOBAL REFERENCE DATA (read-only for authenticated)
-- ----------------------------------------------------------------

ALTER TABLE public.global_dropzones ENABLE ROW LEVEL SECURITY;
CREATE POLICY global_dropzones_select_authenticated ON public.global_dropzones
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.global_aircrafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY global_aircrafts_select_authenticated ON public.global_aircrafts
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.global_jump_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY global_jump_types_select_authenticated ON public.global_jump_types
  FOR SELECT TO authenticated USING (true);

-- ----------------------------------------------------------------
-- GROUP D: SYSTEM TABLE — RLS enabled, no policies (deny all non-postgres)
-- ----------------------------------------------------------------

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
-- Intentionally NO policies. postgres role bypasses; anon/authenticated denied.
