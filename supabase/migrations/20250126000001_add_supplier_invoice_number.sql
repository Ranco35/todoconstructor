-- ===================================
-- MIGRACIÓN: Agregar campo número oficial del proveedor
-- Fecha: 2025-01-26
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
-- (Un proveedor no puede tener dos facturas con el mismo número oficial)
ALTER TABLE purchase_invoices 
ADD CONSTRAINT uk_supplier_invoice_number 
UNIQUE (supplier_id, supplier_invoice_number);

-- 5. VERIFICAR la nueva estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_invoices' 
  AND table_schema = 'public'
  AND column_name IN ('number', 'supplier_invoice_number')
ORDER BY ordinal_position;

-- 6. Mostrar resultado de la migración
SELECT '✅ Campo supplier_invoice_number agregado exitosamente' as resultado; 