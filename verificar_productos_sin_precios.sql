-- Script para verificar productos que pueden haber perdido precios por rollback de BD

-- 1. Verificar productos con precios nulos o cero
SELECT 
    id,
    name,
    saleprice,
    vat,
    "isForSale",
    type
FROM "Product" 
WHERE saleprice IS NULL OR saleprice = 0
ORDER BY name;

-- 2. Verificar productos de tipo SERVICIO sin precios
SELECT 
    id,
    name,
    saleprice,
    vat,
    "isForSale",
    type
FROM "Product" 
WHERE type = 'SERVICIO' AND (saleprice IS NULL OR saleprice = 0)
ORDER BY name;

-- 3. Verificar productos que deberían tener precios pero no los tienen
SELECT 
    id,
    name,
    saleprice,
    vat,
    "isForSale",
    type
FROM "Product" 
WHERE "isForSale" = true AND (saleprice IS NULL OR saleprice = 0)
ORDER BY name;

-- 4. Contar productos por tipo
SELECT 
    type,
    COUNT(*) as total,
    COUNT(CASE WHEN saleprice IS NOT NULL AND saleprice > 0 THEN 1 END) as con_precio,
    COUNT(CASE WHEN saleprice IS NULL OR saleprice = 0 THEN 1 END) as sin_precio
FROM "Product" 
GROUP BY type
ORDER BY type;

-- 5. Verificar productos con nombres que sugieren que deberían tener precios
SELECT 
    id,
    name,
    saleprice,
    vat,
    "isForSale",
    type
FROM "Product" 
WHERE name ILIKE '%FULL DAY%' 
   OR name ILIKE '%MASAJE%'
   OR name ILIKE '%PROGRAMA%'
   OR name ILIKE '%SPA%'
ORDER BY name; 