-- ===================================
-- CONSULTA SIMPLE: Números de Facturas 
-- Propósito: Verificar diferencia entre ID vs Número Oficial
-- ===================================

-- 1. FACTURAS DE COMPRAS - Datos básicos
SELECT 
    'COMPRAS' as tipo_factura,
    id as id_interno,
    invoice_number as numero_oficial,
    supplier_id,
    invoice_date as fecha,
    total_amount as total,
    status as estado
FROM purchase_invoices
ORDER BY id DESC
LIMIT 10;

-- 2. FACTURAS DE VENTAS - Datos básicos  
SELECT 
    'VENTAS' as tipo_factura,
    id as id_interno,
    number as numero_oficial,
    client_id,
    due_date as fecha,
    total,
    status as estado
FROM invoices
ORDER BY id DESC
LIMIT 10;

-- 3. CONTAR registros con y sin números oficiales
SELECT 
    'Facturas de Compras' as tabla,
    COUNT(*) as total_registros,
    SUM(CASE WHEN invoice_number IS NOT NULL AND invoice_number != '' THEN 1 ELSE 0 END) as con_numero,
    SUM(CASE WHEN invoice_number IS NULL OR invoice_number = '' THEN 1 ELSE 0 END) as sin_numero
FROM purchase_invoices;

SELECT 
    'Facturas de Ventas' as tabla,
    COUNT(*) as total_registros,
    SUM(CASE WHEN number IS NOT NULL AND number != '' THEN 1 ELSE 0 END) as con_numero,
    SUM(CASE WHEN number IS NULL OR number = '' THEN 1 ELSE 0 END) as sin_numero
FROM invoices;

-- 4. VERIFICAR si están usando ID como número (PROBLEMA)
SELECT 
    'COMPRAS - Usando ID como número' as problema,
    COUNT(*) as cantidad_problematica
FROM purchase_invoices
WHERE CAST(id AS TEXT) = invoice_number;

SELECT 
    'VENTAS - Usando ID como número' as problema,
    COUNT(*) as cantidad_problematica  
FROM invoices
WHERE CAST(id AS TEXT) = number;

-- 5. EJEMPLOS de números oficiales únicos
SELECT 
    'COMPRAS - Ejemplos números únicos' as info,
    invoice_number
FROM purchase_invoices 
WHERE invoice_number IS NOT NULL 
  AND invoice_number != CAST(id AS TEXT)
ORDER BY id DESC 
LIMIT 5;

SELECT 
    'VENTAS - Ejemplos números únicos' as info,
    number
FROM invoices 
WHERE number IS NOT NULL 
  AND number != CAST(id AS TEXT)
ORDER BY id DESC 
LIMIT 5; 