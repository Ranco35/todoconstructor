-- =====================================================
-- MÓDULO COMPLETO DE FACTURAS DE COMPRAS CON IA
-- Para ejecutar directamente en Supabase SQL Editor
-- =====================================================

-- ====================
-- TABLA: purchase_invoices
-- ====================
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    currency VARCHAR(8) NOT NULL DEFAULT 'CLP',
    
    -- Montos
    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    
    -- Estados
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, approved, paid, disputed, cancelled
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, partial, paid
    
    -- Archivos y procesamiento
    pdf_file_path TEXT, -- Ruta del archivo PDF original
    pdf_file_name VARCHAR(255), -- Nombre original del archivo
    pdf_file_size INTEGER, -- Tamaño en bytes
    
    -- Datos extraídos por IA
    extracted_data JSONB, -- Información completa extraída del PDF
    extraction_confidence NUMERIC(3,2), -- Confianza de 0.00 a 1.00
    manual_review_required BOOLEAN DEFAULT false,
    
    -- Notas y observaciones
    notes TEXT,
    internal_notes TEXT, -- Notas internas no visibles al proveedor
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Índices únicos
    UNIQUE(supplier_id, invoice_number)
);

-- ====================
-- TABLA: purchase_invoice_lines
-- ====================
CREATE TABLE IF NOT EXISTS public.purchase_invoice_lines (
    id BIGSERIAL PRIMARY KEY,
    purchase_invoice_id BIGINT REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    
    -- Información del producto/servicio
    product_id BIGINT REFERENCES products(id), -- Opcional: vinculación con producto existente
    description TEXT NOT NULL,
    product_code VARCHAR(100), -- Código del proveedor
    
    -- Cantidades y precios
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(18,2) DEFAULT 0,
    
    -- Impuestos
    tax_rate NUMERIC(5,2) DEFAULT 19.00, -- IVA por defecto 19%
    tax_amount NUMERIC(18,2) DEFAULT 0,
    line_total NUMERIC(18,2) NOT NULL DEFAULT 0,
    
    -- Centro de costo
    cost_center_id BIGINT REFERENCES cost_centers(id),
    
    -- Orden de líneas
    line_order INTEGER DEFAULT 1,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ====================
-- TABLA: purchase_invoice_payments
-- ====================
CREATE TABLE IF NOT EXISTS public.purchase_invoice_payments (
    id BIGSERIAL PRIMARY KEY,
    purchase_invoice_id BIGINT REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    
    -- Información del pago
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(18,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- cash, transfer, check, credit
    reference VARCHAR(100), -- Número de transferencia, cheque, etc.
    
    -- Relación con caja chica si aplica
    cash_session_id BIGINT REFERENCES cash_sessions(id),
    
    -- Notas del pago
    notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- ====================
-- TABLA: pdf_extraction_logs
-- ====================
CREATE TABLE IF NOT EXISTS public.pdf_extraction_logs (
    id BIGSERIAL PRIMARY KEY,
    purchase_invoice_id BIGINT REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    
    -- Información del procesamiento
    extraction_method VARCHAR(50) NOT NULL, -- 'chatgpt', 'ocr', 'manual'
    raw_text TEXT, -- Texto extraído del PDF
    chatgpt_prompt TEXT, -- Prompt usado para ChatGPT
    chatgpt_response JSONB, -- Respuesta completa de ChatGPT
    
    -- Métricas
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    confidence_score NUMERIC(3,2),
    
    -- Errores
    error_message TEXT,
    success BOOLEAN DEFAULT true,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- ====================
-- ÍNDICES
-- ====================
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_date ON purchase_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_due_date ON purchase_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_lines_invoice_id ON purchase_invoice_lines(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_lines_product_id ON purchase_invoice_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_payments_invoice_id ON purchase_invoice_payments(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_pdf_extraction_logs_invoice_id ON pdf_extraction_logs(purchase_invoice_id);

-- ====================
-- TRIGGERS PARA UPDATED_AT
-- ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_purchase_invoices_updated_at ON purchase_invoices;
CREATE TRIGGER update_purchase_invoices_updated_at 
    BEFORE UPDATE ON purchase_invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================
-- RLS POLICIES
-- ====================
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_extraction_logs ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view purchase invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Users can create purchase invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Users can update purchase invoices" ON purchase_invoices;
DROP POLICY IF EXISTS "Users can view purchase invoice lines" ON purchase_invoice_lines;
DROP POLICY IF EXISTS "Users can view purchase invoice payments" ON purchase_invoice_payments;
DROP POLICY IF EXISTS "Users can view pdf extraction logs" ON pdf_extraction_logs;

-- Crear políticas
CREATE POLICY "Users can view purchase invoices" ON purchase_invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create purchase invoices" ON purchase_invoices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update purchase invoices" ON purchase_invoices
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view purchase invoice lines" ON purchase_invoice_lines
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view purchase invoice payments" ON purchase_invoice_payments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view pdf extraction logs" ON pdf_extraction_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- ====================
-- FUNCIONES AUXILIARES
-- ====================

-- Función para calcular totales automáticamente
CREATE OR REPLACE FUNCTION calculate_purchase_invoice_totals(invoice_id BIGINT)
RETURNS JSON AS $$
DECLARE
    result JSON;
    subtotal_calc NUMERIC(18,2) := 0;
    tax_calc NUMERIC(18,2) := 0;
    total_calc NUMERIC(18,2) := 0;
BEGIN
    -- Calcular totales desde las líneas
    SELECT 
        COALESCE(SUM(line_total - tax_amount), 0),
        COALESCE(SUM(tax_amount), 0),
        COALESCE(SUM(line_total), 0)
    INTO subtotal_calc, tax_calc, total_calc
    FROM purchase_invoice_lines
    WHERE purchase_invoice_id = invoice_id;
    
    -- Actualizar la factura
    UPDATE purchase_invoices 
    SET 
        subtotal = subtotal_calc,
        tax_amount = tax_calc,
        total_amount = total_calc,
        updated_at = now()
    WHERE id = invoice_id;
    
    -- Retornar resultado
    SELECT json_build_object(
        'subtotal', subtotal_calc,
        'tax_amount', tax_calc,
        'total_amount', total_calc
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular totales cuando se modifican líneas
CREATE OR REPLACE FUNCTION recalculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular tanto para INSERT, UPDATE como DELETE
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_purchase_invoice_totals(OLD.purchase_invoice_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_purchase_invoice_totals(NEW.purchase_invoice_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalculate_purchase_invoice_totals ON purchase_invoice_lines;
CREATE TRIGGER recalculate_purchase_invoice_totals
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_lines
    FOR EACH ROW EXECUTE FUNCTION recalculate_invoice_totals();

-- ====================
-- DATOS DE EJEMPLO
-- ====================

-- Insertar factura de ejemplo (solo si no existe)
INSERT INTO purchase_invoices (
    invoice_number, 
    supplier_id, 
    invoice_date, 
    subtotal, 
    tax_amount, 
    total_amount,
    status,
    notes
) 
SELECT 
    'FACT-EJEMPLO-001',
    s.id,
    CURRENT_DATE,
    100000.00,
    19000.00,
    119000.00,
    'draft',
    'Factura de ejemplo para pruebas del sistema de IA'
FROM suppliers s 
WHERE s.active = true 
LIMIT 1
ON CONFLICT (supplier_id, invoice_number) DO NOTHING;

-- ====================
-- COMENTARIOS TÉCNICOS
-- ====================
COMMENT ON TABLE purchase_invoices IS 'Facturas de compras a proveedores con análisis automático por IA';
COMMENT ON COLUMN purchase_invoices.extracted_data IS 'Datos JSON extraídos automáticamente del PDF por ChatGPT';
COMMENT ON COLUMN purchase_invoices.extraction_confidence IS 'Nivel de confianza de la extracción automática (0.00-1.00)';
COMMENT ON TABLE pdf_extraction_logs IS 'Log completo del procesamiento de PDFs por IA';

-- ====================
-- VERIFICACIÓN FINAL
-- ====================
DO $$
BEGIN
    -- Verificar que las tablas se crearon correctamente
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_invoices'
    ) THEN
        RAISE NOTICE '✅ Tabla purchase_invoices creada exitosamente';
    ELSE
        RAISE EXCEPTION '❌ Error: No se pudo crear purchase_invoices';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_invoice_lines'
    ) THEN
        RAISE NOTICE '✅ Tabla purchase_invoice_lines creada exitosamente';
    ELSE
        RAISE EXCEPTION '❌ Error: No se pudo crear purchase_invoice_lines';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pdf_extraction_logs'
    ) THEN
        RAISE NOTICE '✅ Tabla pdf_extraction_logs creada exitosamente';
    ELSE
        RAISE EXCEPTION '❌ Error: No se pudo crear pdf_extraction_logs';
    END IF;
    
    RAISE NOTICE '🎉 MÓDULO DE FACTURAS DE COMPRAS CON IA INSTALADO EXITOSAMENTE';
    RAISE NOTICE '📄 Funcionalidades disponibles:';
    RAISE NOTICE '   • Procesamiento automático de PDFs con ChatGPT';
    RAISE NOTICE '   • Extracción inteligente de datos de facturas chilenas';
    RAISE NOTICE '   • Gestión completa de facturas de compras';
    RAISE NOTICE '   • Sistema de borradores con revisión manual';
    RAISE NOTICE '   • Integración con sistema de proveedores';
    RAISE NOTICE '   • Logging completo de procesamiento IA';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Próximo paso: Ir a /dashboard/purchases para probar el sistema';
END
$$; 