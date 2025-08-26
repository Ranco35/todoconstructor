-- Agregar columna para agrupar transferencias múltiples
ALTER TABLE "InventoryMovement"
ADD COLUMN IF NOT EXISTS "batch_id" UUID;

-- Índice para búsquedas eficientes por lote
CREATE INDEX IF NOT EXISTS "InventoryMovement_batch_id_idx"
ON "InventoryMovement"("batch_id");

-- Comentario explicativo
COMMENT ON COLUMN "InventoryMovement"."batch_id"
IS 'UUID para agrupar movimientos que pertenecen a la misma operación de transferencia múltiple';


