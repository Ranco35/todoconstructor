-- Script para verificar y crear la columna isPOSEnabled si no existe
-- Esta columna es necesaria para determinar qué productos aparecen en el POS

-- 1. Verificar si existe la columna isPOSEnabled
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name = 'isPOSEnabled';

-- 2. Si no existe, crear la columna
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' 
          AND column_name = 'isPOSEnabled'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "isPOSEnabled" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Columna isPOSEnabled creada exitosamente';
    ELSE
        RAISE NOTICE 'La columna isPOSEnabled ya existe';
    END IF;
END $$;

-- 3. Verificar que la columna existe ahora
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name = 'isPOSEnabled';

-- 4. Habilitar productos específicos para POS
UPDATE "Product" 
SET "isPOSEnabled" = true
WHERE id IN (1146, 1174, 1175, 1176, 1177, 1186)  -- Productos Full Day y Once
  AND name ILIKE '%once%' OR name ILIKE '%full day%' OR name ILIKE '%buffet%';

-- 5. Verificar productos habilitados para POS
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    "isPOSEnabled",
    is_active
FROM "Product" 
WHERE "isPOSEnabled" = true
ORDER BY id;

-- 6. Verificar el producto 1146 específicamente
SELECT 
    id,
    name,
    saleprice,
    "finalPrice",
    "isPOSEnabled",
    is_active
FROM "Product" 
WHERE id = 1146; 