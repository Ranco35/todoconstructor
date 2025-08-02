-- Migración para agregar columna active a la tabla Supplier
-- Fecha: 2025-06-27

-- Agregar columna active a Supplier
ALTER TABLE "Supplier"
ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

-- Crear índice para mejorar el rendimiento de consultas por estado
CREATE INDEX IF NOT EXISTS "idx_supplier_active" ON "Supplier"("active");

-- Agregar comentario para documentación
COMMENT ON COLUMN "Supplier"."active" IS 'Indica si el proveedor está activo en el sistema'; 