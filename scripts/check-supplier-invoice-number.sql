-- Script para verificar el campo supplier_invoice_number en facturas

-- 1. Verificar si el campo existe en la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_invoices' 
AND column_name = 'supplier_invoice_number';

-- 2. Verificar datos existentes en el campo
SELECT 
    id,
    number,
    supplier_invoice_number,
    supplier_id,
    status,
    created_at
FROM purchase_invoices 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Verificar si hay facturas con supplier_invoice_number
SELECT 
    COUNT(*) as total_facturas,
    COUNT(supplier_invoice_number) as facturas_con_numero_proveedor,
    COUNT(CASE WHEN supplier_invoice_number IS NOT NULL AND supplier_invoice_number != '' THEN 1 END) as facturas_con_numero_no_vacio
FROM purchase_invoices;

-- 4. Mostrar ejemplos de facturas con supplier_invoice_number
SELECT 
    id,
    number,
    supplier_invoice_number,
    supplier_id,
    status
FROM purchase_invoices 
WHERE supplier_invoice_number IS NOT NULL 
AND supplier_invoice_number != ''
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Verificar estructura completa de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_invoices' 
ORDER BY ordinal_position; 