-- ═══════════════════════════════════════════════════════════════
-- SCRIPT: Corregir categoría de Habitación Doble
-- PROPÓSITO: Mover Habitación Doble de "servicios" a "alojamiento"
-- FECHA: 2025-01-02
-- ═══════════════════════════════════════════════════════════════

-- Corregir la categoría del producto "Habitacion Doble"
UPDATE products_modular 
SET category = 'alojamiento'
WHERE name ILIKE '%habitacion%' 
   AND category = 'servicios';

-- Verificar el cambio
SELECT id, code, name, category, original_id
FROM products_modular 
WHERE name ILIKE '%habitacion%'
ORDER BY id; 