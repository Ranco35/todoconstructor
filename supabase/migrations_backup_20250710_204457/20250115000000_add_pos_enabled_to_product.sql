-- Migración: Agregar campo isPOSEnabled a la tabla Product
-- Descripción: Agrega un campo booleano para marcar productos que se pueden vender en el punto de venta (POS)

-- Agregar campo isPOSEnabled a la tabla Product
ALTER TABLE "Product" 
ADD COLUMN "isPOSEnabled" BOOLEAN DEFAULT false;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN "Product"."isPOSEnabled" IS 'Indica si el producto está habilitado para venta en punto de venta (POS)';

-- Crear índice para mejorar consultas de productos habilitados para POS
CREATE INDEX IF NOT EXISTS "idx_product_pos_enabled" ON "Product"("isPOSEnabled");

-- Actualizar productos existentes que tengan un registro en POSProduct para marcarlos como habilitados
UPDATE "Product" 
SET "isPOSEnabled" = true 
WHERE id IN (
    SELECT DISTINCT "productId" 
    FROM "POSProduct" 
    WHERE "productId" IS NOT NULL
); 