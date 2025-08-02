-- Script para limpiar productos huérfanos en el sistema modular
-- Ejecutar en Supabase: Editor SQL
-- Fecha: 2025-01-02

-- ═══════════════════════════════════════════════════════════════
-- 1. IDENTIFICAR PRODUCTOS HUÉRFANOS
-- ═══════════════════════════════════════════════════════════════

-- 1.1 Productos modulares SIN original_id
SELECT 
  'Productos modulares SIN original_id' as tipo_huerfano,
  pm.id,
  pm.name,
  pm.code,
  pm.category,
  pm.original_id
FROM public.products_modular pm
WHERE pm.original_id IS NULL;

-- 1.2 Productos modulares con original_id que NO existe en Product
SELECT 
  'Productos modulares con original_id INVÁLIDO' as tipo_huerfano,
  pm.id,
  pm.name,
  pm.code,
  pm.original_id as id_inexistente
FROM public.products_modular pm
WHERE pm.original_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public."Product" p 
    WHERE p.id = pm.original_id
  );

-- 1.3 Vinculaciones de paquetes que apuntan a productos inexistentes
SELECT 
  'Vinculaciones de paquetes HUÉRFANAS' as tipo_huerfano,
  ppl.id as linkage_id,
  ppl.package_id,
  ppl.product_id as id_producto_inexistente,
  pkg.name as nombre_paquete
FROM public.product_package_linkage ppl
JOIN public.packages_modular pkg ON ppl.package_id = pkg.id
WHERE NOT EXISTS (
  SELECT 1 FROM public."Product" p 
  WHERE p.id = ppl.product_id
);

-- ═══════════════════════════════════════════════════════════════
-- 2. REPORTAR ESTADO ANTES DE LIMPIEZA
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'REPORTE ANTES DE LIMPIEZA' as seccion,
  '=========================' as separador;

SELECT 
  'products_modular' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN original_id IS NULL THEN 1 END) as sin_original_id,
  COUNT(CASE WHEN original_id IS NOT NULL THEN 1 END) as con_original_id
FROM public.products_modular;

SELECT 
  'product_package_linkage' as tabla,
  COUNT(*) as total_vinculaciones
FROM public.product_package_linkage;

-- ═══════════════════════════════════════════════════════════════
-- 3. LIMPIEZA SEGURA DE PRODUCTOS HUÉRFANOS
-- ═══════════════════════════════════════════════════════════════

-- 3.1 Eliminar vinculaciones de paquetes huérfanas PRIMERO
DELETE FROM public.product_package_linkage 
WHERE NOT EXISTS (
  SELECT 1 FROM public."Product" p 
  WHERE p.id = product_package_linkage.product_id
);

-- 3.2 Eliminar productos modulares con original_id inválido
DELETE FROM public.products_modular
WHERE original_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public."Product" p 
    WHERE p.id = products_modular.original_id
  );

-- 3.3 Eliminar productos modulares SIN original_id (productos independientes)
DELETE FROM public.products_modular
WHERE original_id IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 4. REPORTAR ESTADO DESPUÉS DE LIMPIEZA
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'REPORTE DESPUÉS DE LIMPIEZA' as seccion,
  '============================' as separador;

SELECT 
  'products_modular' as tabla,
  COUNT(*) as total_final,
  COUNT(CASE WHEN original_id IS NULL THEN 1 END) as sin_original_id,
  COUNT(CASE WHEN original_id IS NOT NULL THEN 1 END) as con_original_id_valido
FROM public.products_modular;

SELECT 
  'product_package_linkage' as tabla,
  COUNT(*) as total_vinculaciones_validas
FROM public.product_package_linkage;

-- ═══════════════════════════════════════════════════════════════
-- 5. VERIFICAR INTEGRIDAD FINAL
-- ═══════════════════════════════════════════════════════════════

-- Verificar que TODOS los productos modulares tengan original_id válido
SELECT 
  'VERIFICACIÓN FINAL' as seccion,
  '==================' as separador;

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PERFECTO: No hay productos modulares huérfanos'
    ELSE '❌ ERROR: Aún hay productos modulares huérfanos'
  END as resultado
FROM public.products_modular pm
WHERE pm.original_id IS NULL 
  OR NOT EXISTS (
    SELECT 1 FROM public."Product" p 
    WHERE p.id = pm.original_id
  );

-- Verificar que TODAS las vinculaciones apunten a productos válidos
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PERFECTO: No hay vinculaciones huérfanas'
    ELSE '❌ ERROR: Aún hay vinculaciones huérfanas'
  END as resultado
FROM public.product_package_linkage ppl
WHERE NOT EXISTS (
  SELECT 1 FROM public."Product" p 
  WHERE p.id = ppl.product_id
);

-- ═══════════════════════════════════════════════════════════════
-- 6. MOSTRAR PRODUCTOS MODULARES VÁLIDOS FINALES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'PRODUCTOS MODULARES VÁLIDOS FINALES' as seccion,
  '====================================' as separador;

SELECT 
  pm.id as modular_id,
  pm.code,
  pm.name as nombre_modular,
  pm.category,
  pm.original_id,
  p.name as nombre_producto_real,
  p.saleprice as precio_real
FROM public.products_modular pm
JOIN public."Product" p ON pm.original_id = p.id
ORDER BY pm.category, pm.name;

-- ═══════════════════════════════════════════════════════════════
-- 7. MOSTRAR PAQUETES CON SUS PRODUCTOS VINCULADOS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'PAQUETES CON PRODUCTOS VINCULADOS' as seccion,
  '==================================' as separador;

SELECT 
  pkg.name as paquete,
  pkg.code as codigo_paquete,
  COUNT(ppl.product_id) as productos_vinculados,
  STRING_AGG(p.name, ', ') as nombres_productos
FROM public.packages_modular pkg
LEFT JOIN public.product_package_linkage ppl ON pkg.id = ppl.package_id
LEFT JOIN public."Product" p ON ppl.product_id = p.id
GROUP BY pkg.id, pkg.name, pkg.code
ORDER BY pkg.sort_order;

-- ═══════════════════════════════════════════════════════════════
-- COMENTARIOS FINALES
-- ═══════════════════════════════════════════════════════════════

/*
🧹 LIMPIEZA DE PRODUCTOS HUÉRFANOS COMPLETADA

✅ QUÉ SE ELIMINÓ:
1. Productos modulares sin original_id (productos independientes)
2. Productos modulares con original_id que apunta a productos inexistentes
3. Vinculaciones de paquetes que apuntan a productos inexistentes

✅ QUÉ SE PRESERVÓ:
- Productos modulares con original_id válido
- Vinculaciones de paquetes válidas
- Todos los productos reales en la tabla Product

✅ RESULTADO:
- Sistema modular 100% basado en productos reales
- No más productos huérfanos
- Integridad referencial garantizada

📋 PRÓXIMO PASO:
Aplicar restricciones SQL para prevenir futuros productos huérfanos:

ALTER TABLE public.products_modular 
ADD CONSTRAINT products_modular_must_have_original_id 
CHECK (original_id IS NOT NULL);

ALTER TABLE public.products_modular 
ADD CONSTRAINT fk_products_modular_original_id 
FOREIGN KEY (original_id) REFERENCES public."Product"(id) 
ON DELETE CASCADE;
*/ 