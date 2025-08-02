-- ═══════════════════════════════════════════════════════════════
-- SCRIPT ALTERNATIVO: VINCULACIONES CON CÓDIGOS EXACTOS
-- ═══════════════════════════════════════════════════════════════
-- Usando los códigos exactos encontrados en el sistema actual
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- LIMPIAR TABLA
DELETE FROM package_products_modular;

-- VERIFICAR PRODUCTOS DISPONIBLES PRIMERO
SELECT 'PRODUCTOS EXISTENTES (no habitaciones):' as info;
SELECT id, code, name, category, price, per_person 
FROM products_modular 
WHERE category != 'alojamiento' 
ORDER BY category, name;

-- ═══════════════════════════════════════════════════════════════
-- VINCULACIONES CON CÓDIGOS EXACTOS
-- ═══════════════════════════════════════════════════════════════

-- PAQUETE: SOLO ALOJAMIENTO
-- Solo servicios básicos (si hay algún producto que sea gratis)
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT pk.id, pr.id, true, 1
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'SOLO_ALOJAMIENTO' 
AND pr.price = 0  -- Solo productos gratuitos
AND pr.category != 'alojamiento';

-- PAQUETE: DESAYUNO  
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT pk.id, pr.id, true, 
    CASE 
        WHEN pr.code = 'desayuno_buffet_254' THEN 1
        WHEN pr.code = 'piscina_termal_adult_257' THEN 2
        ELSE 3
    END
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'DESAYUNO' 
AND pr.code IN ('desayuno_buffet_254', 'piscina_termal_adult_257');

-- PAQUETE: MEDIA PENSIÓN
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT pk.id, pr.id, true,
    CASE 
        WHEN pr.code = 'desayuno_buffet_254' THEN 1
        WHEN pr.code = 'almuerzo_programa_255' THEN 2  
        WHEN pr.code = 'piscina_termal_adult_257' THEN 3
        ELSE 4
    END
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'MEDIA_PENSION' 
AND pr.code IN ('desayuno_buffet_254', 'almuerzo_programa_255', 'piscina_termal_adult_257');

-- PAQUETE: TODO INCLUIDO
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT pk.id, pr.id, true,
    CASE 
        WHEN pr.code = 'desayuno_buffet_254' THEN 1
        WHEN pr.code = 'almuerzo_programa_255' THEN 2
        WHEN pr.code = 'cena_alojados_256' THEN 3
        WHEN pr.code = 'once_buffet_271' THEN 4
        WHEN pr.code = 'piscina_termal_adult_257' THEN 5
        ELSE 6
    END
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'TODO_INCLUIDO' 
AND pr.code IN (
    'desayuno_buffet_254', 
    'almuerzo_programa_255', 
    'cena_alojados_256',
    'once_buffet_271',
    'piscina_termal_adult_257'
);

-- PAQUETE PERSONALIZADO: PKG-MEDIA-PENSIÓM-1751818074581
INSERT INTO package_products_modular (package_id, product_id, is_included, sort_order)
SELECT pk.id, pr.id, true,
    CASE 
        WHEN pr.code = 'desayuno_buffet_254' THEN 1
        WHEN pr.code = 'almuerzo_programa_255' THEN 2  
        WHEN pr.code = 'piscina_termal_adult_257' THEN 3
        ELSE 4
    END
FROM packages_modular pk, products_modular pr 
WHERE pk.code = 'PKG-MEDIA-PENSIÓM-1751818074581' 
AND pr.code IN ('desayuno_buffet_254', 'almuerzo_programa_255', 'piscina_termal_adult_257');

-- ═══════════════════════════════════════════════════════════════
-- VERIFICAR RESULTADOS
-- ═══════════════════════════════════════════════════════════════

SELECT 'RESUMEN DE VINCULACIONES:' as info;

SELECT 
    pk.name as "Paquete",
    pk.code as "Código",
    COUNT(ppm.id) as "Productos",
    COALESCE(
        STRING_AGG(
            pr.name || ' ($' || pr.price::text || ')', 
            ', ' ORDER BY ppm.sort_order
        ), 
        'Sin productos'
    ) as "Productos Incluidos"
FROM packages_modular pk
LEFT JOIN package_products_modular ppm ON pk.id = ppm.package_id AND ppm.is_included = true
LEFT JOIN products_modular pr ON ppm.product_id = pr.id
GROUP BY pk.id, pk.name, pk.code
ORDER BY pk.id;

-- DESGLOSE POR PAQUETE
SELECT 'DESGLOSE COMPLETO:' as info;

SELECT 
    pk.name as "Paquete",
    pr.name as "Producto", 
    pr.category as "Categoría",
    '$' || pr.price::text as "Precio",
    CASE WHEN pr.per_person THEN 'Por persona' ELSE 'Fijo' END as "Tipo Precio",
    ppm.sort_order as "Orden"
FROM packages_modular pk
JOIN package_products_modular ppm ON pk.id = ppm.package_id
JOIN products_modular pr ON ppm.product_id = pr.id
WHERE ppm.is_included = true
ORDER BY pk.name, ppm.sort_order;

-- TOTAL
SELECT 'TOTAL VINCULACIONES CREADAS:' as info, COUNT(*) as total 
FROM package_products_modular WHERE is_included = true;

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- NOTAS:
-- ═══════════════════════════════════════════════════════════════
/*
Este script usa los códigos exactos encontrados en el sistema:
- desayuno_buffet_254 (Desayuno Buffet) - $15,000
- almuerzo_programa_255 (Almuerzo Programa) - $15,000  
- cena_alojados_256 (Cena Alojados) - $30,000
- piscina_termal_adult_257 (Piscina Termal Adulto) - $22,000
- once_buffet_271 (Once Buffet) - $18,000

Si algún producto no se encuentra, la vinculación simplemente no se creará.
Después de ejecutar, refrescar el panel de administración.
*/ 