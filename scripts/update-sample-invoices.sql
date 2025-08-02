-- Script para actualizar facturas de ejemplo con números oficiales de proveedor

-- 1. Verificar facturas existentes
SELECT 
    id,
    number,
    supplier_id,
    status,
    created_at
FROM purchase_invoices 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Actualizar facturas de ejemplo con números oficiales
UPDATE purchase_invoices 
SET supplier_invoice_number = '2906383'
WHERE id = 5 AND supplier_invoice_number IS NULL;

UPDATE purchase_invoices 
SET supplier_invoice_number = 'FACT-2025-001'
WHERE id = 6 AND supplier_invoice_number IS NULL;

-- 3. Verificar que se actualizaron correctamente
SELECT 
    id,
    number,
    supplier_invoice_number,
    supplier_id,
    status
FROM purchase_invoices 
WHERE id IN (5, 6)
ORDER BY id;

-- 4. Mostrar todas las facturas con números oficiales
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