-- ================================================
-- VERIFICAR TABLAS DISPONIBLES EN LA BASE DE DATOS
-- ================================================

-- ================================================
-- 1. LISTAR TODAS LAS TABLAS EN EL ESQUEMA PUBLIC
-- ================================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ================================================
-- 2. BUSCAR TABLAS RELACIONADAS CON RESERVAS
-- ================================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%reserv%'
ORDER BY table_name;

-- ================================================
-- 3. VERIFICAR SI EXISTE TABLA RESERVATIONS EN CUALQUIER ESQUEMA
-- ================================================
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'reservations'
ORDER BY table_schema;

-- ================================================
-- 4. LISTAR ESQUEMAS DISPONIBLES
-- ================================================
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- ================================================
-- 5. BUSCAR TABLAS CON NOMBRES SIMILARES
-- ================================================
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name ILIKE '%reserv%' 
   OR table_name ILIKE '%booking%'
   OR table_name ILIKE '%reservation%'
ORDER BY table_schema, table_name; 