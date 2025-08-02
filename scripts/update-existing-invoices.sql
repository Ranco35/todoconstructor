-- Script para actualizar facturas existentes con números oficiales de proveedor
-- El campo supplier_invoice_number ya existe, solo necesitamos agregar datos

-- 1. Verificar facturas existentes sin número oficial
SELECT 
    id,
    number,
    supplier_invoice_number,
    supplier_id,
    status,
    created_at
FROM purchase_invoices 
WHERE supplier_invoice_number IS NULL OR supplier_invoice_number = ''
ORDER BY created_at DESC;

-- 2. Actualizar facturas de ejemplo con números oficiales
UPDATE purchase_invoices 
SET supplier_invoice_number = '2906383'
WHERE id = 5 AND (supplier_invoice_number IS NULL OR supplier_invoice_number = '');

UPDATE purchase_invoices 
SET supplier_invoice_number = 'FACT-2025-001'
WHERE id = 6 AND (supplier_invoice_number IS NULL OR supplier_invoice_number = '');

-- 3. Actualizar otras facturas con números de ejemplo
UPDATE purchase_invoices 
SET supplier_invoice_number = 'FACT-2025-002'
WHERE id = 1 AND (supplier_invoice_number IS NULL OR supplier_invoice_number = '');

UPDATE purchase_invoices 
SET supplier_invoice_number = 'FACT-2025-003'
WHERE id = 2 AND (supplier_invoice_number IS NULL OR supplier_invoice_number = '');

UPDATE purchase_invoices 
SET supplier_invoice_number = 'FACT-2025-004'
WHERE id = 3 AND (supplier_invoice_number IS NULL OR supplier_invoice_number = '');

UPDATE purchase_invoices 
SET supplier_invoice_number = 'FACT-2025-005'
WHERE id = 4 AND (supplier_invoice_number IS NULL OR supplier_invoice_number = '');

-- 4. Verificar que se actualizaron correctamente
SELECT 
    id,
    number as numero_interno,
    supplier_invoice_number as numero_oficial_proveedor,
    supplier_id,
    status,
    CASE 
        WHEN supplier_invoice_number IS NULL THEN '❌ Falta número oficial'
        WHEN supplier_invoice_number = '' THEN '❌ Número oficial vacío'
        WHEN supplier_invoice_number = number THEN '⚠️ Números iguales'
        ELSE '✅ Número oficial diferente'
    END as estado_numero
FROM purchase_invoices 
ORDER BY id;

-- 5. Mostrar resumen de actualización
SELECT 
    COUNT(*) as total_facturas,
    COUNT(supplier_invoice_number) as facturas_con_numero_proveedor,
    COUNT(CASE WHEN supplier_invoice_number IS NOT NULL AND supplier_invoice_number != '' THEN 1 END) as facturas_con_numero_no_vacio,
    COUNT(CASE WHEN supplier_invoice_number IS NULL OR supplier_invoice_number = '' THEN 1 END) as facturas_sin_numero
FROM purchase_invoices; 