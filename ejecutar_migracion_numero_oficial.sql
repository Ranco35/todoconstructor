-- ===================================
-- MIGRACIÓN: Agregar campo número oficial del proveedor
-- Fecha: $(date)
-- Propósito: Guardar número oficial de factura (ej: 2906383) 
--           separado del número interno del sistema (FC250719-2089)
-- ===================================

-- 1. AGREGAR CAMPO para número oficial del proveedor
ALTER TABLE purchase_invoices 
ADD COLUMN supplier_invoice_number VARCHAR(100);

-- 2. AGREGAR COMENTARIOS para claridad
COMMENT ON COLUMN purchase_invoices.number IS 'Número interno generado por el sistema (ej: FC250719-2089)';
COMMENT ON COLUMN purchase_invoices.supplier_invoice_number IS 'Número oficial de la factura del proveedor (ej: 2906383)';

-- 3. CREAR ÍNDICE para búsquedas rápidas
CREATE INDEX idx_purchase_invoices_supplier_number 
ON purchase_invoices(supplier_invoice_number);

-- 4. AGREGAR RESTRICCIÓN de unicidad por proveedor
ALTER TABLE purchase_invoices 
ADD CONSTRAINT uk_supplier_invoice_number 
UNIQUE (supplier_id, supplier_invoice_number);

-- 5. VERIFICAR que se agregó correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'purchase_invoices'
  AND column_name = 'supplier_invoice_number';

-- 6. MOSTRAR estructura actualizada
SELECT 
    '✅ Campo supplier_invoice_number agregado exitosamente' as resultado; 