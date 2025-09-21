-- Migration: Asegurar que existe la tabla POSProductCategory
-- Fecha: 2025-01-20
-- Descripción: Crear la tabla POSProductCategory si no existe para solucionar el error del POS

-- Crear la tabla POSProductCategory si no existe
CREATE TABLE IF NOT EXISTS "POSProductCategory" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "icon" TEXT,
  "color" TEXT,
  "cashRegisterTypeId" BIGINT REFERENCES "CashRegisterType"("id"),
  "sortOrder" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS "idx_pos_product_category_register_type" 
ON "POSProductCategory"("cashRegisterTypeId");

CREATE INDEX IF NOT EXISTS "idx_pos_product_category_active" 
ON "POSProductCategory"("isActive") 
WHERE "isActive" = true;

-- Insertar categorías para Ferretería (tipo 1 - Recepción adaptado)
INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") VALUES
('herramientas', 'Herramientas y Equipos', '🔧', '#2563EB', 1, 1),
('materiales', 'Materiales de Construcción', '🧱', '#059669', 1, 2),
('electricos', 'Productos Eléctricos', '⚡', '#DC2626', 1, 3),
('ferreteria_general', 'Ferretería General', '🛠️', '#7C3AED', 1, 4),
('pinturas', 'Pinturas y Acabados', '🎨', '#EA580C', 1, 5)
ON CONFLICT DO NOTHING;

-- Comentarios descriptivos
COMMENT ON TABLE "POSProductCategory" IS 'Categorías de productos para el sistema POS de ferretería';
COMMENT ON COLUMN "POSProductCategory"."name" IS 'Nombre interno de la categoría (slug)';
COMMENT ON COLUMN "POSProductCategory"."displayName" IS 'Nombre para mostrar en la interfaz';
COMMENT ON COLUMN "POSProductCategory"."icon" IS 'Icono emoji para la categoría';
COMMENT ON COLUMN "POSProductCategory"."color" IS 'Color hexadecimal para la categoría';
COMMENT ON COLUMN "POSProductCategory"."cashRegisterTypeId" IS 'Tipo de caja registradora: 1=Ferretería';
COMMENT ON COLUMN "POSProductCategory"."sortOrder" IS 'Orden de visualización en la interfaz';
COMMENT ON COLUMN "POSProductCategory"."isActive" IS 'Si la categoría está activa y visible';

