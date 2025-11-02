-- ============================================
-- CREAR FOREIGN KEY ENTRE POSSale Y CashSession
-- ============================================

-- Verificar si la FK ya existe
SELECT 
    '=== VERIFICANDO FOREIGN KEY ===' as titulo;

SELECT 
    constraint_name,
    table_name,
    column_name
FROM information_schema.key_column_usage
WHERE table_name = 'POSSale' 
  AND column_name = 'sessionId';

-- Eliminar FK si existe (para recrearla correctamente)
ALTER TABLE "POSSale" 
DROP CONSTRAINT IF EXISTS "POSSale_sessionId_fkey";

-- Crear la FK correctamente
ALTER TABLE "POSSale" 
ADD CONSTRAINT "POSSale_sessionId_fkey" 
FOREIGN KEY ("sessionId") REFERENCES "CashSession"("id") 
ON DELETE SET NULL;

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS "idx_pos_sale_session" ON "POSSale"("sessionId");

-- Refrescar schema cache (IMPORTANTE)
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Esperar un momento para que se refresque
SELECT pg_sleep(1);

-- Verificar la FK creada
SELECT 
    '✅ FOREIGN KEY CREADA:' as titulo;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'POSSale'
  AND kcu.column_name = 'sessionId';

SELECT '✅ Foreign Key creada - Schema cache refrescado' as resultado;

