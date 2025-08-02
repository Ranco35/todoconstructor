-- ===================================
-- VERIFICAR ESTRUCTURA REAL DE FACTURAS
-- Primero verificamos qué tablas existen
-- ===================================

-- 1. ¿QUÉ TABLAS DE FACTURAS/COMPRAS EXISTEN?
SELECT 
    'Tablas relacionadas con facturas/compras:' as info,
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%invoice%'
       OR table_name LIKE '%factura%'
       OR table_name LIKE '%purchase%'
       OR table_name LIKE '%compra%')
ORDER BY table_name;

-- 2. BUSCAR TABLAS QUE CONTENGAN COLUMNAS DE NÚMEROS/FACTURAS
SELECT 
    'Tablas con números de facturas:' as info,
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (column_name LIKE '%number%'
       OR column_name LIKE '%numero%'
       OR column_name LIKE '%invoice%'
       OR column_name LIKE '%factura%')
ORDER BY table_name, column_name;

-- 3. VER TODAS LAS TABLAS QUE PUEDEN SER DE COMPRAS
SELECT 
    'Todas las tablas con PURCHASE:' as info,
    table_name,
    'Columnas: ' || STRING_AGG(column_name, ', ' ORDER BY ordinal_position) as columnas
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name LIKE '%purchase%'
GROUP BY table_name
ORDER BY table_name;

-- 4. VERIFICAR SI EXISTE 'invoices' (facturas de ventas)
SELECT 
    'ESTRUCTURA DE TABLA invoices:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
ORDER BY ordinal_position;

-- 5. SI EXISTE invoices, MOSTRAR DATOS DE EJEMPLO
-- (Solo se ejecutará si la tabla existe)
-- DESCOMENTAR SOLO SI LA TABLA EXISTE:
/*
SELECT 
    'DATOS DE EJEMPLO - FACTURAS:' as info,
    id,
    number as numero,
    client_id,
    status,
    total,
    created_at
FROM invoices 
ORDER BY id DESC 
LIMIT 5;
*/ 