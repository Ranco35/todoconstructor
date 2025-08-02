-- Script para corregir el producto 1146 "ONCE BUFFET NIÑOS"
-- Objetivo: Corregir precio de $0 a $8,000 y habilitar para POS
-- NOTA: No usa is_active porque no existe en la tabla

-- 1. Verificar si existe la columna isPOSEnabled
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name = 'isPOSEnabled';

-- 2. Verificar el estado actual del producto 1146
SELECT 
    id,
    name,
    saleprice as precio_actual,
    "finalPrice" as precio_final,
    "isPOSEnabled"
FROM "Product" 
WHERE id = 1146;

-- 3. Corregir el precio y habilitar para POS
UPDATE "Product" 
SET 
    saleprice = 8000,
    "finalPrice" = 8000,
    "isPOSEnabled" = true
WHERE id = 1146;

-- 4. Verificar la corrección
SELECT 
    id,
    name,
    saleprice as precio_corregido,
    "finalPrice" as precio_final_corregido,
    "isPOSEnabled"
FROM "Product" 
WHERE id = 1146;

-- 5. Verificar si existe en POSProduct
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos,
    ppc.name as categoria_pos
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp."categoryId" = ppc.id
WHERE pp."productId" = 1146;

-- 6. Corregir precio en POSProduct si existe
UPDATE "POSProduct" 
SET price = 8000
WHERE "productId" = 1146;

-- 7. Verificar corrección final en POSProduct
SELECT 
    pp.id,
    pp.name,
    pp.price as precio_pos_corregido,
    ppc.name as categoria_pos
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" ppc ON pp."categoryId" = ppc.id
WHERE pp."productId" = 1146; 