-- =====================================================
-- SCRIPT DE VERIFICACIÓN: Estado del Sistema
-- =====================================================

-- 1. VERIFICAR CATEGORÍA SISTEMA RESERVAS
-- =====================================================
SELECT 
    '✅ CATEGORÍA SISTEMA RESERVAS:' as status,
    id,
    name,
    description,
    is_active,
    sort_order
FROM "Category" 
WHERE name = 'Sistema Reservas';

-- 2. VERIFICAR PRODUCTOS DE HABITACIONES
-- =====================================================
SELECT 
    '🏨 PRODUCTOS DE HABITACIONES:' as status,
    p.sku,
    p.name,
    p.unit_price,
    CASE 
        WHEN c.name = 'Sistema Reservas' THEN '✅ Categorizado'
        WHEN c.name IS NULL THEN '⚠️ Sin categoría'
        ELSE '❌ Categoría incorrecta: ' || c.name
    END as categoria_status,
    p.created_at
FROM "Product" p
LEFT JOIN "Category" c ON p.category_id = c.id
WHERE p.sku LIKE 'HAB-%'
ORDER BY p.sku;

-- 3. VERIFICAR PRODUCTOS MODULARES
-- =====================================================
SELECT 
    '🔄 PRODUCTOS MODULARES:' as status,
    code,
    name,
    price,
    CASE 
        WHEN original_id IS NOT NULL THEN '✅ Vinculado'
        ELSE '⚠️ Sin vincular'
    END as vinculacion_status,
    created_at
FROM products_modular 
WHERE code LIKE 'habitacion_%'
ORDER BY code;

-- 4. VERIFICAR DUPLICADOS
-- =====================================================
SELECT 
    '🔍 VERIFICACIÓN DE DUPLICADOS:' as status,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No hay duplicados'
        ELSE '❌ Hay ' || COUNT(*) || ' duplicados'
    END as resultado
FROM (
    SELECT code, COUNT(*) as count
    FROM products_modular 
    WHERE code LIKE 'habitacion_%'
    GROUP BY code
    HAVING COUNT(*) > 1
) duplicados;

-- 5. ESTADÍSTICAS GENERALES
-- =====================================================
SELECT 
    '📊 ESTADÍSTICAS GENERALES:' as status,
    (SELECT COUNT(*) FROM "Product" WHERE sku LIKE 'HAB-%') as total_productos_habitaciones,
    (SELECT COUNT(*) FROM "Product" p JOIN "Category" c ON p.category_id = c.id WHERE c.name = 'Sistema Reservas') as productos_categorizados,
    (SELECT COUNT(*) FROM products_modular WHERE code LIKE 'habitacion_%') as total_productos_modulares,
    (SELECT COUNT(*) FROM products_modular WHERE code LIKE 'habitacion_%' AND original_id IS NOT NULL) as productos_modulares_vinculados;

-- 6. VERIFICAR ERRORES POTENCIALES
-- =====================================================
SELECT 
    '🚨 ERRORES POTENCIALES:' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM "Product" WHERE sku LIKE 'HAB-%' AND category_id IS NULL) 
        THEN '❌ Hay productos de habitaciones sin categoría'
        ELSE '✅ Todos los productos tienen categoría'
    END as productos_sin_categoria,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM products_modular WHERE code LIKE 'habitacion_%' AND original_id IS NULL) 
        THEN '❌ Hay productos modulares sin vincular'
        ELSE '✅ Todos los productos modulares están vinculados'
    END as productos_sin_vincular,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM products_modular pm1 
            JOIN products_modular pm2 ON pm1.code = pm2.code AND pm1.id != pm2.id 
            WHERE pm1.code LIKE 'habitacion_%'
        ) 
        THEN '❌ Hay productos modulares duplicados'
        ELSE '✅ No hay productos modulares duplicados'
    END as duplicados_modulares; 