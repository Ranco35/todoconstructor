-- Script para ver todas las columnas de la tabla Client
-- Ejecutar para ver la estructura completa

-- 1. Verificar todas las columnas de la tabla Client
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Client'
ORDER BY ordinal_position;

-- 2. Mostrar algunos registros de ejemplo para ver qué datos hay
SELECT 
    id,
    -- Mostrar las primeras columnas para entender la estructura
    *
FROM "Client" 
LIMIT 3; 