-- Script rápido para actualizar facturas con números oficiales de proveedor

-- 1. Verificar estado actual
SELECT 
    id,
    number,
    supplier_invoice_number,
    status
FROM purchase_invoices 
ORDER BY id;

-- 2. Actualizar facturas específicas
UPDATE purchase_invoices 
SET supplier_invoice_number = '2906383'
WHERE id = 5;

UPDATE purchase_invoices 
SET supplier_invoice_number = 'FACT-2025-001'
WHERE id = 6;

-- 3. Verificar resultado
SELECT 
    id,
    number as numero_interno,
    supplier_invoice_number as numero_oficial_proveedor,
    status
FROM purchase_invoices 
WHERE id IN (5, 6)
ORDER BY id; 