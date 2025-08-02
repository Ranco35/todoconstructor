-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Sistema de Unidades de Medida Personalizables
-- Fecha: 2025-01-24
-- Descripción: Crea tabla para gestión de unidades de medida con fórmulas de conversión
-- ═══════════════════════════════════════════════════════════════

-- Tabla principal de unidades de medida
CREATE TABLE IF NOT EXISTS "UnitMeasure" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,                    -- Nombre de la unidad (ej: "Jaba de 24")
  "abbreviation" TEXT NOT NULL UNIQUE,     -- Abreviatura (ej: "JAB24", "UND", "KG")
  "description" TEXT,                      -- Descripción detallada
  "isActive" BOOLEAN DEFAULT true,         -- Estado activo/inactivo
  "isDefault" BOOLEAN DEFAULT false,       -- Es unidad del sistema (no editable)
  
  -- Campos para conversión
  "baseUnitId" BIGINT REFERENCES "UnitMeasure"("id"), -- Unidad base para conversión
  "conversionFactor" DECIMAL(10,4) DEFAULT 1.0,       -- Factor de conversión a la unidad base
  "conversionFormula" TEXT,                           -- Fórmula personalizada (ej: "1 jaba = 24 unidades")
  
  -- Clasificación
  "category" TEXT DEFAULT 'general',       -- Categoría: peso, volumen, longitud, empaque, cantidad
  "unitType" TEXT DEFAULT 'standard',      -- Tipo: standard, compound, custom
  
  -- Metadatos
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" UUID REFERENCES auth.users(id),
  "notes" TEXT                             -- Notas adicionales
);

-- Crear índices para mejores consultas
CREATE INDEX IF NOT EXISTS "idx_unit_measure_abbreviation" ON "UnitMeasure"("abbreviation");
CREATE INDEX IF NOT EXISTS "idx_unit_measure_category" ON "UnitMeasure"("category");
CREATE INDEX IF NOT EXISTS "idx_unit_measure_active" ON "UnitMeasure"("isActive");
CREATE INDEX IF NOT EXISTS "idx_unit_measure_base_unit" ON "UnitMeasure"("baseUnitId");

-- Insertar unidades de medida básicas del sistema
INSERT INTO "UnitMeasure" ("name", "abbreviation", "description", "isDefault", "category", "conversionFactor", "baseUnitId") VALUES
-- Unidades básicas (sin conversión, son base)
('Unidad', 'UND', 'Unidad individual', true, 'cantidad', 1.0, NULL),
('Gramo', 'GR', 'Gramo - unidad base de peso', true, 'peso', 1.0, NULL),
('Mililitro', 'ML', 'Mililitro - unidad base de volumen', true, 'volumen', 1.0, NULL),
('Centímetro', 'CM', 'Centímetro - unidad base de longitud', true, 'longitud', 1.0, NULL);

-- Obtener IDs de las unidades base para las conversiones
WITH base_units AS (
  SELECT id, abbreviation FROM "UnitMeasure" WHERE abbreviation IN ('UND', 'GR', 'ML', 'CM')
)
INSERT INTO "UnitMeasure" ("name", "abbreviation", "description", "isDefault", "category", "conversionFactor", "baseUnitId") 
SELECT * FROM (VALUES
  -- Conversiones de peso (base: GR)
  ('Kilogramo', 'KG', 'Kilogramo (1000 gramos)', true, 'peso', 1000.0, (SELECT id FROM base_units WHERE abbreviation = 'GR')),
  ('Onza', 'ONZ', 'Onza (28.35 gramos)', true, 'peso', 28.35, (SELECT id FROM base_units WHERE abbreviation = 'GR')),
  ('Libra', 'LIB', 'Libra (453.59 gramos)', true, 'peso', 453.59, (SELECT id FROM base_units WHERE abbreviation = 'GR')),
  
  -- Conversiones de volumen (base: ML)
  ('Litro', 'LT', 'Litro (1000 mililitros)', true, 'volumen', 1000.0, (SELECT id FROM base_units WHERE abbreviation = 'ML')),
  ('Galón', 'GAL', 'Galón (3785 mililitros)', true, 'volumen', 3785.0, (SELECT id FROM base_units WHERE abbreviation = 'ML')),
  
  -- Conversiones de longitud (base: CM)
  ('Metro', 'MT', 'Metro (100 centímetros)', true, 'longitud', 100.0, (SELECT id FROM base_units WHERE abbreviation = 'CM')),
  
  -- Conversiones de cantidad (base: UND)
  ('Docena', 'DOC', 'Docena (12 unidades)', true, 'cantidad', 12.0, (SELECT id FROM base_units WHERE abbreviation = 'UND')),
  ('Par', 'PAR', 'Par (2 unidades)', true, 'cantidad', 2.0, (SELECT id FROM base_units WHERE abbreviation = 'UND')),
  ('Media Docena', 'MED', 'Media docena (6 unidades)', true, 'cantidad', 6.0, (SELECT id FROM base_units WHERE abbreviation = 'UND')),
  ('Centena', 'CEN', 'Centena (100 unidades)', true, 'cantidad', 100.0, (SELECT id FROM base_units WHERE abbreviation = 'UND')),
  ('Millar', 'MIL', 'Millar (1000 unidades)', true, 'cantidad', 1000.0, (SELECT id FROM base_units WHERE abbreviation = 'UND')),
  
  -- Unidades de empaque (conversión variable - se maneja por producto)
  ('Caja', 'CAJ', 'Caja (cantidad variable según producto)', true, 'empaque', 1.0, (SELECT id FROM base_units WHERE abbreviation = 'UND')),
  ('Paquete', 'PAQ', 'Paquete (cantidad variable según producto)', true, 'empaque', 1.0, (SELECT id FROM base_units WHERE abbreviation = 'UND')),
  ('Jaba', 'JAB', 'Jaba (cantidad variable según producto)', true, 'empaque', 1.0, (SELECT id FROM base_units WHERE abbreviation = 'UND'))
) AS new_units(name, abbreviation, description, isDefault, category, conversionFactor, baseUnitId);

-- Tabla para conversiones específicas por producto (para casos como jajas de 24, 12, etc.)
CREATE TABLE IF NOT EXISTS "ProductUnitConversion" (
  "id" BIGSERIAL PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "purchaseUnitId" BIGINT NOT NULL REFERENCES "UnitMeasure"("id"),     -- Unidad de compra
  "saleUnitId" BIGINT NOT NULL REFERENCES "UnitMeasure"("id"),         -- Unidad de venta  
  "conversionFactor" DECIMAL(10,4) NOT NULL,                          -- Factor de conversión
  "conversionFormula" TEXT,                                           -- Fórmula descriptiva
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE("productId", "purchaseUnitId", "saleUnitId")
);

-- Índices para la tabla de conversiones por producto
CREATE INDEX IF NOT EXISTS "idx_product_unit_conversion_product" ON "ProductUnitConversion"("productId");
CREATE INDEX IF NOT EXISTS "idx_product_unit_conversion_purchase" ON "ProductUnitConversion"("purchaseUnitId");
CREATE INDEX IF NOT EXISTS "idx_product_unit_conversion_sale" ON "ProductUnitConversion"("saleUnitId");

-- Agregar campos para unidades de medida a la tabla Product (si no existen)
DO $$ 
BEGIN 
  -- Verificar si las columnas ya existen antes de agregarlas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'salesunitid') THEN
    ALTER TABLE "Product" ADD COLUMN "salesunitid" BIGINT REFERENCES "UnitMeasure"("id");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'purchaseunitid') THEN  
    ALTER TABLE "Product" ADD COLUMN "purchaseunitid" BIGINT REFERENCES "UnitMeasure"("id");
  END IF;
END $$;

-- Actualizar productos existentes para usar UND como unidad por defecto
UPDATE "Product" 
SET "salesunitid" = (SELECT id FROM "UnitMeasure" WHERE abbreviation = 'UND' LIMIT 1),
    "purchaseunitid" = (SELECT id FROM "UnitMeasure" WHERE abbreviation = 'UND' LIMIT 1)
WHERE "salesunitid" IS NULL OR "purchaseunitid" IS NULL;

-- Función para calcular conversión automática entre unidades
CREATE OR REPLACE FUNCTION calculate_unit_conversion(
  quantity DECIMAL(10,4),
  from_unit_id BIGINT,
  to_unit_id BIGINT
) RETURNS DECIMAL(10,4) AS $$
DECLARE
  from_unit RECORD;
  to_unit RECORD;
  result DECIMAL(10,4);
BEGIN
  -- Obtener información de las unidades
  SELECT * INTO from_unit FROM "UnitMeasure" WHERE id = from_unit_id;
  SELECT * INTO to_unit FROM "UnitMeasure" WHERE id = to_unit_id;
  
  -- Si alguna unidad no existe, retornar cantidad original
  IF from_unit IS NULL OR to_unit IS NULL THEN
    RETURN quantity;
  END IF;
  
  -- Si son la misma unidad, no hay conversión
  IF from_unit_id = to_unit_id THEN
    RETURN quantity;
  END IF;
  
  -- Si no tienen la misma unidad base, no se puede convertir directamente
  IF from_unit."baseUnitId" IS DISTINCT FROM to_unit."baseUnitId" THEN
    RETURN quantity; -- Retorna cantidad original si no son compatibles
  END IF;
  
  -- Realizar conversión: cantidad -> unidad base -> unidad destino
  result := quantity * from_unit."conversionFactor" / to_unit."conversionFactor";
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp en UnitMeasure
CREATE OR REPLACE FUNCTION update_unit_measure_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_unit_measure_timestamp
  BEFORE UPDATE ON "UnitMeasure"
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_measure_timestamp();

-- Trigger para ProductUnitConversion
CREATE OR REPLACE FUNCTION update_product_unit_conversion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_unit_conversion_timestamp
  BEFORE UPDATE ON "ProductUnitConversion"
  FOR EACH ROW
  EXECUTE FUNCTION update_product_unit_conversion_timestamp();

-- Comentarios en las tablas
COMMENT ON TABLE "UnitMeasure" IS 'Tabla de unidades de medida del sistema con conversiones personalizables';
COMMENT ON TABLE "ProductUnitConversion" IS 'Conversiones específicas por producto entre unidad de compra y venta';

COMMENT ON COLUMN "UnitMeasure"."conversionFactor" IS 'Factor de conversión a la unidad base (ej: 1 KG = 1000 GR, factor = 1000)';
COMMENT ON COLUMN "UnitMeasure"."conversionFormula" IS 'Fórmula descriptiva legible (ej: "1 jaba = 24 unidades")';
COMMENT ON COLUMN "ProductUnitConversion"."conversionFactor" IS 'Factor específico para este producto (ej: 1 jaba de coca-cola = 24 unidades)'; 