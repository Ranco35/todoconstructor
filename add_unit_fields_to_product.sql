-- Agregar campos de unidades de medida a la tabla Product
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "salesunitid" INTEGER DEFAULT 1;

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "purchaseunitid" INTEGER DEFAULT 1;

-- Crear índices para mejorar performance en consultas por unidades
CREATE INDEX IF NOT EXISTS "idx_product_sales_unit" ON "Product"("salesunitid");
CREATE INDEX IF NOT EXISTS "idx_product_purchase_unit" ON "Product"("purchaseunitid");

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN "Product"."salesunitid" IS 'ID de la unidad de medida para ventas (referencia a tabla de unidades)';
COMMENT ON COLUMN "Product"."purchaseunitid" IS 'ID de la unidad de medida para compras (referencia a tabla de unidades)';

-- Actualizar productos existentes con valores por defecto
UPDATE "Product" 
SET "salesunitid" = 1, "purchaseunitid" = 1 
WHERE "salesunitid" IS NULL OR "purchaseunitid" IS NULL;

-- Hacer los campos NOT NULL después de actualizar los datos existentes
ALTER TABLE "Product" 
ALTER COLUMN "salesunitid" SET NOT NULL;

ALTER TABLE "Product" 
ALTER COLUMN "purchaseunitid" SET NOT NULL; 