-- ============================================
-- REFRESCAR SCHEMA CACHE DE SUPABASE
-- ============================================

-- Opción 1: Notificar a PostgREST que recargue el schema
NOTIFY pgrst, 'reload schema';

-- Opción 2: Forzar reload del schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Verificar que la columna clientId existe
SELECT 
    '✅ Verificando columna clientId en POSSale:' as titulo;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'POSSale' 
  AND column_name = 'clientId';

-- Si aparece la columna, el schema está bien
SELECT '✅ Schema cache refrescado - La columna clientId está lista' as resultado;

