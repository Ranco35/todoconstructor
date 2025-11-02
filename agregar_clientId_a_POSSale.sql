-- ============================================
-- AGREGAR COLUMNA clientId A LA TABLA POSSale
-- ============================================

-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'POSSale' 
        AND column_name = 'clientId'
    ) THEN
        -- Agregar la columna
        ALTER TABLE "POSSale" 
        ADD COLUMN "clientId" BIGINT REFERENCES "Client"("id");
        
        RAISE NOTICE '✅ Columna clientId agregada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ La columna clientId ya existe';
    END IF;
END $$;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS "idx_pos_sale_client" ON "POSSale"("clientId");

-- Verificar la estructura de la tabla
SELECT 
    '=== ESTRUCTURA DE POSSale ===' as titulo;

SELECT 
    column_name as columna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_default
FROM information_schema.columns
WHERE table_name = 'POSSale'
  AND column_name IN ('id', 'sessionId', 'saleNumber', 'customerName', 'clientId', 'total')
ORDER BY ordinal_position;

-- Verificar que funcione
SELECT '✅ Columna clientId lista para usar' as resultado;

