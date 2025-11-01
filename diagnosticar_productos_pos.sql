-- ============================================
-- DIAGNÓSTICO COMPLETO: PRODUCTOS POS SIN CATEGORÍAS
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. VERIFICAR CATEGORÍAS POS ACTIVAS
-- ============================================
SELECT 
    '=== CATEGORÍAS POS ACTIVAS ===' as titulo;

SELECT 
    c."id",
    c."name" as nombre_interno,
    c."displayName" as nombre_mostrado,
    c."icon",
    c."cashRegisterTypeId" as tipo_pos,
    CASE 
        WHEN c."cashRegisterTypeId" = 1 THEN 'Ventas'
        WHEN c."cashRegisterTypeId" = 2 THEN 'Ventas2'
        ELSE 'Desconocido'
    END as nombre_pos,
    c."isActive" as activa,
    c."sortOrder" as orden,
    COUNT(p."id") as total_productos
FROM "POSProductCategory" c
LEFT JOIN "POSProduct" p ON p."categoryId" = c."id" AND p."isActive" = true
GROUP BY c."id", c."name", c."displayName", c."icon", c."cashRegisterTypeId", c."isActive", c."sortOrder"
ORDER BY c."cashRegisterTypeId", c."sortOrder";

-- ============================================
-- 2. PRODUCTOS POS ACTIVOS CON SUS CATEGORÍAS
-- ============================================
SELECT 
    '=== PRODUCTOS POS ACTIVOS ===' as titulo;

SELECT 
    p."id",
    p."name" as producto,
    p."price" as precio,
    p."categoryId" as id_categoria,
    c."displayName" as categoria,
    CASE 
        WHEN c."cashRegisterTypeId" = 1 THEN 'Ventas'
        WHEN c."cashRegisterTypeId" = 2 THEN 'Ventas2'
        ELSE 'Sin POS'
    END as pos,
    p."productId" as producto_vinculado_id,
    p."isActive" as activo
FROM "POSProduct" p
LEFT JOIN "POSProductCategory" c ON p."categoryId" = c."id"
WHERE p."isActive" = true
ORDER BY c."cashRegisterTypeId", c."sortOrder", p."sortOrder", p."name";

-- ============================================
-- 3. PRODUCTOS POS SIN CATEGORÍA VÁLIDA (PROBLEMA)
-- ============================================
SELECT 
    '=== ⚠️ PRODUCTOS SIN CATEGORÍA VÁLIDA ===' as titulo;

SELECT 
    p."id" as producto_id,
    p."name" as producto_nombre,
    p."price" as precio,
    p."categoryId" as categoria_id_invalida,
    p."isActive" as activo,
    CASE 
        WHEN p."categoryId" IS NULL THEN 'NULL - Sin categoría asignada'
        WHEN NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "id" = p."categoryId") THEN 'Categoría inexistente'
        WHEN EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "id" = p."categoryId" AND "isActive" = false) THEN 'Categoría inactiva'
        ELSE 'Otro problema'
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

-- ============================================
-- 4. PRODUCTOS HABILITADOS PARA POS EN "Product"
-- ============================================
SELECT 
    '=== PRODUCTOS HABILITADOS PARA POS ===' as titulo;

SELECT 
    pr."id",
    pr."name" as producto,
    pr."saleprice" as precio_venta,
    pr."finalPrice" as precio_final,
    pr."isPOSEnabled" as habilitado_pos,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "POSProduct" 
            WHERE "productId" = pr."id" 
              AND "isActive" = true
              AND EXISTS (
                SELECT 1 FROM "POSProductCategory" 
                WHERE "id" = "POSProduct"."categoryId" AND "isActive" = true
              )
        )
        THEN '✅ Sincronizado correctamente'
        WHEN EXISTS (SELECT 1 FROM "POSProduct" WHERE "productId" = pr."id" AND "isActive" = true)
        THEN '⚠️ Sincronizado pero sin categoría válida'
        ELSE '❌ NO SINCRONIZADO'
    END as estado_sincronizacion
FROM "Product" pr
WHERE pr."isPOSEnabled" = true
ORDER BY estado_sincronizacion, pr."name";

-- ============================================
-- 5. CONTEO POR CATEGORÍA Y POS
-- ============================================
SELECT 
    '=== CONTEO POR CATEGORÍA ===' as titulo;

SELECT 
    CASE 
        WHEN c."cashRegisterTypeId" = 1 THEN 'Ventas'
        WHEN c."cashRegisterTypeId" = 2 THEN 'Ventas2'
        ELSE 'Desconocido'
    END as punto_venta,
    c."displayName" as categoria,
    c."isActive" as categoria_activa,
    COUNT(p."id") as total_productos_activos,
    COUNT(CASE WHEN p."productId" IS NOT NULL THEN 1 END) as productos_vinculados,
    COUNT(CASE WHEN p."productId" IS NULL THEN 1 END) as productos_no_vinculados
FROM "POSProductCategory" c
LEFT JOIN "POSProduct" p ON p."categoryId" = c."id" AND p."isActive" = true
GROUP BY c."cashRegisterTypeId", c."displayName", c."isActive"
ORDER BY c."cashRegisterTypeId", c."displayName";

-- ============================================
-- 6. RESUMEN GENERAL
-- ============================================
SELECT 
    '=== RESUMEN GENERAL ===' as titulo;

SELECT 
    'Total Categorías POS Activas' as concepto,
    COUNT(*) as cantidad
FROM "POSProductCategory"
WHERE "isActive" = true

UNION ALL

SELECT 
    'Total Productos POS Activos',
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
    '⚠️ Productos SIN categoría válida',
    COUNT(*)
FROM "POSProduct" p
WHERE p."isActive" = true
  AND (
    p."categoryId" IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM "POSProductCategory" c 
      WHERE c."id" = p."categoryId" AND c."isActive" = true
    )
  )

UNION ALL

SELECT 
    'Productos habilitados en Product',
    COUNT(*)
FROM "Product"
WHERE "isPOSEnabled" = true

UNION ALL

SELECT 
    'Productos sincronizados correctamente',
    COUNT(DISTINCT p."productId")
FROM "POSProduct" p
INNER JOIN "POSProductCategory" c ON p."categoryId" = c."id"
WHERE p."isActive" = true 
  AND p."productId" IS NOT NULL
  AND c."isActive" = true;

-- ============================================
-- 7. CATEGORÍAS ESPECÍFICAS CON MÁS DETALLE
-- ============================================
SELECT 
    '=== DETALLE POR CATEGORÍA ===' as titulo;

SELECT 
    CASE 
        WHEN c."cashRegisterTypeId" = 1 THEN '💰 Ventas'
        WHEN c."cashRegisterTypeId" = 2 THEN '💰 Ventas2'
    END || ' - ' || c."displayName" as categoria_completa,
    c."id" as categoria_id,
    c."icon",
    c."color",
    c."isActive" as activa,
    STRING_AGG(p."name", ', ' ORDER BY p."name") as productos
FROM "POSProductCategory" c
LEFT JOIN "POSProduct" p ON p."categoryId" = c."id" AND p."isActive" = true
WHERE c."isActive" = true
GROUP BY c."cashRegisterTypeId", c."displayName", c."id", c."icon", c."color", c."isActive"
ORDER BY c."cashRegisterTypeId", c."displayName";

