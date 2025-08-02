-- Crear tabla para el historial de inventario físico
CREATE TABLE "InventoryPhysicalHistory" (
    "id" BIGSERIAL PRIMARY KEY,
    "warehouseId" BIGINT NOT NULL REFERENCES "Warehouse"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "comentarios" TEXT,
    "diferencias" JSONB NOT NULL DEFAULT '[]',
    "totalActualizados" INTEGER NOT NULL DEFAULT 0,
    "totalErrores" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX "idx_inventory_physical_history_warehouse" ON "InventoryPhysicalHistory"("warehouseId");
CREATE INDEX "idx_inventory_physical_history_user" ON "InventoryPhysicalHistory"("userId");
CREATE INDEX "idx_inventory_physical_history_fecha" ON "InventoryPhysicalHistory"("fecha");
CREATE INDEX "idx_inventory_physical_history_created_at" ON "InventoryPhysicalHistory"("createdAt");

-- Crear función para actualizar updatedAt automáticamente
CREATE OR REPLACE FUNCTION update_inventory_physical_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updatedAt
CREATE TRIGGER trigger_inventory_physical_history_updated_at
    BEFORE UPDATE ON "InventoryPhysicalHistory"
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_physical_history_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE "InventoryPhysicalHistory" ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad - solo usuarios autenticados pueden ver/insertar
CREATE POLICY "Users can view inventory physical history if authenticated"
    ON "InventoryPhysicalHistory"
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert inventory physical history if authenticated"
    ON "InventoryPhysicalHistory"
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Comentarios para documentar la tabla
COMMENT ON TABLE "InventoryPhysicalHistory" IS 'Tabla para registrar el historial de tomas de inventario físico';
COMMENT ON COLUMN "InventoryPhysicalHistory"."warehouseId" IS 'Bodega donde se realizó la toma de inventario';
COMMENT ON COLUMN "InventoryPhysicalHistory"."userId" IS 'Usuario que realizó la toma de inventario';
COMMENT ON COLUMN "InventoryPhysicalHistory"."fecha" IS 'Fecha y hora de la toma de inventario';
COMMENT ON COLUMN "InventoryPhysicalHistory"."comentarios" IS 'Comentarios generales sobre la toma de inventario';
COMMENT ON COLUMN "InventoryPhysicalHistory"."diferencias" IS 'Array JSON con las diferencias encontradas entre stock actual y contado';
COMMENT ON COLUMN "InventoryPhysicalHistory"."totalActualizados" IS 'Total de productos actualizados en esta toma';
COMMENT ON COLUMN "InventoryPhysicalHistory"."totalErrores" IS 'Total de errores ocurridos durante la toma'; 