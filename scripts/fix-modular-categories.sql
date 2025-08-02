-- ═══════════════════════════════════════════════════════════════
-- SCRIPT: Corregir categorías de productos modulares
-- PROPÓSITO: Cambiar categorías de BD reales a categorías modulares
-- FECHA: 2025-01-02
-- ═══════════════════════════════════════════════════════════════

-- Corregir productos de restaurante/comida
UPDATE products_modular 
SET category = 'comida'
WHERE category = 'Restaurante Ventas' 
   OR category ILIKE '%restaurante%' 
   OR category ILIKE '%alimentacion%'
   OR category ILIKE '%comida%'
   OR category ILIKE '%bebida%';

-- Corregir productos de alojamiento
UPDATE products_modular 
SET category = 'alojamiento'
WHERE category ILIKE '%alojamiento%' 
   OR category ILIKE '%habitacion%'
   OR category ILIKE '%programa%alojamiento%';

-- Corregir productos de spa
UPDATE products_modular 
SET category = 'spa'
WHERE category ILIKE '%spa%' 
   OR category ILIKE '%masaje%'
   OR category ILIKE '%tratamiento%'
   OR category ILIKE '%termal%';

-- Corregir productos de entretenimiento
UPDATE products_modular 
SET category = 'entretenimiento'
WHERE category ILIKE '%entretenimiento%' 
   OR category ILIKE '%actividad%'
   OR category ILIKE '%recreacion%';

-- Todo lo demás como servicios
UPDATE products_modular 
SET category = 'servicios'
WHERE category NOT IN ('comida', 'alojamiento', 'spa', 'entretenimiento');

-- Verificar resultado
SELECT id, code, name, category, original_id
FROM products_modular 
ORDER BY category, id; 