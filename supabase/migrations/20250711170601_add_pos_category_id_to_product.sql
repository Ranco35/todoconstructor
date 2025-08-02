-- Migration: Agregar campo posCategoryId a la tabla Product
-- Permite asignar una categoría POS específica a cada producto

-- Agregar el campo posCategoryId a la tabla Product
ALTER TABLE "public"."Product" 
ADD COLUMN "posCategoryId" bigint;

-- Agregar comentario descriptivo al campo
COMMENT ON COLUMN "public"."Product"."posCategoryId" IS 'ID de la categoría POS asignada al producto. Permite categorización específica para el punto de venta.';

-- Agregar restricción de clave foránea
ALTER TABLE "public"."Product" 
ADD CONSTRAINT "Product_posCategoryId_fkey" 
FOREIGN KEY ("posCategoryId") 
REFERENCES "public"."POSProductCategory"(id)
ON DELETE SET NULL;

-- Crear índice para mejorar performance en consultas por categoría POS
CREATE INDEX "idx_product_pos_category" 
ON "public"."Product"("posCategoryId");

-- Crear índice compuesto para optimizar consultas POS (habilitado + categoría)
CREATE INDEX "idx_product_pos_enabled_category" 
ON "public"."Product"("isPOSEnabled", "posCategoryId") 
WHERE "isPOSEnabled" = true;

-- Comentario descriptivo del índice
COMMENT ON INDEX "public"."idx_product_pos_enabled_category" IS 'Índice optimizado para consultas de productos habilitados para POS filtrados por categoría.';

-- MIGRACIÓN: Permitir que un producto esté en varias categorías POS y tipos de caja
-- Crea tabla intermedia ProductPOSCategory

CREATE TABLE IF NOT EXISTS "ProductPOSCategory" (
  id BIGSERIAL PRIMARY KEY,
  productId BIGINT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  posCategoryId BIGINT NOT NULL REFERENCES "POSProductCategory"(id) ON DELETE CASCADE,
  cashRegisterTypeId BIGINT NOT NULL REFERENCES "CashRegisterType"(id) ON DELETE CASCADE,
  UNIQUE (productId, posCategoryId, cashRegisterTypeId)
);

-- NOTA: No elimina aún el campo posCategoryId de Product para mantener compatibilidad temporal.
