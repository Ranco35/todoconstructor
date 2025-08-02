-- Script para verificar qué columnas existen en la tabla Product
-- Ejecuta este script primero para ver la estructura real

-- 1. Mostrar todas las columnas de la tabla Product
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product'
ORDER BY ordinal_position;

-- 2. Verificar datos del producto 1146 con columnas que sabemos que existen
SELECT 
    id,
    name,
    saleprice,
    cost,
    vat,
    "finalPrice",
    type,
    categoryid,
    created_at,
    updated_at
FROM "Product" 
WHERE id = 1146; 