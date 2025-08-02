-- Script simple para buscar si existe la columna isPOSEnabled
-- Ejecuta este script en Supabase SQL Editor

-- 1. Verificar si existe la columna isPOSEnabled
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name = 'isPOSEnabled';

-- 2. Si existe, mostrar productos con estado de POS
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    "isPOSEnabled",
    is_active
FROM "Product" 
WHERE "isPOSEnabled" = true
ORDER BY id;

-- 3. Verificar específicamente el producto 1146
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    "isPOSEnabled",
    is_active
FROM "Product" 
WHERE id = 1146;

-- 4. Mostrar estructura completa de la tabla Product
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Product'
ORDER BY ordinal_position; 