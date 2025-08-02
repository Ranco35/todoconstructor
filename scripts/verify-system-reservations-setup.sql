-- Script de verificación final del sistema de reservas
-- Ejecutar DESPUÉS de todos los scripts anteriores

-- 1. VERIFICAR CATEGORÍA SISTEMA RESERVAS
SELECT 
    '✅ CATEGORÍA SISTEMA RESERVAS:' as info,
    id,
    name,
    description,
    "parentId",
    "createdAt"
FROM "Category" 
WHERE name = 'Sistema Reservas';

-- 2. VERIFICAR PRODUCTOS REALES DE HABITACIONES
SELECT 
    '✅ PRODUCTOS REALES HABITACIONES:' as info,
    id,
    sku,
    name,
    unit_price,
    categoryid,
    CASE 
        WHEN categoryid = (SELECT id FROM "Category" WHERE name = 'Sistema Reservas') 
        THEN '✅ Categoría correcta'
        WHEN categoryid IS NULL 
        THEN '❌ Sin categoría'
        ELSE '⚠️ Categoría incorrecta'
    END as estado_categoria
FROM "Product" 
WHERE sku LIKE 'HAB-%'
ORDER BY sku;

-- 3. VERIFICAR PRODUCTOS MODULARES ÚNICOS
SELECT 
    '✅ PRODUCTOS MODULARES HABITACIONES:' as info,
    id,
    code,
    name,
    price,
    original_id,
    created_at
FROM products_modular 
WHERE code LIKE 'habitacion_%'
ORDER BY code;

-- 4. VERIFICAR SINCRONIZACIÓN DE PRECIOS
SELECT 
    '✅ SINCRONIZACIÓN DE PRECIOS:' as info,
    p.sku as producto_real_sku,
    p.name as producto_real_nombre,
    p.unit_price as precio_real,
    pm.code as producto_modular_code,
    pm.name as producto_modular_nombre,
    pm.price as precio_modular,
    CASE 
        WHEN p.unit_price = pm.price THEN '✅ Sincronizados'
        ELSE '❌ Desincronizados'
    END as estado_sincronizacion
FROM "Product" p
JOIN products_modular pm ON pm.original_id = p.id
WHERE p.sku LIKE 'HAB-%'
ORDER BY p.sku;

-- 5. VERIFICAR QUE NO HAY DUPLICADOS
SELECT 
    '✅ VERIFICACIÓN DUPLICADOS:' as info,
    code,
    COUNT(*) as cantidad,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ Único'
        ELSE '❌ Duplicado'
    END as estado
FROM products_modular 
WHERE code LIKE 'habitacion_%'
GROUP BY code
ORDER BY code;

-- 6. RESUMEN FINAL
SELECT 
    '📊 RESUMEN FINAL:' as info,
    (SELECT COUNT(*) FROM "Category" WHERE name = 'Sistema Reservas') as categorias_sistema_reservas,
    (SELECT COUNT(*) FROM "Product" WHERE sku LIKE 'HAB-%') as productos_reales_habitaciones,
    (SELECT COUNT(*) FROM products_modular WHERE code LIKE 'habitacion_%') as productos_modulares_habitaciones,
    (SELECT COUNT(*) FROM "Product" WHERE sku LIKE 'HAB-%' AND categoryid = (SELECT id FROM "Category" WHERE name = 'Sistema Reservas')) as productos_con_categoria_correcta;

-- 7. VERIFICAR FUNCIONAMIENTO DEL SISTEMA
SELECT 
    '🔧 ESTADO DEL SISTEMA:' as info,
    CASE 
        WHEN (SELECT COUNT(*) FROM "Category" WHERE name = 'Sistema Reservas') = 1 THEN '✅ Categoría Sistema Reservas creada'
        ELSE '❌ Categoría Sistema Reservas no existe'
    END as categoria_creada,
    CASE 
        WHEN (SELECT COUNT(*) FROM "Product" WHERE sku LIKE 'HAB-%') > 0 THEN '✅ Productos reales de habitaciones existen'
        ELSE '❌ No hay productos reales de habitaciones'
    END as productos_reales,
    CASE 
        WHEN (SELECT COUNT(*) FROM products_modular WHERE code LIKE 'habitacion_%') > 0 THEN '✅ Productos modulares de habitaciones existen'
        ELSE '❌ No hay productos modulares de habitaciones'
    END as productos_modulares,
    CASE 
        WHEN (SELECT COUNT(*) FROM products_modular WHERE code LIKE 'habitacion_%' GROUP BY code HAVING COUNT(*) > 1) IS NULL THEN '✅ No hay duplicados'
        ELSE '❌ Hay duplicados'
    END as sin_duplicados; 