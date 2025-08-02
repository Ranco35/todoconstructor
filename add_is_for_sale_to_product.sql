-- Agregar campo isForSale a la tabla Product
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "isForSale" BOOLEAN DEFAULT TRUE;

-- Crear índice para mejorar performance en consultas por isForSale
CREATE INDEX IF NOT EXISTS "idx_product_is_for_sale" ON "Product"("isForSale");

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN "Product"."isForSale" IS 'Indica si el producto es para venta al público (TRUE) o para consumo interno/materia prima (FALSE)';

-- Actualizar productos existentes basándose en el tipo
-- Por defecto, todos los productos existentes se consideran para venta
UPDATE "Product" 
SET "isForSale" = TRUE 
WHERE "isForSale" IS NULL;

-- Hacer el campo NOT NULL después de actualizar los datos existentes
ALTER TABLE "Product" 
ALTER COLUMN "isForSale" SET NOT NULL; 