-- Script para crear productos reales para todas las habitaciones
-- Ejecutar en Supabase SQL Editor

-- Función para generar SKU único
CREATE OR REPLACE FUNCTION generate_room_sku(room_number TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN 'HAB-' || LPAD(room_number, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Crear productos reales para habitaciones que no existen
INSERT INTO "Product" (
  code,
  name,
  description,
  price,
  category,
  type,
  is_active,
  sku,
  unit,
  vat,
  cost,
  min_stock,
  max_stock,
  current_stock,
  warehouse_id,
  created_at,
  updated_at
)
SELECT 
  'habitacion_' || r.number as code,
  'Habitación ' || r.number || ' - ' || r.type as name,
  COALESCE(r.description, 'Habitación ' || r.number || ' de tipo ' || r.type) as description,
  r.price_per_night as price,
  'Habitaciones' as category,
  'SERVICIO' as type,
  true as is_active,
  generate_room_sku(r.number::TEXT) as sku,
  'noche' as unit,
  19 as vat,
  r.price_per_night * 0.7 as cost, -- Costo estimado al 70% del precio
  0 as min_stock,
  1 as max_stock,
  1 as current_stock,
  1 as warehouse_id, -- Asumiendo que existe una bodega con ID 1
  NOW() as created_at,
  NOW() as updated_at
FROM rooms r
WHERE r.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM "Product" p 
    WHERE p.code = 'habitacion_' || r.number 
       OR p.name ILIKE '%' || r.number || '%'
  );

-- Actualizar productos existentes con precios actualizados
UPDATE "Product" p
SET 
  price = r.price_per_night,
  cost = r.price_per_night * 0.7,
  description = COALESCE(r.description, 'Habitación ' || r.number || ' de tipo ' || r.type),
  updated_at = NOW()
FROM rooms r
WHERE (p.code = 'habitacion_' || r.number OR p.name ILIKE '%' || r.number || '%')
  AND r.is_active = true
  AND p.price != r.price_per_night;

-- Mostrar resumen
SELECT 
  'Productos creados' as accion,
  COUNT(*) as cantidad
FROM "Product" p
WHERE p.code LIKE 'habitacion_%'
  AND p.created_at >= NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
  'Productos actualizados' as accion,
  COUNT(*) as cantidad
FROM "Product" p
WHERE p.code LIKE 'habitacion_%'
  AND p.updated_at >= NOW() - INTERVAL '1 minute'
  AND p.created_at < p.updated_at;

-- Mostrar todos los productos de habitaciones
SELECT 
  p.id,
  p.code,
  p.name,
  p.price,
  p.sku,
  p.is_active
FROM "Product" p
WHERE p.code LIKE 'habitacion_%'
ORDER BY p.code; 