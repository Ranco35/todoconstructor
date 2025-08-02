-- Script para poblar TODOS los productos como productos modulares
-- Esto permitirá que aparezcan en la lista de productos disponibles para vincular

-- Insertar todos los productos de la tabla Product como productos modulares
INSERT INTO public.products_modular (
  original_id, 
  is_active, 
  category, 
  code, 
  name,
  created_at, 
  updated_at
)
SELECT
  p.id,
  TRUE,
  COALESCE(c.name, 'Sin Categoría'),
  COALESCE(p.model, 'PROD-' || p.id),
  p.name,
  NOW(),
  NOW()
FROM public."Product" p
LEFT JOIN public."Category" c ON c.id = p.categoryid
WHERE NOT EXISTS (
  SELECT 1 FROM public.products_modular pm WHERE pm.original_id = p.id
)
ORDER BY p.id;

-- Verificar cuántos productos modulares se crearon
SELECT 
  'Productos modulares totales:' as mensaje,
  COUNT(*) as total
FROM public.products_modular;

-- Mostrar todos los productos modulares creados
SELECT 
  pm.id,
  pm.original_id,
  pm.name,
  pm.category,
  pm.code,
  pm.is_active
FROM public.products_modular pm
ORDER BY pm.original_id; 