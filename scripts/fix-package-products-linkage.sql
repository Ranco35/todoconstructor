-- ═══════════════════════════════════════════════════════════════
-- SCRIPT: CORREGIR VINCULACIONES DE PAQUETES Y PRODUCTOS
-- ═══════════════════════════════════════════════════════════════
-- Problema: package_products_modular tiene solo 1 registro
-- Solución: Repoblar con vinculaciones correctas usando códigos reales
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- 1. LIMPIAR TABLA DE VINCULACIONES
-- ═══════════════════════════════════════════════════════════════
DELETE FROM package_products_modular;

-- Verificar limpieza
SELECT 'TABLA LIMPIADA - Registros restantes:' as info, COUNT(*) as count FROM package_products_modular;

-- 2. OBTENER IDS DE PAQUETES EXISTENTES
-- ═══════════════════════════════════════════════════════════════
SELECT 'PAQUETES DISPONIBLES:' as info, id, code, name FROM packages_modular ORDER BY id;

-- 3. OBTENER PRODUCTOS DISPONIBLES POR CATEGORÍA
-- ═══════════════════════════════════════════════════════════════
SELECT 'PRODUCTOS DISPONIBLES:' as info, id, code, name, category, price FROM products_modular 
WHERE category != 'alojamiento' ORDER BY category, code;

-- 4. CREAR VINCULACIONES PARA CADA PAQUETE
-- ═══════════════════════════════════════════════════════════════

-- PAQUETE 1: SOLO ALOJAMIENTO (solo WiFi si existe)
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT 
    pk.id,
    pr.id,
    true,
    1
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'SOLO_ALOJAMIENTO' 
AND pr.code LIKE '%wifi%'
AND NOT EXISTS (SELECT 1 FROM package_products_modular WHERE package_id = pk.id AND product_id = pr.id);

-- PAQUETE 2: DESAYUNO (Desayuno + Piscina)
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT 
    pk.id,
    pr.id,
    true,
    CASE 
        WHEN pr.code LIKE '%desayuno%' THEN 1
        WHEN pr.code LIKE '%piscina%' THEN 2
        ELSE 3
    END
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'DESAYUNO' 
AND (pr.code LIKE '%desayuno%' OR pr.code LIKE '%piscina%')
AND NOT EXISTS (SELECT 1 FROM package_products_modular WHERE package_id = pk.id AND product_id = pr.id);

-- PAQUETE 3: MEDIA PENSIÓN (Desayuno + Almuerzo + Piscina)
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT 
    pk.id,
    pr.id,
    true,
    CASE 
        WHEN pr.code LIKE '%desayuno%' THEN 1
        WHEN pr.code LIKE '%almuerzo%' THEN 2
        WHEN pr.code LIKE '%piscina%' THEN 3
        ELSE 4
    END
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'MEDIA_PENSION' 
AND (pr.code LIKE '%desayuno%' OR pr.code LIKE '%almuerzo%' OR pr.code LIKE '%piscina%')
AND NOT EXISTS (SELECT 1 FROM package_products_modular WHERE package_id = pk.id AND product_id = pr.id);

-- PAQUETE 4: TODO INCLUIDO (Todos los productos de comida y spa)
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT 
    pk.id,
    pr.id,
    true,
    CASE 
        WHEN pr.code LIKE '%desayuno%' THEN 1
        WHEN pr.code LIKE '%almuerzo%' THEN 2
        WHEN pr.code LIKE '%cena%' THEN 3
        WHEN pr.code LIKE '%once%' THEN 4
        WHEN pr.code LIKE '%piscina%' THEN 5
        ELSE 6
    END
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'TODO_INCLUIDO' 
AND pr.category IN ('comida', 'spa')
AND NOT EXISTS (SELECT 1 FROM package_products_modular WHERE package_id = pk.id AND product_id = pr.id);

-- PAQUETE ESPECÍFICO: PKG-MEDIA-PENSIÓM-1751818074581 (el que creaste manualmente)
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT 
    pk.id,
    pr.id,
    true,
    CASE 
        WHEN pr.code LIKE '%desayuno%' THEN 1
        WHEN pr.code LIKE '%almuerzo%' THEN 2
        WHEN pr.code LIKE '%piscina%' THEN 3
        ELSE 4
    END
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'PKG-MEDIA-PENSIÓM-1751818074581' 
AND (pr.code LIKE '%desayuno%' OR pr.code LIKE '%almuerzo%' OR pr.code LIKE '%piscina%')
AND NOT EXISTS (SELECT 1 FROM package_products_modular WHERE package_id = pk.id AND product_id = pr.id);

-- 5. VERIFICAR RESULTADOS
-- ═══════════════════════════════════════════════════════════════

SELECT 'VINCULACIONES CREADAS POR PAQUETE:' as info;

SELECT 
    pk.name as paquete,
    pk.code as codigo_paquete,
    COUNT(ppm.id) as productos_vinculados,
    STRING_AGG(pr.name, ', ' ORDER BY ppm.sort_order) as productos_incluidos
FROM packages_modular pk
LEFT JOIN package_products_modular ppm ON pk.id = ppm.package_id
LEFT JOIN products_modular pr ON ppm.product_id = pr.id
WHERE pk.is_active = true
GROUP BY pk.id, pk.name, pk.code
ORDER BY pk.sort_order;

-- Desglose detallado
SELECT 'DESGLOSE DETALLADO:' as info;

SELECT 
    pk.name as paquete,
    pr.name as producto,
    pr.category as categoria,
    pr.price as precio,
    pr.per_person as por_persona,
    ppm.sort_order as orden
FROM packages_modular pk
JOIN package_products_modular ppm ON pk.id = ppm.package_id
JOIN products_modular pr ON ppm.product_id = pr.id
WHERE pk.is_active = true
ORDER BY pk.sort_order, ppm.sort_order;

-- Total de vinculaciones
SELECT 'TOTAL VINCULACIONES:' as info, COUNT(*) as total FROM package_products_modular;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- INSTRUCCIONES DE USO:
-- ═══════════════════════════════════════════════════════════════
/*
1. Copiar y pegar este script completo en Supabase SQL Editor
2. Ejecutar el script
3. Verificar los resultados en las consultas finales
4. Refrescar el panel de administración
5. Verificar que los paquetes ahora muestren productos incluidos

Si algún paquete no tiene los productos correctos, puedes ajustar
manualmente las condiciones LIKE en las consultas INSERT.
*/ 