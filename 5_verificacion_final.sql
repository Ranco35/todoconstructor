-- ============================================
-- 5. VERIFICACIÓN FINAL
-- ============================================

-- Resumen general
SELECT 
    'Categorías activas' as concepto,
    COUNT(*) as cantidad
FROM "POSProductCategory"
WHERE "isActive" = true

UNION ALL

SELECT 
    'Productos POS activos',
    COUNT(*)
FROM "POSProduct"
WHERE "isActive" = true

UNION ALL

SELECT 
    'Productos con categoría válida',
    COUNT(*)
FROM "POSProduct" p
INNER JOIN "POSProductCategory" c ON p."categoryId" = c."id"
WHERE p."isActive" = true AND c."isActive" = true

UNION ALL

SELECT 
    'Productos SIN categoría válida',
    COUNT(*)
FROM "POSProduct" p
WHERE p."isActive" = true
  AND (
    p."categoryId" IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM "POSProductCategory" c 
      WHERE c."id" = p."categoryId" AND c."isActive" = true
    )
  );

