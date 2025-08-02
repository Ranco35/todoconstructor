-- Agregar campo isPOSEnabled a la tabla Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPOSEnabled" BOOLEAN DEFAULT false;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS "idx_product_pos_enabled" ON "Product"("isPOSEnabled") WHERE "isPOSEnabled" = true;

-- Comentario para documentar el campo
COMMENT ON COLUMN "Product"."isPOSEnabled" IS 'Indica si el producto está habilitado para usar en el sistema POS';

-- Verificar que el campo se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Product' AND column_name = 'isPOSEnabled'; 