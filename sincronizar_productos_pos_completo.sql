-- ============================================
-- SINCRONIZACIÓN AUTOMÁTICA DE PRODUCTOS POS
-- ============================================
-- Este script sincroniza todos los productos habilitados para POS
-- desde la tabla Product hacia la tabla POSProduct
-- ============================================

-- PASO 1: Mostrar resumen antes de sincronizar
SELECT 
  '📊 RESUMEN ANTES DE SINCRONIZAR' as titulo,
  (SELECT COUNT(*) FROM "Product" WHERE "isPOSEnabled" = true) as productos_habilitados_pos,
  (SELECT COUNT(DISTINCT "productId") FROM "POSProduct") as productos_en_pos_product,
  (SELECT COUNT(*) FROM "ProductPOSCategory") as asignaciones_categorias;

-- PASO 2: Insertar/actualizar productos en POSProduct
-- Esto crea un registro en POSProduct por cada combinación de producto + categoría POS
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
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT 
  p.name,
  p.description,
  p.sku,
  -- Usar precio final congelado si existe, si no calcular con IVA
  COALESCE(
    p."finalPrice", 
    ROUND(p.saleprice * (1 + COALESCE(p.vat, 19) / 100.0))
  ) as price,
  p.costprice as cost,
  p.image,
  ppc."posCategoryId" as "categoryId",
  p.id as "productId",
  true as "isActive",
  0 as "sortOrder",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Product" p
INNER JOIN "ProductPOSCategory" ppc ON p.id = ppc."productId"
INNER JOIN "POSProductCategory" cat ON ppc."posCategoryId" = cat.id
WHERE p."isPOSEnabled" = true
  AND cat."isActive" = true
  AND NOT EXISTS (
    -- Solo insertar si no existe ya esa combinación producto+categoría
    SELECT 1 
    FROM "POSProduct" pp 
    WHERE pp."productId" = p.id 
      AND pp."categoryId" = ppc."posCategoryId"
  )
ON CONFLICT DO NOTHING;

-- PASO 3: Actualizar productos existentes en POSProduct con datos actualizados
UPDATE "POSProduct" pp
SET 
  name = p.name,
  description = p.description,
  sku = p.sku,
  price = COALESCE(
    p."finalPrice", 
    ROUND(p.saleprice * (1 + COALESCE(p.vat, 19) / 100.0))
  ),
  cost = p.costprice,
  image = p.image,
  "isActive" = true,
  "updatedAt" = NOW()
FROM "Product" p
WHERE pp."productId" = p.id
  AND p."isPOSEnabled" = true;

-- PASO 4: Desactivar productos en POSProduct que ya no están habilitados para POS
UPDATE "POSProduct" pp
SET 
  "isActive" = false,
  "updatedAt" = NOW()
FROM "Product" p
WHERE pp."productId" = p.id
  AND p."isPOSEnabled" = false;

-- PASO 5: Mostrar resumen después de sincronizar
SELECT 
  '✅ RESUMEN DESPUÉS DE SINCRONIZAR' as titulo,
  (SELECT COUNT(*) FROM "Product" WHERE "isPOSEnabled" = true) as productos_habilitados_pos,
  (SELECT COUNT(DISTINCT "productId") FROM "POSProduct" WHERE "isActive" = true) as productos_en_pos_product,
  (SELECT COUNT(*) FROM "POSProduct" WHERE "isActive" = true) as total_registros_pos_activos;

-- PASO 6: Verificar específicamente el esmeril
SELECT 
  '🔍 VERIFICACIÓN ESMERIL (ID 16)' as titulo,
  p.name,
  p."isPOSEnabled",
  COUNT(pp.id) as registros_en_pos_product,
  STRING_AGG(cat."displayName", ', ') as categorias_asignadas
FROM "Product" p
LEFT JOIN "POSProduct" pp ON p.id = pp."productId" AND pp."isActive" = true
LEFT JOIN "POSProductCategory" cat ON pp."categoryId" = cat.id
WHERE p.id = 16
GROUP BY p.id, p.name, p."isPOSEnabled";

-- PASO 7: Listar productos del POS Ferretería (tipo 1) después de sincronizar
SELECT 
  pp.id,
  pp.name as producto,
  cat."displayName" as categoria,
  pp.price,
  pp."isActive"
FROM "POSProduct" pp
INNER JOIN "POSProductCategory" cat ON pp."categoryId" = cat.id
WHERE cat."cashRegisterTypeId" = 1  -- Ferretería/Recepción
  AND pp."isActive" = true
ORDER BY cat."displayName", pp.name
LIMIT 50;

