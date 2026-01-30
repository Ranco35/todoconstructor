-- ================================================
-- AUDITORÍA DE VENTAS POS Y FACTURAS (VENTAS)
-- Admintermas - Historial de cambios para POSSale e invoices
-- ================================================

-- ============================================
-- 1. TABLA POS_SALE_AUDIT_LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.pos_sale_audit_log (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT REFERENCES public."POSSale"(id) ON DELETE SET NULL,

    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    user_id UUID REFERENCES auth.users(id),

    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pos_sale_audit_log_sale_id ON public.pos_sale_audit_log (sale_id);
CREATE INDEX IF NOT EXISTS idx_pos_sale_audit_log_user_id ON public.pos_sale_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_pos_sale_audit_log_created_at ON public.pos_sale_audit_log (created_at DESC);

COMMENT ON TABLE public.pos_sale_audit_log IS 'Historial de cambios de ventas POS';
ALTER TABLE public.pos_sale_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pos_sale_audit_log" ON public.pos_sale_audit_log
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert pos_sale_audit_log" ON public.pos_sale_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 2. TABLA INVOICE_AUDIT_LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.invoice_audit_log (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT REFERENCES public.invoices(id) ON DELETE SET NULL,

    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    user_id UUID REFERENCES auth.users(id),

    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_audit_log_invoice_id ON public.invoice_audit_log (invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_audit_log_user_id ON public.invoice_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_audit_log_created_at ON public.invoice_audit_log (created_at DESC);

COMMENT ON TABLE public.invoice_audit_log IS 'Historial de cambios de facturas de venta';
ALTER TABLE public.invoice_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice_audit_log" ON public.invoice_audit_log
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert invoice_audit_log" ON public.invoice_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- 3. TRIGGER AUDITORÍA POSSale
-- ============================================

CREATE OR REPLACE FUNCTION audit_pos_sale_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.pos_sale_audit_log (sale_id, action_type, user_id, field_name, old_value, new_value)
        VALUES (
            NEW.id, 'CREATE', current_user_id, NULL, NULL,
            'Venta creada: ' || COALESCE(NEW."saleNumber", '') || ' - Total: ' || COALESCE(NEW.total::TEXT, '0')
        );
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.pos_sale_audit_log (sale_id, action_type, user_id, field_name, old_value, new_value)
            VALUES (NEW.id, 'UPDATE', current_user_id, 'status', OLD.status, NEW.status);
        END IF;
        IF OLD.total IS DISTINCT FROM NEW.total OR OLD."discountAmount" IS DISTINCT FROM NEW."discountAmount" THEN
            INSERT INTO public.pos_sale_audit_log (sale_id, action_type, user_id, field_name, old_value, new_value)
            VALUES (NEW.id, 'UPDATE', current_user_id, 'totals',
                json_build_object('total', OLD.total, 'discountAmount', OLD."discountAmount")::TEXT,
                json_build_object('total', NEW.total, 'discountAmount', NEW."discountAmount")::TEXT);
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.pos_sale_audit_log (sale_id, action_type, user_id, field_name, old_value, new_value)
        VALUES (OLD.id, 'DELETE', current_user_id, NULL, 'Venta eliminada: ' || OLD."saleNumber", NULL);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_pos_sale ON public."POSSale";
CREATE TRIGGER trigger_audit_pos_sale
    AFTER INSERT OR UPDATE OR DELETE ON public."POSSale"
    FOR EACH ROW EXECUTE FUNCTION audit_pos_sale_changes();

-- ============================================
-- 4. TRIGGER AUDITORÍA invoices
-- ============================================

CREATE OR REPLACE FUNCTION audit_invoice_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.invoice_audit_log (invoice_id, action_type, user_id, field_name, old_value, new_value)
        VALUES (
            NEW.id, 'CREATE', current_user_id, NULL, NULL,
            'Factura creada: ' || COALESCE(NEW.number, '') || ' - Total: ' || COALESCE(NEW.total::TEXT, '0')
        );
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.invoice_audit_log (invoice_id, action_type, user_id, field_name, old_value, new_value)
            VALUES (NEW.id, 'UPDATE', current_user_id, 'status', OLD.status::TEXT, NEW.status::TEXT);
        END IF;
        IF OLD.total IS DISTINCT FROM NEW.total THEN
            INSERT INTO public.invoice_audit_log (invoice_id, action_type, user_id, field_name, old_value, new_value)
            VALUES (NEW.id, 'UPDATE', current_user_id, 'total', OLD.total::TEXT, NEW.total::TEXT);
        END IF;
        IF OLD.number IS DISTINCT FROM NEW.number THEN
            INSERT INTO public.invoice_audit_log (invoice_id, action_type, user_id, field_name, old_value, new_value)
            VALUES (NEW.id, 'UPDATE', current_user_id, 'number', OLD.number, NEW.number);
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.invoice_audit_log (invoice_id, action_type, user_id, field_name, old_value, new_value)
        VALUES (OLD.id, 'DELETE', current_user_id, NULL, 'Factura eliminada: ' || OLD.number, NULL);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_invoice ON public.invoices;
CREATE TRIGGER trigger_audit_invoice
    AFTER INSERT OR UPDATE OR DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION audit_invoice_changes();
