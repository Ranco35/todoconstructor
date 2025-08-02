-- Script para corregir productos de tipo SERVICIO sin precios
-- Problema: Muchos productos tienen saleprice = null y vat = null

-- 1. Verificar productos de tipo SERVICIO sin precios
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

-- 2. Actualizar productos de masajes con precios estándar
UPDATE "Product" 
SET 
    saleprice = 42017,  -- $50.000 con IVA incluido
    vat = 19,
    "isForSale" = true,
    unit = 'Pieza'
WHERE id IN (219, 220, 221, 222, 225, 226)  -- Masajes
AND (saleprice IS NULL OR saleprice = 0);

-- 3. Actualizar masaje de niño con precio menor
UPDATE "Product" 
SET 
    saleprice = 21008,  -- $25.000 con IVA incluido
    vat = 19,
    "isForSale" = true,
    unit = 'Pieza'
WHERE id = 223  -- MASAJE NIÑO 15M
AND (saleprice IS NULL OR saleprice = 0);

-- 4. Actualizar masaje reductivo con precio premium
UPDATE "Product" 
SET 
    saleprice = 50420,  -- $60.000 con IVA incluido
    vat = 19,
    "isForSale" = true,
    unit = 'Pieza'
WHERE id = 224  -- MASAJE REDUCTIVO
AND (saleprice IS NULL OR saleprice = 0);

-- 5. Actualizar tratamientos faciales
UPDATE "Product" 
SET 
    saleprice = 37815,  -- $45.000 con IVA incluido
    vat = 19,
    "isForSale" = true,
    unit = 'Pieza'
WHERE id IN (227, 229, 231, 232)  -- Tratamientos faciales
AND (saleprice IS NULL OR saleprice = 0);

-- 6. Actualizar fangoterapia
UPDATE "Product" 
SET 
    saleprice = 46219,  -- $55.000 con IVA incluido
    vat = 19,
    "isForSale" = true,
    unit = 'Pieza'
WHERE id = 234  -- FANGO TERAPIA CORPORAL
AND (saleprice IS NULL OR saleprice = 0);

-- 7. Actualizar envolvimiento plástico
UPDATE "Product" 
SET 
    saleprice = 33613,  -- $40.000 con IVA incluido
    vat = 19,
    "isForSale" = true,
    unit = 'Pieza'
WHERE id = 230  -- ENVOLVIMIENTO PLASTICO
AND (saleprice IS NULL OR saleprice = 0);

-- 8. Actualizar piscina termal niños
UPDATE "Product" 
SET 
    saleprice = 16807,  -- $20.000 con IVA incluido
    vat = 19,
    "isForSale" = true,
    unit = 'Pieza'
WHERE id = 259  -- Piscina Termal Niños
AND (saleprice IS NULL OR saleprice = 0);

-- 9. Actualizar menú vegetariano
UPDATE "Product" 
SET 
    saleprice = 25210,  -- $30.000 con IVA incluido
    vat = 19,
    "isForSale" = true,
    unit = 'Pieza'
WHERE id = 1105  -- Grupos Menú Vegetariano
AND (saleprice IS NULL OR saleprice = 0);

-- 10. Verificar que se actualizaron correctamente
SELECT 
    id,
    name,
    saleprice,
    vat,
    "isForSale",
    type
FROM "Product" 
WHERE type = 'SERVICIO'
ORDER BY name;

-- 11. Verificar productos que aún no tienen precios
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