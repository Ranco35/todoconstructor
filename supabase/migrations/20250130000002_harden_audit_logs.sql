-- ================================================
-- ENDURECIMIENTO AUDIT LOGS (POS_SALE + INVOICE)
-- Solo triggers pueden insertar; cliente no.
-- Idempotente: IF EXISTS / IF NOT EXISTS.
-- ================================================

-- 1) RLS habilitado en ambas tablas
ALTER TABLE public.pos_sale_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_audit_log ENABLE ROW LEVEL SECURITY;

-- 2) Policies: mantener SELECT; bloquear INSERT desde cliente
DROP POLICY IF EXISTS "Users can view pos_sale_audit_log" ON public.pos_sale_audit_log;
DROP POLICY IF EXISTS "System can insert pos_sale_audit_log" ON public.pos_sale_audit_log;
DROP POLICY IF EXISTS "No direct inserts pos_sale_audit_log" ON public.pos_sale_audit_log;

CREATE POLICY "Users can view pos_sale_audit_log" ON public.pos_sale_audit_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "No direct inserts pos_sale_audit_log" ON public.pos_sale_audit_log
    FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Users can view invoice_audit_log" ON public.invoice_audit_log;
DROP POLICY IF EXISTS "System can insert invoice_audit_log" ON public.invoice_audit_log;
DROP POLICY IF EXISTS "No direct inserts invoice_audit_log" ON public.invoice_audit_log;

CREATE POLICY "Users can view invoice_audit_log" ON public.invoice_audit_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "No direct inserts invoice_audit_log" ON public.invoice_audit_log
    FOR INSERT WITH CHECK (false);

-- 3) Privilegios: solo SELECT para authenticated/anon; triggers (SECURITY DEFINER) siguen insertando como owner
REVOKE INSERT, UPDATE, DELETE ON public.pos_sale_audit_log FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.invoice_audit_log FROM anon, authenticated;

GRANT SELECT ON public.pos_sale_audit_log TO authenticated;
GRANT SELECT ON public.invoice_audit_log TO authenticated;

-- 4) Índices compuestos para consultas por entidad + orden por fecha (si no existen)
CREATE INDEX IF NOT EXISTS idx_pos_sale_audit_log_sale_id_created_at
    ON public.pos_sale_audit_log (sale_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoice_audit_log_invoice_id_created_at
    ON public.invoice_audit_log (invoice_id, created_at DESC);

-- 5) Validación post-migración (solo comentarios; ejecutar manualmente si se desea verificar)
-- Listar policies de las tablas de auditoría:
--   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--   FROM pg_policies WHERE tablename IN ('pos_sale_audit_log', 'invoice_audit_log');
--
-- Listar grants:
--   SELECT grantee, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND table_name IN ('pos_sale_audit_log', 'invoice_audit_log');
--
-- Plan de consulta típica (por sale_id ordenado por created_at DESC):
--   EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM public.pos_sale_audit_log WHERE sale_id = 1 ORDER BY created_at DESC;
--   (Debe usar idx_pos_sale_audit_log_sale_id_created_at si existe el índice.)
