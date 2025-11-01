-- ============================================
-- 3. DIAGNOSTICAR PRODUCTOS POS
-- ============================================

-- Ver categorías activas
SELECT 
    c."id",
    c."displayName" as categoria,
    CASE 
        WHEN c."cashRegisterTypeId" = 1 THEN 'Ferreteria'
        WHEN c."cashRegisterTypeId" = 2 THEN 'Ferreteria2'
    END as pos,
    c."isActive" as activa,
    COUNT(p."id") as total_productos
FROM "POSProductCategory" c
LEFT JOIN "POSProduct" p ON p."categoryId" = c."id" AND p."isActive" = true
GROUP BY c."id", c."displayName", c."cashRegisterTypeId", c."isActive"
ORDER BY c."cashRegisterTypeId", c."sortOrder";

-- Ver productos SIN categoría válida
SELECT 
    p."id",
    p."name" as producto,
    p."price" as precio,
    p."categoryId" as categoria_id,
    CASE 
        WHEN p."categoryId" IS NULL THEN '❌ Sin categoría'
        WHEN NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "id" = p."categoryId") THEN '❌ Categoría inexistente'
        WHEN EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "id" = p."categoryId" AND "isActive" = false) THEN '❌ Categoría inactiva'
    END as problema
FROM "POSProduct" p
WHERE p."isActive" = true
  AND (
    p."categoryId" IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM "POSProductCategory" c 
      WHERE c."id" = p."categoryId" AND c."isActive" = true
    )
  );

