-- Script para limpiar productos modulares duplicados
-- Este script elimina productos modulares duplicados manteniendo solo uno por habitación

-- 1. Verificar productos modulares duplicados
SELECT 
    code,
    name,
    COUNT(*) as count
FROM products_modular 
WHERE code LIKE 'habitacion_%'
GROUP BY code, name
HAVING COUNT(*) > 1
ORDER BY code;

-- 2. Eliminar duplicados manteniendo solo el más reciente
DELETE FROM products_modular 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY code ORDER BY created_at DESC) as rn
        FROM products_modular 
        WHERE code LIKE 'habitacion_%'
    ) t 
    WHERE t.rn > 1
);

-- 3. Verificar que se eliminaron los duplicados
SELECT 
    code,
    name,
    COUNT(*) as count
FROM products_modular 
WHERE code LIKE 'habitacion_%'
GROUP BY code, name
HAVING COUNT(*) > 1
ORDER BY code;

-- 4. Mostrar productos modulares finales
SELECT 
    id,
    code,
    name,
    price,
    original_id,
    created_at
FROM products_modular 
WHERE code LIKE 'habitacion_%'
ORDER BY code; 