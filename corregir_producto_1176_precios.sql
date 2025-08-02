-- Script para corregir precios del producto FULL DAY ADULTO (ID: 1176)
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
    unit,
    "final_price_with_vat"
FROM "Product" 
WHERE id = 1176;

-- 2. Actualizar precios del producto FULL DAY ADULTO
UPDATE "Product" 
SET 
    saleprice = 46219,
    vat = 19,
    "isForSale" = true,
    "final_price_with_vat" = 55000,
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
    unit,
    "final_price_with_vat"
FROM "Product" 
WHERE id = 1176;

-- 4. Verificar si tiene categorías POS (necesario para que aparezca en POS)
INSERT INTO "ProductPOSCategory" (productid, poscategoryid, cashregistertypeid)
VALUES (1176, 24, 1)  -- Categoría "Masajes" para recepción
ON CONFLICT (productid, poscategoryid, cashregistertypeid) DO NOTHING;

-- 5. Verificar categorías POS del producto
SELECT 
    ppc.productid,
    ppc.poscategoryid,
    ppc.cashregistertypeid
FROM "ProductPOSCategory" ppc
WHERE ppc.productid = 1176; 