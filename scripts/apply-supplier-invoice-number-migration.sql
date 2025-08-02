-- Script para aplicar la migración del campo supplier_invoice_number
-- Ejecutar este script en Supabase SQL Editor

-- 1. Verificar si el campo ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_invoices' 
        AND column_name = 'supplier_invoice_number'
    ) THEN
        -- 2. AGREGAR CAMPO para número oficial del proveedor
        ALTER TABLE purchase_invoices 
        ADD COLUMN supplier_invoice_number VARCHAR(100);
        
        -- 3. AGREGAR COMENTARIOS para claridad
        COMMENT ON COLUMN purchase_invoices.number IS 'Número interno generado por el sistema (ej: FC250719-2089)';
        COMMENT ON COLUMN purchase_invoices.supplier_invoice_number IS 'Número oficial de la factura del proveedor (ej: 2906383)';
        
        -- 4. CREAR ÍNDICE para búsquedas rápidas
        CREATE INDEX idx_purchase_invoices_supplier_number 
        ON purchase_invoices(supplier_invoice_number);
        
        -- 5. AGREGAR RESTRICCIÓN de unicidad por proveedor
        -- (Un proveedor no puede tener dos facturas con el mismo número oficial)
        ALTER TABLE purchase_invoices 
        ADD CONSTRAINT uk_supplier_invoice_number 
        UNIQUE (supplier_id, supplier_invoice_number);
        
        RAISE NOTICE '✅ Campo supplier_invoice_number agregado exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ Campo supplier_invoice_number ya existe';
    END IF;
END $$;

-- 6. Actualizar facturas de ejemplo con números oficiales
UPDATE purchase_invoices 
SET supplier_invoice_number = '2906383'
WHERE id = 5 AND supplier_invoice_number IS NULL;

UPDATE purchase_invoices 
SET supplier_invoice_number = 'FACT-2025-001'
WHERE id = 6 AND supplier_invoice_number IS NULL;

-- 7. Verificar la nueva estructura
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

-- 8. Mostrar facturas actualizadas
SELECT 
    id,
    number as numero_interno,
    supplier_invoice_number as numero_oficial_proveedor,
    supplier_id,
    status,
    CASE 
        WHEN supplier_invoice_number IS NULL THEN '❌ Falta número oficial'
        WHEN supplier_invoice_number = number THEN '⚠️ Números iguales'
        ELSE '✅ Número oficial diferente'
    END as estado_numero
FROM purchase_invoices 
ORDER BY created_at DESC; 