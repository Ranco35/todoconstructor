-- Agregar campo de imagen a la tabla Category
-- Ejecutar en Supabase SQL Editor

-- Verificar si la columna ya existe
DO $$ 
BEGIN
    -- Agregar columna image si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Category' 
        AND column_name = 'image'
    ) THEN
        ALTER TABLE "Category" ADD COLUMN image TEXT;
        RAISE NOTICE 'Columna image agregada a la tabla Category';
    ELSE
        RAISE NOTICE 'La columna image ya existe en la tabla Category';
    END IF;
END $$;

-- Verificar la estructura actual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Category' 
ORDER BY ordinal_position;
