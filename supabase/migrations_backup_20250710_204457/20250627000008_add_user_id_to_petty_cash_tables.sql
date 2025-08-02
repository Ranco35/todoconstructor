-- Migración para agregar columna userId a tablas de caja chica
-- Fecha: 2025-06-27

-- Agregar columna userId a PettyCashExpense
ALTER TABLE "PettyCashExpense"
ADD COLUMN "userId" uuid REFERENCES "User"("id");

-- Agregar columna userId a PettyCashPurchase  
ALTER TABLE "PettyCashPurchase"
ADD COLUMN "userId" uuid REFERENCES "User"("id");

-- Agregar comentarios para documentación
COMMENT ON COLUMN "PettyCashExpense"."userId" IS 'Usuario que creó el gasto';
COMMENT ON COLUMN "PettyCashPurchase"."userId" IS 'Usuario que creó la compra'; 