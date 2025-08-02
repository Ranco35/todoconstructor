-- Migración para agregar columna vat a la tabla Supplier
-- Fecha: 2025-06-28

-- Agregar columna vat a Supplier
ALTER TABLE "Supplier"
ADD COLUMN IF NOT EXISTS "vat" TEXT;

-- Crear índice para mejorar el rendimiento de consultas por VAT
CREATE INDEX IF NOT EXISTS "idx_supplier_vat" ON "Supplier"("vat");

-- Agregar comentario para documentación
COMMENT ON COLUMN "Supplier"."vat" IS 'Número de VAT/RUT del proveedor para identificación fiscal'; 