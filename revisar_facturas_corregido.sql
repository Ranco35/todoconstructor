-- ===================================
-- CONSULTA CORREGIDA: Números de Facturas 
-- Usando nombres reales de columnas
-- ===================================

-- 1. FACTURAS DE COMPRAS - Datos básicos
SELECT 
    'COMPRAS' as tipo_factura,
    id as id_interno,
    number as numero_oficial,
    supplier_id,
    invoice_date as fecha,
    total_amount as total,
    status as estado,
    created_at
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
    status as estado,
    created_at
FROM invoices
ORDER BY id DESC
LIMIT 10;

-- 3. CONTAR registros con y sin números oficiales
SELECT 
    'Facturas de Compras' as tabla,
    COUNT(*) as total_registros,
    SUM(CASE WHEN number IS NOT NULL AND number != '' THEN 1 ELSE 0 END) as con_numero,
    SUM(CASE WHEN number IS NULL OR number = '' THEN 1 ELSE 0 END) as sin_numero
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
    id,
    number,
    'ID = Número' as validacion
FROM purchase_invoices
WHERE CAST(id AS TEXT) = number;

SELECT 
    'VENTAS - Usando ID como número' as problema,
    id,
    number,
    'ID = Número' as validacion
FROM invoices
WHERE CAST(id AS TEXT) = number;

-- 5. EJEMPLOS de números oficiales únicos y correctos
SELECT 
    'COMPRAS - Números únicos correctos' as info,
    id,
    number as numero_oficial,
    supplier_id,
    total_amount
FROM purchase_invoices 
WHERE number IS NOT NULL 
  AND number != CAST(id AS TEXT)
  AND number != ''
ORDER BY id DESC 
LIMIT 5;

SELECT 
    'VENTAS - Números únicos correctos' as info,
    id,
    number as numero_oficial,
    client_id,
    total
FROM invoices 
WHERE number IS NOT NULL 
  AND number != CAST(id AS TEXT)
  AND number != ''
ORDER BY id DESC 
LIMIT 5;

-- 6. BUSCAR EL CASO ESPECÍFICO FC250719-2089
SELECT 
    'CASO ESPECÍFICO FC250719-2089' as info,
    id,
    number,
    supplier_id,
    total_amount,
    status,
    created_at
FROM purchase_invoices 
WHERE number LIKE '%FC250719%' 
   OR number LIKE '%2089%';

-- 7. ESTRUCTURA DE CAMPOS para confirmación
SELECT 
    'CAMPOS DE purchase_invoices' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'purchase_invoices' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 