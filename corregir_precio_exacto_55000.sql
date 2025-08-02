-- Script para corregir el precio del producto FULL DAY ADULTO (ID: 1176)
-- Objetivo: Precio final exacto de $55,000

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

-- 2. Calcular precio neto exacto para $55,000
-- Fórmula: Precio Neto = Precio Final / (1 + IVA/100)
-- Precio Neto = 55000 / (1 + 19/100) = 55000 / 1.19 = 46218.49
-- Redondeado: 46218

-- 3. Actualizar con precio neto exacto
UPDATE "Product" 
SET 
    saleprice = 46218,  -- $55,000 / 1.19 = $46,218.49 redondeado
    vat = 19,
    "isForSale" = true,
    type = 'SERVICIO',
    unit = 'Pieza',
    sku = 'FULL-DAY-ADULTO-001'
WHERE id = 1176;

-- 4. Verificar el cálculo
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    saleprice * (1 + vat/100) as precio_final_calculado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_redondeado
FROM "Product" 
WHERE id = 1176;

-- 5. Verificar que el precio final sea exactamente $55,000
-- Si el precio final calculado no es exactamente $55,000, ajustar el neto
-- Ejemplo: Si precio_final_calculado = 54999, entonces:
-- nuevo_neto = 55000 / 1.19 = 46219

-- 6. Ajuste final si es necesario (ejecutar solo si el precio no es exacto)
-- UPDATE "Product" 
-- SET saleprice = 46219  -- Solo si el precio anterior no dio exactamente $55,000
-- WHERE id = 1176; 