-- Migración para agregar campo isPOSEnabled a tabla Product
-- Fecha: 2025-01-15
-- Descripción: Agrega campo para habilitar productos en el sistema POS

-- Agregar columna isPOSEnabled a la tabla Product si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' 
        AND column_name = 'isPOSEnabled'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "isPOSEnabled" BOOLEAN DEFAULT false;
        
        -- Comentario para documentar el campo
        COMMENT ON COLUMN "Product"."isPOSEnabled" IS 'Indica si el producto está habilitado para usar en el sistema POS';
        
        -- Crear índice para mejorar rendimiento en consultas POS
        CREATE INDEX IF NOT EXISTS "idx_product_pos_enabled" ON "Product"("isPOSEnabled") WHERE "isPOSEnabled" = true;
        
        -- Log de la migración
        RAISE NOTICE 'Campo isPOSEnabled agregado a tabla Product';
    ELSE
        RAISE NOTICE 'Campo isPOSEnabled ya existe en tabla Product';
    END IF;
END $$; 