-- Agregar columna parentId a la tabla Warehouse para jerarquías
ALTER TABLE "Warehouse" 
ADD COLUMN "parentId" BIGINT;

-- Agregar índice para mejorar el rendimiento de consultas de jerarquía
CREATE INDEX "idx_warehouse_parent_id" ON "Warehouse" ("parentId");

-- Agregar restricción de clave foránea para mantener integridad referencial
ALTER TABLE "Warehouse" 
ADD CONSTRAINT "fk_warehouse_parent" 
FOREIGN KEY ("parentId") REFERENCES "Warehouse" ("id") 
ON DELETE SET NULL;

-- Agregar comentario para documentar el propósito de la columna
COMMENT ON COLUMN "Warehouse"."parentId" IS 'Referencia a la bodega padre para crear jerarquías. NULL significa que es una bodega raíz.';

-- Actualizar la columna updatedAt cuando se modifique parentId
CREATE OR REPLACE FUNCTION update_warehouse_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updatedAt automáticamente
DROP TRIGGER IF EXISTS trigger_update_warehouse_updated_at ON "Warehouse";
CREATE TRIGGER trigger_update_warehouse_updated_at
    BEFORE UPDATE ON "Warehouse"
    FOR EACH ROW
    EXECUTE FUNCTION update_warehouse_updated_at(); 