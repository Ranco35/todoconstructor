-- Script para agregar campo discountReason a la tabla POSSale
-- Este script es idempotente y puede ejecutarse múltiples veces sin causar errores

-- Verificar si el campo existe antes de agregarlo
DO $$ 
BEGIN
    -- Intentar agregar la columna discountReason si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'POSSale' 
        AND column_name = 'discountReason'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "public"."POSSale" 
        ADD COLUMN "discountReason" TEXT;
        
        RAISE NOTICE 'Campo discountReason agregado exitosamente a la tabla POSSale';
    ELSE
        RAISE NOTICE 'El campo discountReason ya existe en la tabla POSSale';
    END IF;
END $$;

-- Verificar que el campo fue agregado correctamente
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'POSSale' 
AND column_name = 'discountReason'
AND table_schema = 'public'; 