-- Script para buscar si existe la columna isPOSEnabled en la tabla Product

-- 1. Verificar si existe la columna isPOSEnabled
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name = 'isPOSEnabled';

-- 2. Si existe, mostrar todos los productos con su estado de POS
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    "isPOSEnabled",
    is_active,
    type
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
    is_active,
    type
FROM "Product" 
WHERE id = 1146;

-- 4. Mostrar estructura completa de la tabla Product
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product'
ORDER BY ordinal_position;

-- 5. Buscar productos que deberían estar en POS
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    "isPOSEnabled",
    is_active,
    type
FROM "Product" 
WHERE name ILIKE '%once%' 
   OR name ILIKE '%buffet%' 
   OR name ILIKE '%full day%'
   OR name ILIKE '%spa%'
ORDER BY id; 