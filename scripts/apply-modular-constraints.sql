-- Script para aplicar restricciones de integridad referencial al sistema modular
-- Ejecutar DESPUÉS de limpiar productos huérfanos
-- Ejecutar en Supabase: Editor SQL

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR ESTADO ANTES DE APLICAR RESTRICCIONES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'VERIFICACIÓN PREVIA' as seccion,
  '===================' as separador;

-- Verificar que no hay productos modulares huérfanos
SELECT 
  COUNT(*) as productos_sin_original_id
FROM public.products_modular 
WHERE original_id IS NULL;

SELECT 
  COUNT(*) as productos_con_original_id_invalido
FROM public.products_modular pm
WHERE pm.original_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public."Product" p 
    WHERE p.id = pm.original_id
  );

-- ═══════════════════════════════════════════════════════════════
-- 2. APLICAR RESTRICCIÓN: ORIGINAL_ID OBLIGATORIO
-- ═══════════════════════════════════════════════════════════════

-- Eliminar restricción existente si existe
ALTER TABLE public.products_modular 
DROP CONSTRAINT IF EXISTS products_modular_must_have_original_id;

-- Aplicar nueva restricción
ALTER TABLE public.products_modular 
ADD CONSTRAINT products_modular_must_have_original_id 
CHECK (original_id IS NOT NULL);

SELECT '✅ Restricción aplicada: original_id es obligatorio' as resultado;

-- ═══════════════════════════════════════════════════════════════
-- 3. APLICAR CLAVE FORÁNEA: INTEGRIDAD REFERENCIAL
-- ═══════════════════════════════════════════════════════════════

-- Eliminar clave foránea existente si existe
ALTER TABLE public.products_modular 
DROP CONSTRAINT IF EXISTS fk_products_modular_original_id;

-- Aplicar nueva clave foránea
ALTER TABLE public.products_modular 
ADD CONSTRAINT fk_products_modular_original_id 
FOREIGN KEY (original_id) REFERENCES public."Product"(id) 
ON DELETE CASCADE;

SELECT '✅ Clave foránea aplicada: integridad referencial garantizada' as resultado;

-- ═══════════════════════════════════════════════════════════════
-- 4. APLICAR RESTRICCIÓN EN VINCULACIONES DE PAQUETES
-- ═══════════════════════════════════════════════════════════════

-- Eliminar clave foránea existente si existe
ALTER TABLE public.product_package_linkage 
DROP CONSTRAINT IF EXISTS fk_product_package_linkage_product_id;

-- Aplicar nueva clave foránea para vinculaciones
ALTER TABLE public.product_package_linkage 
ADD CONSTRAINT fk_product_package_linkage_product_id 
FOREIGN KEY (product_id) REFERENCES public."Product"(id) 
ON DELETE CASCADE;

SELECT '✅ Clave foránea aplicada en vinculaciones de paquetes' as resultado;

-- ═══════════════════════════════════════════════════════════════
-- 5. CREAR ÍNDICES PARA OPTIMIZAR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

-- Índice en original_id para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_products_modular_original_id 
ON public.products_modular(original_id);

-- Índice en product_id para vinculaciones
CREATE INDEX IF NOT EXISTS idx_product_package_linkage_product_id 
ON public.product_package_linkage(product_id);

-- Índice en package_id para vinculaciones
CREATE INDEX IF NOT EXISTS idx_product_package_linkage_package_id 
ON public.product_package_linkage(package_id);

SELECT '✅ Índices creados para optimizar performance' as resultado;

-- ═══════════════════════════════════════════════════════════════
-- 6. VERIFICAR RESTRICCIONES APLICADAS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'VERIFICACIÓN DE RESTRICCIONES' as seccion,
  '=============================' as separador;

-- Mostrar restricciones en products_modular
SELECT 
  conname as nombre_restriccion,
  contype as tipo,
  CASE contype 
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
  END as descripcion_tipo
FROM pg_constraint 
WHERE conrelid = 'public.products_modular'::regclass;

-- Mostrar restricciones en product_package_linkage
SELECT 
  conname as nombre_restriccion,
  contype as tipo,
  CASE contype 
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
  END as descripcion_tipo
FROM pg_constraint 
WHERE conrelid = 'public.product_package_linkage'::regclass;

-- ═══════════════════════════════════════════════════════════════
-- 7. PROBAR RESTRICCIONES (OPCIONAL - COMENTADO POR SEGURIDAD)
-- ═══════════════════════════════════════════════════════════════

/*
-- ⚠️ DESCOMENTAR SOLO PARA PROBAR QUE LAS RESTRICCIONES FUNCIONAN

-- Esta consulta debería FALLAR por la restricción original_id obligatorio
INSERT INTO public.products_modular (code, name) 
VALUES ('TEST-FAIL', 'Producto que debería fallar');

-- Esta consulta debería FALLAR por clave foránea inválida
INSERT INTO public.products_modular (code, name, original_id) 
VALUES ('TEST-FAIL-2', 'Producto con ID inválido', 999999);
*/

-- ═══════════════════════════════════════════════════════════════
-- 8. RESUMEN FINAL
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'RESUMEN DE RESTRICCIONES APLICADAS' as seccion,
  '===================================' as separador;

SELECT '✅ products_modular.original_id es obligatorio (CHECK)' as restriccion
UNION ALL
SELECT '✅ products_modular.original_id → Product.id (FOREIGN KEY)'
UNION ALL  
SELECT '✅ product_package_linkage.product_id → Product.id (FOREIGN KEY)'
UNION ALL
SELECT '✅ Índices creados para optimizar consultas'
UNION ALL
SELECT '✅ Eliminación en cascada configurada';

-- ═══════════════════════════════════════════════════════════════
-- COMENTARIOS FINALES
-- ═══════════════════════════════════════════════════════════════

/*
🔒 RESTRICCIONES DE INTEGRIDAD APLICADAS

✅ BENEFICIOS:
1. Imposible crear productos modulares sin original_id
2. Imposible vincular a productos inexistentes
3. Eliminación automática en cascada
4. Performance optimizada con índices
5. Integridad referencial garantizada

🛡️ PROTECCIONES:
- CHECK: original_id no puede ser NULL
- FOREIGN KEY: original_id debe existir en Product
- FOREIGN KEY: product_id en linkages debe existir en Product
- ON DELETE CASCADE: limpieza automática

📊 ESTADO FINAL:
- Sistema modular 100% seguro
- No más productos huérfanos posibles
- Integridad de datos garantizada
- Performance optimizada

🎯 RESULTADO:
El sistema modular ahora SOLO puede trabajar con productos reales vinculados.
Los productos huérfanos son imposibles debido a las restricciones SQL.
*/ 