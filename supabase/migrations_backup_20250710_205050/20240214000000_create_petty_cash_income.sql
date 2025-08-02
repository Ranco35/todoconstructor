-- Crear tabla PettyCashIncome para ajustes de efectivo
CREATE TABLE IF NOT EXISTS "PettyCashIncome" (
  "id" SERIAL PRIMARY KEY,
  "sessionId" INTEGER NOT NULL REFERENCES "CashSession"("id") ON DELETE CASCADE,
  "amount" DECIMAL(10,2) NOT NULL CHECK ("amount" > 0),
  "description" TEXT NOT NULL,
  "category" VARCHAR(50) NOT NULL DEFAULT 'Otros',
  "paymentMethod" VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS "PettyCashIncome_sessionId_idx" ON "PettyCashIncome"("sessionId");
CREATE INDEX IF NOT EXISTS "PettyCashIncome_createdAt_idx" ON "PettyCashIncome"("createdAt");
CREATE INDEX IF NOT EXISTS "PettyCashIncome_category_idx" ON "PettyCashIncome"("category");

-- Crear trigger para actualizar updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_petty_cash_income_updated_at 
    BEFORE UPDATE ON "PettyCashIncome" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE "PettyCashIncome" IS 'Tabla para registrar ajustes de efectivo físico (préstamos, reposiciones, reembolsos)';
COMMENT ON COLUMN "PettyCashIncome"."sessionId" IS 'ID de la sesión de caja activa';
COMMENT ON COLUMN "PettyCashIncome"."amount" IS 'Monto del ajuste de efectivo';
COMMENT ON COLUMN "PettyCashIncome"."description" IS 'Descripción del origen del dinero';
COMMENT ON COLUMN "PettyCashIncome"."category" IS 'Tipo de ajuste: Reposición, Préstamo, Reembolso, Depósito, Otros';
COMMENT ON COLUMN "PettyCashIncome"."paymentMethod" IS 'Método de recepción: Efectivo, Transferencia, Tarjeta, Otro';
COMMENT ON COLUMN "PettyCashIncome"."notes" IS 'Notas adicionales sobre el ajuste'; 