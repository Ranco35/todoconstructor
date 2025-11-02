-- ============================================
-- CREAR TABLA POSSalePayment
-- ============================================

-- Crear tabla de pagos de ventas POS
CREATE TABLE IF NOT EXISTS "POSSalePayment" (
  "id" BIGSERIAL PRIMARY KEY,
  "saleId" BIGINT NOT NULL REFERENCES "POSSale"("id") ON DELETE CASCADE,
  "paymentMethod" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "receivedAmount" DECIMAL(10,2),
  "changeAmount" DECIMAL(10,2) DEFAULT 0,
  "cardReference" TEXT,
  "bankReference" TEXT,
  "cardLast4" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS "idx_pos_sale_payment_sale" ON "POSSalePayment"("saleId");
CREATE INDEX IF NOT EXISTS "idx_pos_sale_payment_method" ON "POSSalePayment"("paymentMethod");

-- Habilitar RLS
ALTER TABLE "POSSalePayment" ENABLE ROW LEVEL SECURITY;

-- Crear política RLS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "POSSalePayment";
CREATE POLICY "Allow all for authenticated users" ON "POSSalePayment" 
FOR ALL TO authenticated USING (true);

-- Crear trigger para actualizar campos de POSSale automáticamente
CREATE OR REPLACE FUNCTION update_pos_sale_payment_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Actualizar totales de pago en POSSale
    UPDATE "POSSale"
    SET 
        "paidAmount" = (
            SELECT COALESCE(SUM("amount"), 0) 
            FROM "POSSalePayment" 
            WHERE "saleId" = NEW."saleId"
        ),
        "pendingAmount" = "total" - (
            SELECT COALESCE(SUM("amount"), 0) 
            FROM "POSSalePayment" 
            WHERE "saleId" = NEW."saleId"
        ),
        "paymentStatus" = CASE 
            WHEN (
                SELECT COALESCE(SUM("amount"), 0) 
                FROM "POSSalePayment" 
                WHERE "saleId" = NEW."saleId"
            ) >= "total" THEN 'paid'
            WHEN (
                SELECT COALESCE(SUM("amount"), 0) 
                FROM "POSSalePayment" 
                WHERE "saleId" = NEW."saleId"
            ) > 0 THEN 'partial'
            ELSE 'pending'
        END
    WHERE "id" = NEW."saleId";
    
    RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_payment_totals ON "POSSalePayment";
CREATE TRIGGER trigger_update_payment_totals
AFTER INSERT OR UPDATE OR DELETE ON "POSSalePayment"
FOR EACH ROW
EXECUTE FUNCTION update_pos_sale_payment_totals();

-- Refrescar schema cache
NOTIFY pgrst, 'reload schema';

-- Verificar creación
SELECT 
    '✅ TABLA POSSalePayment CREADA' as titulo;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'POSSalePayment'
ORDER BY ordinal_position;

SELECT '✅ Sistema de pagos múltiples listo' as resultado;

