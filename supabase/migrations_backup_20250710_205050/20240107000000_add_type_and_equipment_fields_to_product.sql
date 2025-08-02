-- Migración: Agregar campos de tipo de producto y equipos/máquinas
-- Fecha: 2025-01-01
-- Descripción: Agrega campos necesarios para soportar todos los tipos de producto (CONSUMIBLE, ALMACENABLE, INVENTARIO, SERVICIO, COMBO)
-- y campos específicos para equipos/máquinas del inventario

-- Agregar campo type para el tipo de producto
ALTER TABLE "Product" 
ADD COLUMN "type" VARCHAR(20) NOT NULL DEFAULT 'ALMACENABLE';

-- Agregar campos para equipos/máquinas
ALTER TABLE "Product" 
ADD COLUMN "isEquipment" BOOLEAN DEFAULT FALSE,
ADD COLUMN "model" TEXT,
ADD COLUMN "serialNumber" TEXT,
ADD COLUMN "purchaseDate" DATE,
ADD COLUMN "warrantyExpiration" DATE,
ADD COLUMN "usefulLife" INTEGER,
ADD COLUMN "maintenanceInterval" INTEGER,
ADD COLUMN "lastMaintenance" DATE,
ADD COLUMN "nextMaintenance" DATE,
ADD COLUMN "maintenanceCost" NUMERIC,
ADD COLUMN "maintenanceProvider" TEXT,
ADD COLUMN "currentLocation" TEXT,
ADD COLUMN "responsiblePerson" TEXT,
ADD COLUMN "operationalStatus" TEXT DEFAULT 'OPERATIVO';

-- Crear índice para mejorar performance en consultas por tipo
CREATE INDEX IF NOT EXISTS "idx_product_type" ON "Product"("type");

-- Crear índice para equipos
CREATE INDEX IF NOT EXISTS "idx_product_is_equipment" ON "Product"("isEquipment");

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN "Product"."type" IS 'Tipo de producto: CONSUMIBLE, ALMACENABLE, INVENTARIO, SERVICIO, COMBO';
COMMENT ON COLUMN "Product"."isEquipment" IS 'Indica si el producto es un equipo/máquina';
COMMENT ON COLUMN "Product"."model" IS 'Modelo del equipo/máquina';
COMMENT ON COLUMN "Product"."serialNumber" IS 'Número de serie del equipo';
COMMENT ON COLUMN "Product"."purchaseDate" IS 'Fecha de compra del equipo';
COMMENT ON COLUMN "Product"."warrantyExpiration" IS 'Fecha de expiración de garantía';
COMMENT ON COLUMN "Product"."usefulLife" IS 'Vida útil en meses/años';
COMMENT ON COLUMN "Product"."maintenanceInterval" IS 'Intervalo de mantención en días/meses';
COMMENT ON COLUMN "Product"."lastMaintenance" IS 'Fecha de última mantención';
COMMENT ON COLUMN "Product"."nextMaintenance" IS 'Fecha de próxima mantención';
COMMENT ON COLUMN "Product"."maintenanceCost" IS 'Costo de mantención';
COMMENT ON COLUMN "Product"."maintenanceProvider" IS 'Proveedor de mantención';
COMMENT ON COLUMN "Product"."currentLocation" IS 'Ubicación actual del equipo';
COMMENT ON COLUMN "Product"."responsiblePerson" IS 'Persona responsable del equipo';
COMMENT ON COLUMN "Product"."operationalStatus" IS 'Estado operativo: OPERATIVO, EN_MANTENCION, FUERA_DE_SERVICIO';

-- Actualizar productos existentes para asignar tipo basándose en características
-- Esta lógica replica la función determineProductType() del backend
UPDATE "Product" 
SET "type" = CASE 
    WHEN "saleprice" IS NOT NULL AND "supplierid" IS NULL THEN 'SERVICIO'
    WHEN "supplierid" IS NOT NULL AND "costprice" IS NOT NULL THEN 'CONSUMIBLE'
    WHEN "costprice" IS NOT NULL THEN 'INVENTARIO'
    ELSE 'ALMACENABLE'
END
WHERE "type" = 'ALMACENABLE'; -- Solo actualizar los que tienen el valor por defecto 