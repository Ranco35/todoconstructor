-- ============================================
-- REFRESCAR SCHEMA CACHE MÚLTIPLES VECES
-- ============================================

-- Refrescar 5 veces con pausas
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

SELECT '✅ Schema cache refrescado 3 veces' as resultado;

-- Verificar relación
SELECT 
    '=== FK ENTRE POSSale Y CashSession ===' as titulo;

SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'POSSale'
  AND kcu.column_name = 'sessionId';

