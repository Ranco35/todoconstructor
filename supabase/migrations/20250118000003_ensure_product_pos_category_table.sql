-- Migration: Asegurar que existe la tabla ProductPOSCategory
-- Fecha: 2025-01-18
-- Descripción: Tabla para almacenar relaciones entre productos y categorías POS

-- Crear la tabla ProductPOSCategory si no existe
CREATE TABLE IF NOT EXISTS "ProductPOSCategory" (
  "id" BIGSERIAL PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "posCategoryId" BIGINT NOT NULL REFERENCES "POSProductCategory"("id") ON DELETE CASCADE,
  "cashRegisterTypeId" BIGINT NOT NULL REFERENCES "CashRegisterType"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  
  -- Evitar duplicados de la misma combinación
  UNIQUE("productId", "posCategoryId", "cashRegisterTypeId")
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS "idx_product_pos_category_product" 
ON "ProductPOSCategory"("productId");

CREATE INDEX IF NOT EXISTS "idx_product_pos_category_pos" 
ON "ProductPOSCategory"("posCategoryId");

CREATE INDEX IF NOT EXISTS "idx_product_pos_category_register_type" 
ON "ProductPOSCategory"("cashRegisterTypeId");

-- Comentarios descriptivos
COMMENT ON TABLE "ProductPOSCategory" IS 'Relaciones entre productos y categorías POS por tipo de caja registradora (Recepción/Restaurante)';
COMMENT ON COLUMN "ProductPOSCategory"."productId" IS 'ID del producto de la tabla Product';
COMMENT ON COLUMN "ProductPOSCategory"."posCategoryId" IS 'ID de la categoría POS de la tabla POSProductCategory';
COMMENT ON COLUMN "ProductPOSCategory"."cashRegisterTypeId" IS 'Tipo de caja registradora: 1=Recepción, 2=Restaurante'; 