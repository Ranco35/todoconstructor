-- Script para corregir el precio final del producto FULL DAY ADULTO (ID: 1176)
-- Problema: Se guardó precio neto en lugar de precio final

-- 1. Verificar datos actuales del producto 1176
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

-- 2. Calcular precio correcto
-- Precio final deseado: $55,000
-- Precio neto = $55,000 / 1.19 = $46,218.49
-- Redondeado: $46,218

-- 3. Actualizar con precio neto correcto
UPDATE "Product" 
SET 
    saleprice = 46218,  -- $55,000 / 1.19 = $46,218.49 redondeado
    vat = 19,
    "isForSale" = true,
    type = 'SERVICIO',
    unit = 'Pieza',
    sku = 'FULL-DAY-ADULTO-001'
WHERE id = 1176;

-- 4. Verificar que se actualizó correctamente
SELECT 
    id,
    name,
    costprice,
    saleprice,
    vat,
    "isForSale",
    type,
    sku,
    unit,
    -- Calcular precio final para verificar
    saleprice * (1 + vat/100) as precio_final_calculado
FROM "Product" 
WHERE id = 1176;

-- 5. Verificar otros productos de servicios que puedan tener el mismo problema
SELECT 
    id,
    name,
    saleprice,
    vat,
    saleprice * (1 + vat/100) as precio_final_calculado
FROM "Product" 
WHERE type = 'SERVICIO' 
AND saleprice IS NOT NULL 
AND saleprice > 0
ORDER BY name; 