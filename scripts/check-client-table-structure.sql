-- Script para verificar la estructura de la tabla Client
-- Ejecutar para ver los nombres exactos de las columnas

-- 1. Verificar todas las columnas de la tabla Client
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Client'
ORDER BY ordinal_position;

-- 2. Verificar si existe la columna nombreprincipal
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND column_name ILIKE '%nombre%';

-- 3. Verificar si existe la columna rut
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND column_name ILIKE '%rut%';

-- 4. Mostrar algunos registros de ejemplo para ver la estructura
SELECT 
    id,
    -- Intentar diferentes variaciones del nombre
    CASE 
        WHEN column_name = 'nombreprincipal' THEN nombreprincipal
        WHEN column_name = 'nombrePrincipal' THEN "nombrePrincipal"
        WHEN column_name = 'nombre_principal' THEN nombre_principal
        ELSE 'Columna no encontrada'
    END as nombre_cliente,
    rut
FROM "Client" 
LIMIT 5; 