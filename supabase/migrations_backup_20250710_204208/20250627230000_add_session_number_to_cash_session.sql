-- Agrega la columna sessionNumber a CashSession
ALTER TABLE "CashSession"
ADD COLUMN IF NOT EXISTS "sessionNumber" VARCHAR(32);

-- Opcional: poblar con un valor temporal para las existentes
UPDATE "CashSession"
SET "sessionNumber" = 'S-' || id
WHERE "sessionNumber" IS NULL;

-- Opcional: crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS "idx_cash_session_number" ON "CashSession"("sessionNumber"); 