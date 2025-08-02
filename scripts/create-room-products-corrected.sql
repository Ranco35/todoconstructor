-- Script para crear productos reales para todas las habitaciones
-- Ejecutar en Supabase SQL Editor
-- CORREGIDO: Usa la estructura real de la tabla Product

-- Función para generar SKU único
CREATE OR REPLACE FUNCTION generate_room_sku(room_number TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN 'HAB-' || LPAD(room_number, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Crear productos reales para habitaciones que no existen
INSERT INTO "Product" (
  name,
  description,
  sku,
  saleprice,
  costprice,
  vat,
  type,
  brand,
  "createdAt",
  "updatedAt"
)
SELECT 
  'Habitación ' || r.number || ' - ' || r.type as name,
  COALESCE(r.description, 'Habitación ' || r.number || ' de tipo ' || r.type) as description,
  generate_room_sku(r.number::TEXT) as sku,
  r.price_per_night as saleprice,
  r.price_per_night * 0.7 as costprice, -- Costo estimado al 70% del precio
  19 as vat,
  'SERVICIO' as type,
  'Hotel Termas' as brand,
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM rooms r
WHERE r.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM "Product" p 
    WHERE p.sku = generate_room_sku(r.number::TEXT)
       OR p.name ILIKE '%' || r.number || '%'
  );

-- Actualizar productos existentes con precios actualizados
UPDATE "Product" p
SET 
  saleprice = r.price_per_night,
  costprice = r.price_per_night * 0.7,
  description = COALESCE(r.description, 'Habitación ' || r.number || ' de tipo ' || r.type),
  "updatedAt" = NOW()
FROM rooms r
WHERE (p.sku = generate_room_sku(r.number::TEXT) OR p.name ILIKE '%' || r.number || '%')
  AND r.is_active = true
  AND p.saleprice != r.price_per_night;

-- Mostrar resumen
SELECT 
  'Productos creados' as accion,
  COUNT(*) as cantidad
FROM "Product" p
WHERE p.sku LIKE 'HAB-%'
  AND p."createdAt" >= NOW() - INTERVAL '1 minute'

UNION ALL

SELECT 
  'Productos actualizados' as accion,
  COUNT(*) as cantidad
FROM "Product" p
WHERE p.sku LIKE 'HAB-%'
  AND p."updatedAt" >= NOW() - INTERVAL '1 minute'
  AND p."createdAt" < p."updatedAt";

-- Mostrar todos los productos de habitaciones
SELECT 
  p.id,
  p.sku,
  p.name,
  p.saleprice as price,
  p.costprice as cost,
  p.type,
  p."createdAt"
FROM "Product" p
WHERE p.sku LIKE 'HAB-%'
ORDER BY p.sku; 