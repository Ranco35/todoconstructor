-- ============================================
-- DIAGNÓSTICO COMPLETO: ¿Por qué no aparece el esmeril en el POS?
-- ============================================

-- PASO 1: Verificar que el producto existe y está habilitado para POS
SELECT 
  id,
  name,
  sku,
  "isPOSEnabled",
  "isActive",
  saleprice,
  vat,
  "finalPrice"
FROM "Product"
WHERE id = 16;

-- PASO 2: Verificar categorías POS asignadas al producto
SELECT 
  ppc.*,
  cat."displayName" as categoria_nombre,
  cat."cashRegisterTypeId",
  CASE 
    WHEN cat."cashRegisterTypeId" = 1 THEN 'Ferretería (Recepción)'
    WHEN cat."cashRegisterTypeId" = 2 THEN 'Ferretería2 (Restaurante)'
  END as tipo_pos
FROM "ProductPOSCategory" ppc
LEFT JOIN "POSProductCategory" cat ON ppc."posCategoryId" = cat.id
WHERE ppc."productId" = 16;

-- PASO 3: CRÍTICO - ¿Existe el producto en la tabla POSProduct?
-- Esta es la tabla que usa el POS para mostrar productos
SELECT 
  pp.id,
  pp.name,
  pp."categoryId",
  pp."productId",
  pp."isActive",
  pp.price,
  cat."displayName" as categoria_nombre,
  cat."cashRegisterTypeId"
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" cat ON pp."categoryId" = cat.id
WHERE pp."productId" = 16 OR pp.name ILIKE '%esmeril%';

-- PASO 4: Ver cuántos productos están en Product con POS habilitado vs POSProduct
SELECT 
  'Product (isPOSEnabled=true)' as origen,
  COUNT(*) as total
FROM "Product"
WHERE "isPOSEnabled" = true

UNION ALL

SELECT 
  'POSProduct' as origen,
  COUNT(*) as total
FROM "POSProduct"
WHERE "isActive" = true;

-- PASO 5: Listar productos que DEBERÍAN estar en POS pero NO están
SELECT 
  p.id,
  p.name,
  p."isPOSEnabled",
  ppc."posCategoryId",
  cat."displayName" as categoria_pos,
  cat."cashRegisterTypeId",
  CASE 
    WHEN pp.id IS NULL THEN '❌ NO ESTÁ EN POSProduct'
    ELSE '✅ Está en POSProduct'
  END as estado_pos
FROM "Product" p
LEFT JOIN "ProductPOSCategory" ppc ON p.id = ppc."productId"
LEFT JOIN "POSProductCategory" cat ON ppc."posCategoryId" = cat.id
LEFT JOIN "POSProduct" pp ON p.id = pp."productId" AND pp."categoryId" = ppc."posCategoryId"
WHERE p."isPOSEnabled" = true
  AND cat."cashRegisterTypeId" = 1  -- Ferretería/Recepción
ORDER BY estado_pos, p.name
LIMIT 30;

-- ============================================
-- SOLUCIÓN: Insertar el producto en POSProduct
-- ============================================

-- NOTA: Ejecutar esto SOLO si la consulta PASO 3 muestra que NO existe en POSProduct

-- Insertar el esmeril en POSProduct para cada categoría asignada
INSERT INTO "POSProduct" (
  name,
  description,
  sku,
  price,
  cost,
  image,
  "categoryId",
  "productId",
  "isActive",
  "sortOrder"
)
SELECT 
  p.name,
  p.description,
  p.sku,
  COALESCE(p."finalPrice", ROUND(p.saleprice * (1 + COALESCE(p.vat, 19) / 100.0))) as price,
  p.costprice as cost,
  p.image,
  ppc."posCategoryId" as "categoryId",
  p.id as "productId",
  true as "isActive",
  0 as "sortOrder"
FROM "Product" p
INNER JOIN "ProductPOSCategory" ppc ON p.id = ppc."productId"
WHERE p.id = 16
  AND NOT EXISTS (
    SELECT 1 
    FROM "POSProduct" pp 
    WHERE pp."productId" = p.id 
      AND pp."categoryId" = ppc."posCategoryId"
  );

-- Verificar que se insertó correctamente
SELECT 
  pp.*,
  cat."displayName" as categoria,
  cat."cashRegisterTypeId"
FROM "POSProduct" pp
LEFT JOIN "POSProductCategory" cat ON pp."categoryId" = cat.id
WHERE pp."productId" = 16;

