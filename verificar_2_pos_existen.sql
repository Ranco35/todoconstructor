-- ============================================
-- VERIFICAR QUE EXISTAN LOS 2 POS
-- ============================================

-- 1. Verificar si existe la tabla CashRegisterType
SELECT 
    '=== 1. VERIFICAR SI EXISTE LA TABLA ===' as paso;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'CashRegisterType'
        ) 
        THEN '✅ La tabla CashRegisterType EXISTE'
        ELSE '❌ La tabla CashRegisterType NO EXISTE - Debes ejecutar crear_sistema_pos_completo.sql'
    END as estado_tabla;

-- 2. Ver cuántos tipos de POS hay (si la tabla existe)
SELECT 
    '=== 2. TIPOS DE POS REGISTRADOS ===' as paso;

-- Intentar seleccionar de la tabla (fallará si no existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CashRegisterType') THEN
        RAISE NOTICE 'Tabla existe, consultando...';
    ELSE
        RAISE NOTICE '❌ TABLA NO EXISTE - Ejecuta crear_sistema_pos_completo.sql primero';
    END IF;
END $$;

-- Si la tabla existe, mostrar los tipos de POS
SELECT 
    "id",
    "name" as nombre_interno,
    "displayName" as nombre_mostrado,
    "description" as descripcion,
    "isActive" as activo,
    "createdAt" as fecha_creacion
FROM "CashRegisterType"
WHERE "isActive" = true
ORDER BY "id";

-- 3. Contar tipos de POS activos
SELECT 
    '=== 3. RESUMEN ===' as paso;

SELECT 
    COUNT(*) as total_tipos_pos,
    COUNT(CASE WHEN "isActive" = true THEN 1 END) as tipos_activos,
    STRING_AGG("displayName", ', ' ORDER BY "id") as nombres_pos
FROM "CashRegisterType";

-- 4. Verificar que sean exactamente 2
SELECT 
    '=== 4. VALIDACIÓN ===' as paso;

SELECT 
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ CORRECTO: Existen 2 tipos de POS'
        WHEN COUNT(*) = 0 THEN '❌ ERROR: No existen tipos de POS - Ejecuta crear_sistema_pos_completo.sql'
        WHEN COUNT(*) = 1 THEN '⚠️ ADVERTENCIA: Solo existe 1 tipo de POS - Falta crear el segundo'
        ELSE '⚠️ ADVERTENCIA: Existen ' || COUNT(*) || ' tipos de POS (esperados: 2)'
    END as validacion,
    STRING_AGG(
        "id"::TEXT || ': ' || "displayName", 
        E'\n' 
        ORDER BY "id"
    ) as detalle_pos
FROM "CashRegisterType"
WHERE "isActive" = true;

-- 5. Verificar categorías por cada POS
SELECT 
    '=== 5. CATEGORÍAS POR POS ===' as paso;

SELECT 
    t."displayName" as pos,
    COUNT(c."id") as total_categorias,
    COUNT(CASE WHEN c."isActive" = true THEN 1 END) as categorias_activas
FROM "CashRegisterType" t
LEFT JOIN "POSProductCategory" c ON c."cashRegisterTypeId" = t."id"
GROUP BY t."id", t."displayName"
ORDER BY t."id";

-- 6. Verificar productos por cada POS
SELECT 
    '=== 6. PRODUCTOS POR POS ===' as paso;

SELECT 
    t."displayName" as pos,
    COUNT(DISTINCT p."id") as total_productos,
    COUNT(DISTINCT CASE WHEN p."isActive" = true THEN p."id" END) as productos_activos
FROM "CashRegisterType" t
LEFT JOIN "POSProductCategory" c ON c."cashRegisterTypeId" = t."id"
LEFT JOIN "POSProduct" p ON p."categoryId" = c."id"
GROUP BY t."id", t."displayName"
ORDER BY t."id";

-- 7. Ver detalles completos de cada POS
SELECT 
    '=== 7. DETALLE COMPLETO DE CADA POS ===' as paso;

SELECT 
    t."id" as pos_id,
    t."name" as nombre_interno,
    t."displayName" as nombre_mostrado,
    t."description" as descripcion,
    t."isActive" as activo,
    (SELECT COUNT(*) FROM "POSProductCategory" WHERE "cashRegisterTypeId" = t."id") as categorias,
    (SELECT COUNT(*) FROM "POSProductCategory" WHERE "cashRegisterTypeId" = t."id" AND "isActive" = true) as categorias_activas,
    (
        SELECT COUNT(DISTINCT p."id") 
        FROM "POSProduct" p 
        INNER JOIN "POSProductCategory" c ON p."categoryId" = c."id" 
        WHERE c."cashRegisterTypeId" = t."id"
    ) as productos,
    (
        SELECT COUNT(DISTINCT p."id") 
        FROM "POSProduct" p 
        INNER JOIN "POSProductCategory" c ON p."categoryId" = c."id" 
        WHERE c."cashRegisterTypeId" = t."id" AND p."isActive" = true
    ) as productos_activos
FROM "CashRegisterType" t
ORDER BY t."id";

