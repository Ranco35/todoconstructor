-- ===================================
-- VERIFICAR: ID vs NÚMERO OFICIAL DE FACTURA
-- Problema: ¿Estamos usando el ID como número de factura?
-- ===================================

-- 1. VER DIFERENCIA CLARA: ID vs NÚMERO OFICIAL
SELECT 
    'ID interno' as campo,
    id as valor,
    'Se genera automáticamente en BD' as descripcion
FROM purchase_invoices 
WHERE id = 6
UNION ALL
SELECT 
    'Número oficial' as campo,
    invoice_number as valor,
    'Número real de la factura del proveedor' as descripcion
FROM purchase_invoices 
WHERE id = 6;

-- 2. DETECTAR SI USAMOS ID COMO NÚMERO
SELECT 
    id,
    invoice_number,
    CASE 
        WHEN CAST(id AS TEXT) = invoice_number THEN '❌ PROBLEMA: Usando ID como número'
        WHEN invoice_number LIKE 'FC%' THEN '⚠️ Número generado por sistema'
        WHEN invoice_number IS NULL THEN '❌ Sin número oficial'
        ELSE '✅ Número oficial del proveedor'
    END as estado,
    created_at
FROM purchase_invoices
ORDER BY id DESC
LIMIT 10;

-- 3. VER FACTURA ESPECÍFICA DE LA IMAGEN (FC250719-77)
SELECT 
    id as id_interno,
    invoice_number as numero_mostrado,
    supplier_id,
    invoice_date,
    total_amount,
    status
FROM purchase_invoices 
WHERE invoice_number LIKE '%250719-77%' 
   OR invoice_number LIKE 'FC250719-77%';

-- 4. CAMPOS CORRECTOS PARA NÚMERO OFICIAL
-- purchase_invoices.invoice_number debe contener el número del proveedor
-- NO el ID generado por nosotros
SELECT 
    'Campo correcto para número oficial' as info,
    'purchase_invoices.invoice_number' as campo,
    'Ejemplo: FAC-2024-0001, 123456, etc.' as formato_correcto,
    'NO usar: 1, 2, 3, etc. (esos son IDs)' as que_no_hacer; 