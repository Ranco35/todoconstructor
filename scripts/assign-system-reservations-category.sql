-- Script para asignar categoría "Sistema Reservas" a productos de habitaciones existentes

-- 1. Obtener ID de la categoría "Sistema Reservas"
WITH system_category AS (
    SELECT id FROM categories WHERE name = 'Sistema Reservas'
)

-- 2. Actualizar productos de habitaciones existentes
UPDATE "Product" 
SET 
    category_id = (SELECT id FROM system_category),
    updated_at = NOW()
WHERE 
    sku LIKE 'HAB-%' 
    AND (category_id IS NULL OR category_id != (SELECT id FROM system_category));

-- 3. Verificar productos actualizados
SELECT 
    p.id,
    p.sku,
    p.name,
    p.category_id,
    c.name as category_name,
    p.unit_price,
    p.created_at,
    p.updated_at
FROM "Product" p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.sku LIKE 'HAB-%'
ORDER BY p.sku;

-- 4. Mostrar estadísticas
SELECT 
    COUNT(*) as total_habitaciones,
    COUNT(CASE WHEN category_id IS NOT NULL THEN 1 END) as con_categoria,
    COUNT(CASE WHEN category_id IS NULL THEN 1 END) as sin_categoria
FROM "Product" 
WHERE sku LIKE 'HAB-%'; 