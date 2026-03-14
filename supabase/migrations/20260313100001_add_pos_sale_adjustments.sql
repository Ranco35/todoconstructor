-- ================================================
-- POS: Ajustes (Refund/Credit) con trazabilidad
-- Descripción: Tabla de ajustes + recálculo de totales
-- ================================================

-- 1) Tabla de ajustes (refund/credit) por venta/ítem
CREATE TABLE IF NOT EXISTS "POSSaleAdjustment" (
  "id" BIGSERIAL PRIMARY KEY,
  "saleId" BIGINT NOT NULL REFERENCES "POSSale"("id") ON DELETE RESTRICT,
  "saleItemId" BIGINT REFERENCES "POSSaleItem"("id") ON DELETE SET NULL,
  "productId" BIGINT REFERENCES "POSProduct"("id") ON DELETE SET NULL,
  "adjustmentType" TEXT NOT NULL CHECK ("adjustmentType" IN ('REFUND', 'CREDIT')),
  "quantity" INTEGER NOT NULL CHECK ("quantity" > 0),
  "unitPrice" NUMERIC(10,2) NOT NULL CHECK ("unitPrice" >= 0),
  "amount" NUMERIC(10,2) NOT NULL CHECK ("amount" >= 0),
  "refundMethod" TEXT NULL CHECK ("refundMethod" IN ('cash', 'credit_card', 'debit_card', 'transfer', 'other', 'wallet')),
  "affectsPaidAmount" BOOLEAN NOT NULL DEFAULT TRUE,
  "reason" TEXT NOT NULL,
  "createdBy" UUID NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "POSSaleAdjustment_type_affectsPaid_check"
    CHECK (
      ("adjustmentType" = 'REFUND' AND "affectsPaidAmount" = TRUE)
      OR
      ("adjustmentType" = 'CREDIT' AND "affectsPaidAmount" = FALSE)
    )
);

CREATE INDEX IF NOT EXISTS "POSSaleAdjustment_saleId_idx" ON "POSSaleAdjustment" ("saleId");
CREATE INDEX IF NOT EXISTS "POSSaleAdjustment_saleItemId_idx" ON "POSSaleAdjustment" ("saleItemId");
CREATE INDEX IF NOT EXISTS "POSSaleAdjustment_createdAt_idx" ON "POSSaleAdjustment" ("createdAt");

COMMENT ON TABLE "POSSaleAdjustment" IS 'Ajustes de venta POS (refund/credit) con trazabilidad';
COMMENT ON COLUMN "POSSaleAdjustment"."affectsPaidAmount" IS 'TRUE: reduce paidAmount (refund cash/card). FALSE: solo reduce total (credito)';

-- 2) RLS
ALTER TABLE "POSSaleAdjustment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "POSSaleAdjustment_select" ON "POSSaleAdjustment"
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "POSSaleAdjustment_insert" ON "POSSaleAdjustment"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "POSSaleAdjustment_update" ON "POSSaleAdjustment"
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "POSSaleAdjustment_delete" ON "POSSaleAdjustment"
  FOR DELETE USING (auth.role() = 'authenticated');

-- 3) Función base para recálculo de totales
CREATE OR REPLACE FUNCTION public.recalc_pos_sale_totals(p_sale_id BIGINT)
RETURNS VOID AS $$
DECLARE
  sale_total NUMERIC(10,2);
  payments_total NUMERIC(10,2);
  adjustments_total NUMERIC(10,2);
  paid_adjustments_total NUMERIC(10,2);
  adjusted_total NUMERIC(10,2);
  net_paid NUMERIC(10,2);
  pending_amount NUMERIC(10,2);
  new_status TEXT;
BEGIN
  SELECT "total" INTO sale_total
  FROM "POSSale"
  WHERE "id" = p_sale_id;

  IF sale_total IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM("amount"), 0) INTO payments_total
  FROM "POSSalePayment"
  WHERE "saleId" = p_sale_id;

  SELECT COALESCE(SUM("amount"), 0) INTO adjustments_total
  FROM "POSSaleAdjustment"
  WHERE "saleId" = p_sale_id;

  SELECT COALESCE(SUM("amount"), 0) INTO paid_adjustments_total
  FROM "POSSaleAdjustment"
  WHERE "saleId" = p_sale_id
    AND "affectsPaidAmount" = TRUE;

  adjusted_total := GREATEST(0, sale_total - adjustments_total);
  net_paid := GREATEST(0, payments_total - paid_adjustments_total);
  pending_amount := GREATEST(0, adjusted_total - net_paid);

  IF pending_amount <= 0.01 THEN
    new_status := 'paid';
  ELSE
    new_status := 'no_payment';
  END IF;

  UPDATE "POSSale"
  SET
    "paidAmount" = net_paid,
    "pendingAmount" = pending_amount,
    "paymentStatus" = new_status,
    "updatedAt" = NOW()
  WHERE "id" = p_sale_id;
END;
$$ LANGUAGE plpgsql;

-- 4) Triggers para recálculo
CREATE OR REPLACE FUNCTION calculate_pos_sale_payment_totals()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalc_pos_sale_totals(COALESCE(NEW."saleId", OLD."saleId"));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_pos_sale_payment_totals()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalc_pos_sale_totals(COALESCE(NEW."saleId", OLD."saleId"));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_pos_sale_adjustment_totals()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.recalc_pos_sale_totals(COALESCE(NEW."saleId", OLD."saleId"));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trigger_pos_sale_adjustment_totals" ON "POSSaleAdjustment";
CREATE TRIGGER "trigger_pos_sale_adjustment_totals"
AFTER INSERT OR UPDATE OR DELETE ON "POSSaleAdjustment"
FOR EACH ROW
EXECUTE FUNCTION calculate_pos_sale_adjustment_totals();
