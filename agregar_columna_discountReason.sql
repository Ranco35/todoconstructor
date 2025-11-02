-- ============================================
-- AGREGAR COLUMNA discountReason A POSSale
-- ============================================
-- Soluciona: "Could not find the 'discountReason' column of 'POSSale'"

-- 🔍 Primero verificar qué columnas de descuento ya existen
SELECT 
    '=== COLUMNAS DE DESCUENTO ACTUALES ===' as titulo;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'POSSale' 
  AND column_name LIKE '%discount%'
ORDER BY column_name;

-- ➕ Agregar columna discountReason si no existe
DO $$ 
BEGIN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'POSSale' 
        AND column_name = 'discountReason'
    ) THEN
        -- Agregar la columna
        ALTER TABLE "POSSale" 
        ADD COLUMN "discountReason" TEXT;
        
        RAISE NOTICE '✅ Columna discountReason agregada exitosamente';
    ELSE
        RAISE NOTICE '⚠️ La columna discountReason ya existe';
    END IF;
    
    -- Verificar si discountAmount existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'POSSale' 
        AND column_name = 'discountAmount'
    ) THEN
        ALTER TABLE "POSSale" 
        ADD COLUMN "discountAmount" DECIMAL(10,2) DEFAULT 0;
        
        RAISE NOTICE '✅ Columna discountAmount agregada exitosamente';
    ELSE
        RAISE NOTICE '⚠️ La columna discountAmount ya existe';
    END IF;
END $$;

-- 🔍 Verificar que las columnas se agregaron correctamente
SELECT 
    '=== VERIFICACIÓN DESPUÉS DE AGREGAR COLUMNAS ===' as titulo;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'POSSale' 
  AND column_name IN ('discountReason', 'discountAmount', 'discountType')
ORDER BY column_name;

-- 🔄 Refrescar schema cache múltiples veces
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

NOTIFY pgrst, 'reload schema';

SELECT '✅ Schema cache refrescado - Columnas de descuento listas' as resultado;

-- 📊 Mostrar estructura completa actualizada de POSSale
SELECT 
    '=== ESTRUCTURA COMPLETA DE POSSale ===' as titulo;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'POSSale'
ORDER BY ordinal_position;

