-- Script para limpiar duplicados de productos modulares y asignar categoría Sistema Reservas
-- Ejecutar DESPUÉS de crear la categoría Sistema Reservas

-- 1. Obtener el ID de la categoría "Sistema Reservas"
DO $$
DECLARE
    system_reservations_category_id BIGINT;
BEGIN
    -- Obtener el ID de la categoría Sistema Reservas
    SELECT id INTO system_reservations_category_id 
    FROM "Category" 
    WHERE name = 'Sistema Reservas';
    
    IF system_reservations_category_id IS NULL THEN
        RAISE EXCEPTION 'La categoría "Sistema Reservas" no existe. Ejecuta primero el script create-system-reservations-category.sql';
    END IF;
    
    -- 2. Limpiar productos modulares duplicados (mantener solo uno por habitación)
    -- Eliminar duplicados basándose en el código de habitación
    DELETE FROM products_modular 
    WHERE id IN (
        SELECT pm.id
        FROM products_modular pm
        WHERE pm.code LIKE 'habitacion_%'
        AND pm.id NOT IN (
            SELECT MIN(pm2.id)
            FROM products_modular pm2
            WHERE pm2.code LIKE 'habitacion_%'
            GROUP BY pm2.code
        )
    );
    
    -- 3. Asignar categoría "Sistema Reservas" a productos reales de habitaciones
    UPDATE "Product" 
    SET categoryid = system_reservations_category_id
    WHERE sku LIKE 'HAB-%';
    
    -- 4. Verificar productos de habitaciones sin categoría asignada
    -- y asignar la categoría Sistema Reservas si no tienen categoría
    UPDATE "Product" 
    SET categoryid = system_reservations_category_id
    WHERE sku LIKE 'HAB-%' AND categoryid IS NULL;
    
    RAISE NOTICE 'Proceso completado. Categoría Sistema Reservas ID: %', system_reservations_category_id;
END $$;

-- 5. Verificar resultados
SELECT 
    'PRODUCTOS REALES CON CATEGORÍA SISTEMA RESERVAS:' as info,
    id,
    sku,
    name,
    unit_price,
    categoryid,
    created_at
FROM "Product" 
WHERE categoryid = (SELECT id FROM "Category" WHERE name = 'Sistema Reservas')
ORDER BY sku;

-- 6. Verificar productos modulares únicos
SELECT 
    'PRODUCTOS MODULARES ÚNICOS:' as info,
    id,
    code,
    name,
    price,
    original_id,
    created_at
FROM products_modular 
WHERE code LIKE 'habitacion_%'
ORDER BY code;

-- 7. Verificar que no hay duplicados
SELECT 
    'VERIFICACIÓN DE DUPLICADOS:' as info,
    code,
    COUNT(*) as cantidad
FROM products_modular 
WHERE code LIKE 'habitacion_%'
GROUP BY code
HAVING COUNT(*) > 1; 