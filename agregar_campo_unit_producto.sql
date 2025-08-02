-- Agregar campo unit a la tabla Product
-- Este campo permitirá especificar la unidad de medida del producto (ej: pieza, kg, litro, etc.)

ALTER TABLE "public"."Product" 
ADD COLUMN "unit" TEXT DEFAULT 'Pieza';

-- Comentario para documentar el campo
COMMENT ON COLUMN "public"."Product"."unit" IS 'Unidad de medida del producto (ej: Pieza, Kg, Litro, Metro, etc.)';

-- Crear índice para búsquedas por unidad
CREATE INDEX idx_product_unit ON "public"."Product" USING btree (unit); 