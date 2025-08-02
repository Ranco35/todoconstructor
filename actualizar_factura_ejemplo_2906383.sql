-- ===================================
-- ACTUALIZAR FACTURA EJEMPLO CON NÚMERO OFICIAL
-- Fecha: $(date)
-- Propósito: Agregar número oficial 2906383 a la factura FC250719-2089
-- ===================================

-- 1. APLICAR MIGRACIÓN (ejecutar solo una vez)
-- DESCOMENTAR Y EJECUTAR:
/*
ALTER TABLE purchase_invoices 
ADD COLUMN supplier_invoice_number VARCHAR(100);

COMMENT ON COLUMN purchase_invoices.number IS 'Número interno generado por el sistema (ej: FC250719-2089)';
COMMENT ON COLUMN purchase_invoices.supplier_invoice_number IS 'Número oficial de la factura del proveedor (ej: 2906383)';

CREATE INDEX idx_purchase_invoices_supplier_number 
ON purchase_invoices(supplier_invoice_number);

ALTER TABLE purchase_invoices 
ADD CONSTRAINT uk_supplier_invoice_number 
UNIQUE (supplier_id, supplier_invoice_number);
*/

-- 2. ACTUALIZAR LA FACTURA ESPECÍFICA
-- Buscar primero la factura con número FC250719-2089
SELECT 
    'ANTES DE ACTUALIZAR' as estado,
    id,
    number as numero_interno,
    supplier_invoice_number as numero_oficial_actual,
    supplier_id,
    total,
    status
FROM purchase_invoices 
WHERE number LIKE '%FC250719%' 
   OR number LIKE '%2089%'
   OR id = 6;  -- Si conoces el ID exacto

-- 3. ACTUALIZAR con el número oficial del proveedor
UPDATE purchase_invoices 
SET 
    supplier_invoice_number = '2906383',
    updated_at = now()
WHERE number LIKE '%FC250719%' 
   OR number LIKE '%2089%'
   OR id = 6;  -- Cambia por el ID correcto si es diferente

-- 4. VERIFICAR LA ACTUALIZACIÓN
SELECT 
    'DESPUÉS DE ACTUALIZAR' as estado,
    id,
    number as numero_interno,
    supplier_invoice_number as numero_oficial_proveedor,
    supplier_id,
    total,
    status,
    updated_at,
    CASE 
        WHEN supplier_invoice_number IS NOT NULL THEN '✅ Número oficial agregado'
        ELSE '❌ Falta número oficial'
    END as validacion
FROM purchase_invoices 
WHERE number LIKE '%FC250719%' 
   OR number LIKE '%2089%'
   OR supplier_invoice_number = '2906383'
   OR id = 6;

-- 5. VERIFICAR NO DUPLICADOS
SELECT 
    'VERIFICACIÓN DUPLICADOS' as info,
    supplier_id,
    supplier_invoice_number,
    COUNT(*) as cantidad,
    STRING_AGG(number, ', ') as numeros_internos
FROM purchase_invoices 
WHERE supplier_invoice_number IS NOT NULL
GROUP BY supplier_id, supplier_invoice_number
HAVING COUNT(*) > 1; 