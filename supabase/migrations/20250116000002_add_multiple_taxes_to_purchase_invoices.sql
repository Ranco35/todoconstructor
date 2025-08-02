-- Migración: Soporte para múltiples impuestos en facturas de compra
-- Fecha: 16 de Enero 2025
-- Propósito: Permitir múltiples impuestos por línea de factura como se ve en las imágenes del usuario

-- ====================
-- TABLA: purchase_invoice_line_taxes
-- ====================
CREATE TABLE IF NOT EXISTS public.purchase_invoice_line_taxes (
    id BIGSERIAL PRIMARY KEY,
    purchase_invoice_line_id BIGINT NOT NULL REFERENCES purchase_invoice_lines(id) ON DELETE CASCADE,
    
    -- Información del impuesto
    tax_type VARCHAR(100) NOT NULL, -- Referencia a TAX_TYPES (ej: 'IVA_19', 'IVA_ANTICIPADO_HARINA_12')
    tax_name VARCHAR(200) NOT NULL, -- Nombre para mostrar (ej: 'IVA 19% Compra', 'IVA ANTICIPADO HARINA')
    tax_rate NUMERIC(5,2) NOT NULL, -- Porcentaje del impuesto
    tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0, -- Monto del impuesto calculado
    
    -- Configuración adicional
    is_retention BOOLEAN DEFAULT false, -- Si es una retención
    tax_base NUMERIC(18,2), -- Base gravable para este impuesto
    
    -- Orden de aplicación
    tax_order INTEGER DEFAULT 1,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Restricciones
    CONSTRAINT valid_tax_rate_range CHECK (tax_rate >= 0 AND tax_rate <= 100),
    CONSTRAINT valid_tax_amount CHECK (tax_amount >= 0)
);

-- Índices para optimizar consultas
CREATE INDEX idx_purchase_invoice_line_taxes_line_id ON purchase_invoice_line_taxes(purchase_invoice_line_id);
CREATE INDEX idx_purchase_invoice_line_taxes_type ON purchase_invoice_line_taxes(tax_type);

-- ====================
-- MODIFICACIONES A TABLA EXISTENTE
-- ====================

-- Agregar campo para almacenar configuración de impuestos como JSON (backup)
ALTER TABLE purchase_invoice_lines 
ADD COLUMN IF NOT EXISTS taxes_config JSONB DEFAULT '[]'::jsonb;

-- Agregar comentario para indicar que tax_rate es legacy
COMMENT ON COLUMN purchase_invoice_lines.tax_rate IS 'LEGACY: Use purchase_invoice_line_taxes table for new implementations';

-- ====================
-- FUNCIÓN PARA CALCULAR TOTALES
-- ====================
CREATE OR REPLACE FUNCTION calculate_line_totals_with_taxes(line_id BIGINT)
RETURNS TABLE(
    line_total_amount NUMERIC(18,2),
    total_taxes_amount NUMERIC(18,2),
    net_amount NUMERIC(18,2)
) AS $$
DECLARE
    line_subtotal NUMERIC(18,2);
    total_taxes NUMERIC(18,2);
BEGIN
    -- Obtener subtotal de la línea (cantidad * precio unitario - descuentos)
    SELECT 
        (quantity * unit_price) - COALESCE(discount_amount, 0)
    INTO line_subtotal
    FROM purchase_invoice_lines 
    WHERE id = line_id;
    
    -- Calcular total de impuestos
    SELECT COALESCE(SUM(tax_amount), 0)
    INTO total_taxes
    FROM purchase_invoice_line_taxes
    WHERE purchase_invoice_line_id = line_id;
    
    -- Retornar resultados
    RETURN QUERY SELECT 
        line_subtotal + total_taxes as line_total_amount,
        total_taxes as total_taxes_amount,
        line_subtotal as net_amount;
END;
$$ LANGUAGE plpgsql;

-- ====================
-- FUNCIÓN PARA APLICAR IMPUESTOS AUTOMÁTICAMENTE
-- ====================
CREATE OR REPLACE FUNCTION apply_supplier_taxes_to_line(
    p_line_id BIGINT,
    p_supplier_id BIGINT,
    p_product_category VARCHAR(100) DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    tax_record RECORD;
    line_subtotal NUMERIC(18,2);
    tax_amount_calc NUMERIC(18,2);
BEGIN
    -- Obtener subtotal de la línea
    SELECT (quantity * unit_price) - COALESCE(discount_amount, 0)
    INTO line_subtotal
    FROM purchase_invoice_lines 
    WHERE id = p_line_id;
    
    -- Limpiar impuestos existentes
    DELETE FROM purchase_invoice_line_taxes WHERE purchase_invoice_line_id = p_line_id;
    
    -- Aplicar impuestos configurados para el proveedor
    FOR tax_record IN 
        SELECT st."taxType", st."taxRate", st.description, st."isRetention", st."appliesToCategory"
        FROM "SupplierTax" st
        WHERE st."supplierId" = p_supplier_id 
          AND st.active = true
          AND (st."appliesToCategory" IS NULL OR st."appliesToCategory" = p_product_category)
        ORDER BY st."taxRate" ASC
    LOOP
        -- Calcular monto del impuesto
        tax_amount_calc := (line_subtotal * tax_record."taxRate") / 100;
        
        -- Insertar el impuesto
        INSERT INTO purchase_invoice_line_taxes (
            purchase_invoice_line_id,
            tax_type,
            tax_name,
            tax_rate,
            tax_amount,
            is_retention,
            tax_base
        ) VALUES (
            p_line_id,
            tax_record."taxType",
            tax_record.description,
            tax_record."taxRate",
            tax_amount_calc,
            COALESCE(tax_record."isRetention", false),
            line_subtotal
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ====================
-- TRIGGER PARA RECALCULAR TOTALES
-- ====================
CREATE OR REPLACE FUNCTION trigger_recalculate_line_totals()
RETURNS TRIGGER AS $$
DECLARE
    calculated_total NUMERIC(18,2);
    total_taxes NUMERIC(18,2);
BEGIN
    -- Calcular total de impuestos para la línea
    SELECT COALESCE(SUM(tax_amount), 0)
    INTO total_taxes
    FROM purchase_invoice_line_taxes
    WHERE purchase_invoice_line_id = NEW.purchase_invoice_line_id;
    
    -- Actualizar el total de la línea
    UPDATE purchase_invoice_lines
    SET 
        tax_amount = total_taxes,
        line_total = (quantity * unit_price) - COALESCE(discount_amount, 0) + total_taxes
    WHERE id = NEW.purchase_invoice_line_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_totals_after_tax_change
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_line_taxes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_line_totals();

-- ====================
-- PERMISOS Y SEGURIDAD
-- ====================
ALTER TABLE purchase_invoice_line_taxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users"
ON purchase_invoice_line_taxes
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON purchase_invoice_line_taxes
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update for authenticated users"
ON purchase_invoice_line_taxes
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete for authenticated users"
ON purchase_invoice_line_taxes
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Permisos
GRANT ALL ON purchase_invoice_line_taxes TO authenticated;
GRANT ALL ON purchase_invoice_line_taxes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE purchase_invoice_line_taxes_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE purchase_invoice_line_taxes_id_seq TO service_role;

-- Comentarios
COMMENT ON TABLE purchase_invoice_line_taxes IS 'Impuestos específicos aplicados a cada línea de factura de compra';
COMMENT ON COLUMN purchase_invoice_line_taxes.tax_type IS 'Tipo de impuesto según TAX_TYPES constants';
COMMENT ON COLUMN purchase_invoice_line_taxes.is_retention IS 'Indica si es una retención (resta del total)';
COMMENT ON COLUMN purchase_invoice_line_taxes.tax_base IS 'Base gravable sobre la cual se calcula el impuesto'; 