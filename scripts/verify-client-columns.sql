-- Script para verificar exactamente cómo se llaman las columnas en la tabla Client
-- Ejecutar este script para ver los nombres exactos

-- 1. Verificar todas las columnas de la tabla Client
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Client'
ORDER BY ordinal_position;

-- 2. Buscar específicamente columnas que contengan 'nombre'
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND column_name ILIKE '%nombre%'
ORDER BY column_name;

-- 3. Buscar específicamente columnas que contengan 'rut'
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND column_name ILIKE '%rut%'
ORDER BY column_name;

-- 4. Mostrar algunos registros de ejemplo para ver la estructura
SELECT 
    id,
    -- Intentar diferentes variaciones del nombre
    CASE 
        WHEN column_name = 'nombreprincipal' THEN 'nombreprincipal'
        WHEN column_name = 'nombrePrincipal' THEN 'nombrePrincipal'
        WHEN column_name = 'nombre_principal' THEN 'nombre_principal'
        ELSE 'NO_ENCONTRADO'
    END as nombre_column,
    rut
FROM "Client" 
LIMIT 5; 