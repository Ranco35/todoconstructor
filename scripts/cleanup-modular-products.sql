-- Script para limpiar productos modulares
-- Mantiene solo los productos que están realmente vinculados a paquetes

-- 1. Mostrar productos modulares que están vinculados (NO borrar estos)
SELECT 
  'Productos modulares vinculados a paquetes (NO se borrarán):' as mensaje;

SELECT DISTINCT
  pm.id,
  pm.original_id,
  pm.name,
  pm.category,
  'Vinculado a package_id: ' || ppl.package_id as estado
FROM public.products_modular pm
JOIN public.product_package_linkage ppl ON ppl.product_id = pm.original_id
ORDER BY pm.original_id;

-- 2. Mostrar productos modulares que NO están vinculados (SÍ se borrarán)
SELECT 
  'Productos modulares SIN vincular (SE BORRARÁN):' as mensaje;

SELECT 
  pm.id,
  pm.original_id,
  pm.name,
  pm.category
FROM public.products_modular pm
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_package_linkage ppl 
  WHERE ppl.product_id = pm.original_id
)
ORDER BY pm.original_id;

-- 3. Borrar productos modulares que NO están vinculados a ningún paquete
DELETE FROM public.products_modular
WHERE id IN (
  SELECT pm.id
  FROM public.products_modular pm
  WHERE NOT EXISTS (
    SELECT 1 FROM public.product_package_linkage ppl 
    WHERE ppl.product_id = pm.original_id
  )
);

-- 4. Verificar resultados finales
SELECT 
  'Productos modulares restantes (solo los vinculados):' as mensaje,
  COUNT(*) as total
FROM public.products_modular;

-- 5. Mostrar productos modulares finales
SELECT 
  pm.id,
  pm.original_id,
  pm.name,
  pm.category,
  pm.code,
  pm.is_active
FROM public.products_modular pm
ORDER BY pm.original_id; 