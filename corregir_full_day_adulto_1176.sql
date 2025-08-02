-- Script específico para corregir FULL DAY ADULTO (ID: 1176)
-- Problema: Producto no muestra precios en formulario de edición

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

-- 2. Actualizar FULL DAY ADULTO con precios correctos
UPDATE "Product" 
SET 
    saleprice = 46219,  -- $55.000 con IVA incluido
    vat = 19,
    "isForSale" = true,
    type = 'SERVICIO',
    unit = 'Pieza',
    sku = 'FULL-DAY-ADULTO-001'
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

-- 4. Verificar si tiene categorías POS (para que aparezca en POS)
-- Primero verificar si existe la tabla ProductPOSCategory
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ProductPOSCategory'
) as existe_productposcategory;

-- 5. Si existe la tabla, agregar categoría POS
-- (Ejecutar solo si la tabla existe)
INSERT INTO "ProductPOSCategory" (productid, poscategoryid, cashregistertypeid)
VALUES (1176, 24, 1)  -- Categoría "Masajes" para recepción
ON CONFLICT (productid, poscategoryid, cashregistertypeid) DO NOTHING;

-- 6. Verificar categorías POS del producto
SELECT 
    ppc.productid,
    ppc.poscategoryid,
    ppc.cashregistertypeid
FROM "ProductPOSCategory" ppc
WHERE ppc.productid = 1176; 