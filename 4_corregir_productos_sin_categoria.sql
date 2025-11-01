-- ============================================
-- 4. CORREGIR PRODUCTOS SIN CATEGORÍA
-- (Solo ejecutar si el SQL 3 mostró productos con problemas)
-- ============================================

-- Opción A: Asignar a la primera categoría de Ferreteria
UPDATE "POSProduct" p
SET "categoryId" = (
  SELECT "id" FROM "POSProductCategory" 
  WHERE "cashRegisterTypeId" = 1 
    AND "isActive" = true 
  ORDER BY "sortOrder" 
  LIMIT 1
)
WHERE p."isActive" = true 
  AND (
    p."categoryId" IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM "POSProductCategory" c 
      WHERE c."id" = p."categoryId" AND c."isActive" = true
    )
  );

-- Verificar corrección
SELECT 
    COUNT(*) as productos_corregidos
FROM "POSProduct" p
INNER JOIN "POSProductCategory" c ON p."categoryId" = c."id"
WHERE p."isActive" = true AND c."isActive" = true;

