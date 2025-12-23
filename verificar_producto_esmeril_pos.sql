-- ============================================
-- VERIFICAR PRODUCTO ESMERIL EN POS
-- ============================================

-- 1. Buscar el producto esmeril en la tabla Product
SELECT 
  id,
  name,
  sku,
  "isPOSEnabled",
  "isActive"
FROM "Product"
WHERE name ILIKE '%esmeril%'
ORDER BY id;

-- 2. Ver las categorías POS asignadas al esmeril (ID 16)
SELECT 
  ppc.*,
  cat."displayName" as categoria_nombre,
  cat.icon,
  cat."cashRegisterTypeId",
  CASE 
    WHEN cat."cashRegisterTypeId" = 1 THEN 'Ferretería/Recepción'
    WHEN cat."cashRegisterTypeId" = 2 THEN 'Ferretería2/Restaurante'
    ELSE 'Otro'
  END as tipo_pos
FROM "ProductPOSCategory" ppc
LEFT JOIN "POSProductCategory" cat ON ppc."posCategoryId" = cat.id
WHERE ppc."productId" = 16;

-- 3. Ver todos los productos habilitados para POS tipo 1 (Ferretería/Recepción)
SELECT 
  p.id,
  p.name,
  p."isPOSEnabled",
  ppc."posCategoryId",
  cat."displayName" as categoria,
  cat."cashRegisterTypeId"
FROM "Product" p
LEFT JOIN "ProductPOSCategory" ppc ON p.id = ppc."productId"
LEFT JOIN "POSProductCategory" cat ON ppc."posCategoryId" = cat.id
WHERE p."isPOSEnabled" = true
  AND (cat."cashRegisterTypeId" = 1 OR ppc."posCategoryId" IS NULL)
ORDER BY p.name
LIMIT 20;

-- 4. Ver todas las categorías disponibles para Ferretería (tipo 1)
SELECT 
  id,
  name,
  "displayName",
  icon,
  "cashRegisterTypeId",
  "isActive"
FROM "POSProductCategory"
WHERE "cashRegisterTypeId" = 1
ORDER BY "sortOrder";

-- 5. Verificar si existe el producto en la vista/tabla POSProduct
SELECT *
FROM "POSProduct"
WHERE name ILIKE '%esmeril%'
LIMIT 5;

-- 6. Si el producto NO tiene categorías POS asignadas, esta query mostrará el problema
SELECT 
  p.id,
  p.name,
  p."isPOSEnabled",
  COUNT(ppc.id) as categorias_asignadas
FROM "Product" p
LEFT JOIN "ProductPOSCategory" ppc ON p.id = ppc."productId"
WHERE p.id = 16
GROUP BY p.id, p.name, p."isPOSEnabled";

