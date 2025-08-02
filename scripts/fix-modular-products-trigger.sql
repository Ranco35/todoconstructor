-- Script para recrear el trigger de productos modulares
-- Ejecutar en Supabase SQL Editor

-- 1. Crear la función del trigger
CREATE OR REPLACE FUNCTION public.create_modular_product_if_not_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear si no existe ya un producto modular con ese original_id
  IF NOT EXISTS (
    SELECT 1 FROM public.products_modular WHERE original_id = NEW.product_id
  ) THEN
    -- Insertar el producto modular basado en el producto real
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
    WHERE p.id = NEW.product_id;
    
    -- Log para debug
    RAISE NOTICE 'Producto modular creado automáticamente para product_id: %', NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trg_create_modular_product ON public.product_package_linkage;

-- 3. Crear el nuevo trigger
CREATE TRIGGER trg_create_modular_product
  AFTER INSERT ON public.product_package_linkage
  FOR EACH ROW
  EXECUTE FUNCTION public.create_modular_product_if_not_exists();

-- 4. Poblar productos modulares para vinculaciones existentes
INSERT INTO public.products_modular (
  original_id, 
  is_active, 
  category, 
  code, 
  name,
  created_at, 
  updated_at
)
SELECT DISTINCT
  p.id,
  TRUE,
  COALESCE(c.name, 'Sin Categoría'),
  COALESCE(p.model, 'PROD-' || p.id),
  p.name,
  NOW(),
  NOW()
FROM public.product_package_linkage ppl
JOIN public."Product" p ON p.id = ppl.product_id
LEFT JOIN public."Category" c ON c.id = p.categoryid
WHERE NOT EXISTS (
  SELECT 1 FROM public.products_modular pm WHERE pm.original_id = p.id
);

-- 5. Verificar resultados
SELECT 
  'Productos modulares creados:' as mensaje,
  COUNT(*) as total
FROM public.products_modular;

SELECT 
  'Vinculaciones existentes:' as mensaje,
  COUNT(*) as total
FROM public.product_package_linkage;

-- 6. Mostrar productos modulares creados
SELECT 
  pm.id,
  pm.original_id,
  pm.name,
  pm.category,
  pm.code,
  pm.is_active
FROM public.products_modular pm
ORDER BY pm.id; 