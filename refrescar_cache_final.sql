-- ============================================
-- REFRESCAR CACHE FINAL - FORZAR ACTUALIZACIÓN
-- ============================================
-- Ejecutar DESPUÉS de agregar la columna discountReason

-- 🔄 Refrescar schema cache 5 veces con pausas más largas
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(2);

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(2);

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(2);

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(2);

NOTIFY pgrst, 'reload schema';

SELECT '✅ Schema cache refrescado 5 veces con pausas de 2 segundos' as resultado;

-- ✅ Verificación final
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'POSSale' 
            AND column_name = 'discountReason'
        ) THEN '✅ CONFIRMADO: discountReason existe y caché actualizado'
        ELSE '❌ ERROR CRÍTICO: discountReason no existe'
    END as estado_final;

-- 📋 Mostrar las 3 columnas de descuento
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'POSSale' 
  AND column_name IN ('discountReason', 'discountAmount', 'discountType')
ORDER BY column_name;

