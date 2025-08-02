-- Migración para crear tabla de pagos a proveedores part-time
-- Fecha: 2025-01-01

-- Crear tabla SupplierPayment
CREATE TABLE IF NOT EXISTS "SupplierPayment" (
  "id" BIGSERIAL PRIMARY KEY,
  "sessionId" BIGINT NOT NULL REFERENCES "CashSession"("id") ON DELETE CASCADE,
  "supplierId" BIGINT NOT NULL REFERENCES "Supplier"("id") ON DELETE RESTRICT,
  "amount" DECIMAL(10,2) NOT NULL,
  "description" TEXT NOT NULL,
  "costCenterId" BIGINT REFERENCES "Cost_Center"("id") ON DELETE SET NULL,
  "paymentMethod" TEXT NOT NULL DEFAULT 'cash' CHECK ("paymentMethod" IN ('cash', 'transfer', 'card', 'other')),
  "bankReference" TEXT,
  "bankAccount" TEXT,
  "receiptNumber" TEXT,
  "notes" TEXT,
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "pettyCashExpenseId" BIGINT REFERENCES "PettyCashExpense"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "idx_supplier_payment_session" ON "SupplierPayment"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_supplier_payment_supplier" ON "SupplierPayment"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_supplier_payment_cost_center" ON "SupplierPayment"("costCenterId");
CREATE INDEX IF NOT EXISTS "idx_supplier_payment_user" ON "SupplierPayment"("userId");
CREATE INDEX IF NOT EXISTS "idx_supplier_payment_created" ON "SupplierPayment"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_supplier_payment_method" ON "SupplierPayment"("paymentMethod");

-- Crear trigger para actualizar updatedAt
CREATE OR REPLACE FUNCTION update_supplier_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_payment_updated_at
  BEFORE UPDATE ON "SupplierPayment"
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_payment_updated_at();

-- Agregar comentarios para documentación
COMMENT ON TABLE "SupplierPayment" IS 'Registro de pagos a proveedores part-time desde caja chica';
COMMENT ON COLUMN "SupplierPayment"."sessionId" IS 'ID de la sesión de caja donde se realizó el pago';
COMMENT ON COLUMN "SupplierPayment"."supplierId" IS 'ID del proveedor (debe ser tipo PERSONA)';
COMMENT ON COLUMN "SupplierPayment"."amount" IS 'Monto del pago';
COMMENT ON COLUMN "SupplierPayment"."description" IS 'Descripción del pago';
COMMENT ON COLUMN "SupplierPayment"."costCenterId" IS 'Centro de costo asociado al pago';
COMMENT ON COLUMN "SupplierPayment"."paymentMethod" IS 'Método de pago utilizado';
COMMENT ON COLUMN "SupplierPayment"."bankReference" IS 'Referencia bancaria para transferencias';
COMMENT ON COLUMN "SupplierPayment"."bankAccount" IS 'Cuenta bancaria para transferencias';
COMMENT ON COLUMN "SupplierPayment"."receiptNumber" IS 'Número de recibo o comprobante';
COMMENT ON COLUMN "SupplierPayment"."notes" IS 'Notas adicionales del pago';
COMMENT ON COLUMN "SupplierPayment"."userId" IS 'Usuario que registró el pago';
COMMENT ON COLUMN "SupplierPayment"."pettyCashExpenseId" IS 'Referencia al gasto de caja chica correspondiente';
COMMENT ON COLUMN "SupplierPayment"."createdAt" IS 'Fecha y hora de creación del registro';
COMMENT ON COLUMN "SupplierPayment"."updatedAt" IS 'Fecha y hora de última actualización'; 