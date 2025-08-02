-- ================================================
-- ACTUALIZAR SISTEMA POS PARA PAGOS MÚLTIPLES
-- ================================================

-- 1. CREAR TABLA DE PAGOS DE VENTA POS
CREATE TABLE IF NOT EXISTS "POSSalePayment" (
  "id" BIGSERIAL PRIMARY KEY,
  "saleId" BIGINT NOT NULL REFERENCES "POSSale"("id") ON DELETE CASCADE,
  "paymentMethod" TEXT NOT NULL CHECK ("paymentMethod" IN ('cash', 'credit_card', 'debit_card', 'transfer', 'other')),
  "amount" NUMERIC(10,2) NOT NULL CHECK ("amount" > 0),
  "receivedAmount" NUMERIC(10,2),
  "changeAmount" NUMERIC(10,2) DEFAULT 0,
  "cardReference" TEXT,
  "bankReference" TEXT,
  "cardLast4" TEXT CHECK (LENGTH("cardLast4") <= 4),
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para POSSalePayment
CREATE INDEX IF NOT EXISTS "idx_pos_sale_payment_sale_id" ON "POSSalePayment"("saleId");
CREATE INDEX IF NOT EXISTS "idx_pos_sale_payment_method" ON "POSSalePayment"("paymentMethod");
CREATE INDEX IF NOT EXISTS "idx_pos_sale_payment_created_at" ON "POSSalePayment"("createdAt");

-- 2. ACTUALIZAR TABLA POSSale PARA PAGOS MÚLTIPLES
-- Hacer paymentMethod opcional y agregar campos de control de pagos
ALTER TABLE "POSSale" 
  ALTER COLUMN "paymentMethod" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "paidAmount" NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pendingAmount" NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'no_payment' 
    CHECK ("paymentStatus" IN ('no_payment', 'partial_payment', 'paid', 'overpaid')),
  ADD COLUMN IF NOT EXISTS "clientId" BIGINT,
  ADD COLUMN IF NOT EXISTS "discountReason" TEXT;

-- Actualizar registros existentes
UPDATE "POSSale" 
SET 
  "paidAmount" = "total",
  "pendingAmount" = 0,
  "paymentStatus" = 'paid'
WHERE "paymentMethod" IS NOT NULL;

-- 3. FUNCIÓN PARA ACTUALIZAR TOTALES DE PAGO
CREATE OR REPLACE FUNCTION update_pos_sale_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
    total_paid NUMERIC(10,2);
    sale_total NUMERIC(10,2);
    new_pending_amount NUMERIC(10,2);
    new_payment_status TEXT;
BEGIN
    -- Obtener el total de la venta
    SELECT "total" INTO sale_total
    FROM "POSSale"
    WHERE "id" = COALESCE(NEW."saleId", OLD."saleId");
    
    -- Calcular total pagado
    SELECT COALESCE(SUM("amount"), 0) INTO total_paid
    FROM "POSSalePayment"
    WHERE "saleId" = COALESCE(NEW."saleId", OLD."saleId");
    
    -- Calcular monto pendiente
    new_pending_amount := sale_total - total_paid;
    
    -- Determinar estado de pago
    IF total_paid = 0 THEN
        new_payment_status := 'no_payment';
    ELSIF total_paid < sale_total THEN
        new_payment_status := 'partial_payment';
    ELSIF total_paid = sale_total THEN
        new_payment_status := 'paid';
    ELSE
        new_payment_status := 'overpaid';
    END IF;
    
    -- Actualizar la venta
    UPDATE "POSSale"
    SET 
        "paidAmount" = total_paid,
        "pendingAmount" = new_pending_amount,
        "paymentStatus" = new_payment_status,
        "updatedAt" = NOW()
    WHERE "id" = COALESCE(NEW."saleId", OLD."saleId");
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
CREATE TRIGGER trigger_update_pos_sale_payment_totals_insert
    AFTER INSERT ON "POSSalePayment"
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_sale_payment_totals();

CREATE TRIGGER trigger_update_pos_sale_payment_totals_update
    AFTER UPDATE ON "POSSalePayment"
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_sale_payment_totals();

CREATE TRIGGER trigger_update_pos_sale_payment_totals_delete
    AFTER DELETE ON "POSSalePayment"
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_sale_payment_totals();

-- 5. TRIGGER PARA UPDATEDATETIME EN POSSalePayment
CREATE OR REPLACE FUNCTION update_pos_sale_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pos_sale_payment_updated_at
    BEFORE UPDATE ON "POSSalePayment"
    FOR EACH ROW
    EXECUTE FUNCTION update_pos_sale_payment_updated_at();

-- 6. MIGRAR PAGOS EXISTENTES A LA NUEVA TABLA
INSERT INTO "POSSalePayment" ("saleId", "paymentMethod", "amount", "receivedAmount", "changeAmount", "createdAt")
SELECT 
    "id",
    "paymentMethod",
    "total",
    "cashReceived",
    "change",
    "createdAt"
FROM "POSSale"
WHERE "paymentMethod" IS NOT NULL
ON CONFLICT DO NOTHING;

-- 7. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE "POSSalePayment" IS 'Tabla de pagos múltiples para ventas POS';
COMMENT ON COLUMN "POSSale"."paidAmount" IS 'Monto total pagado (calculado automáticamente)';
COMMENT ON COLUMN "POSSale"."pendingAmount" IS 'Monto pendiente de pago (calculado automáticamente)';
COMMENT ON COLUMN "POSSale"."paymentStatus" IS 'Estado del pago: no_payment, partial_payment, paid, overpaid';

-- RLS (Row Level Security)
ALTER TABLE "POSSalePayment" ENABLE ROW LEVEL SECURITY; 