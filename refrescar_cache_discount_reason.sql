-- ============================================
-- REFRESCAR SCHEMA CACHE - COLUMNA discountReason
-- ============================================
-- Este script soluciona el error:
-- "Could not find the 'discountReason' column of 'POSSale' in the schema cache"

-- 🔄 Refrescar schema cache múltiples veces
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

SELECT '✅ Schema cache refrescado 3 veces' as resultado;

-- 🔍 Verificar que la columna discountReason existe en POSSale
SELECT 
    '=== VERIFICACIÓN DE COLUMNA discountReason ===' as titulo;

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'POSSale' 
  AND column_name IN ('discountReason', 'discountAmount', 'discountType')
ORDER BY column_name;

-- 🔍 Verificar TODAS las columnas de POSSale para asegurar que estén en caché
SELECT 
    '=== TODAS LAS COLUMNAS DE POSSale ===' as titulo;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'POSSale'
ORDER BY ordinal_position;

-- ✅ Resultado final
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'POSSale' 
            AND column_name = 'discountReason'
        ) THEN '✅ ÉXITO: La columna discountReason existe y el caché está actualizado'
        ELSE '❌ ERROR: La columna discountReason NO existe en la base de datos'
    END as resultado_final;

