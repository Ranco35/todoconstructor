-- Script corregido para actualizar precios del producto FULL DAY ADULTO (ID: 1176)
-- Problema: Base de datos se actualizó a 1 día atrás y los precios no se muestran

-- 1. Verificar datos actuales del producto
SELECT 
    id,
    name,
    costprice,
    saleprice,
    vat,
    "isForSale",
    type,
    sku,
    unit
FROM "Product" 
WHERE id = 1176;

-- 2. Actualizar precios del producto FULL DAY ADULTO
UPDATE "Product" 
SET 
    saleprice = 46219,
    vat = 19,
    "isForSale" = true,
    type = 'SERVICIO',
    unit = 'Pieza'
WHERE id = 1176;

-- 3. Verificar que se actualizó correctamente
SELECT 
    id,
    name,
    costprice,
    saleprice,
    vat,
    "isForSale",
    type,
    sku,
    unit
FROM "Product" 
WHERE id = 1176;

-- 4. Verificar productos con nombres similares que también pueden necesitar corrección
SELECT 
    id,
    name,
    saleprice,
    vat,
    "isForSale",
    type
FROM "Product" 
WHERE name ILIKE '%FULL DAY%' 
   OR name ILIKE '%ADULTO%'
   OR name ILIKE '%MASAJE%'
ORDER BY name;

-- 5. Verificar productos de tipo SERVICIO sin precios
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