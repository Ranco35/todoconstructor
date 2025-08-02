-- Migración para agregar campos de método de pago y tipo de transacción a caja chica
-- Fecha: 2025-01-01

-- Agregar campos a PettyCashExpense
ALTER TABLE "PettyCashExpense" 
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'cash' CHECK ("paymentMethod" IN ('cash', 'transfer', 'card', 'other')),
ADD COLUMN IF NOT EXISTS "transactionType" TEXT DEFAULT 'expense' CHECK ("transactionType" IN ('expense', 'income', 'refund')),
ADD COLUMN IF NOT EXISTS "affectsPhysicalCash" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "bankReference" TEXT,
ADD COLUMN IF NOT EXISTS "bankAccount" TEXT;

-- Agregar campos a PettyCashPurchase
ALTER TABLE "PettyCashPurchase" 
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'cash' CHECK ("paymentMethod" IN ('cash', 'transfer', 'card', 'other')),
ADD COLUMN IF NOT EXISTS "transactionType" TEXT DEFAULT 'purchase' CHECK ("transactionType" IN ('purchase', 'return')),
ADD COLUMN IF NOT EXISTS "affectsPhysicalCash" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "bankReference" TEXT,
ADD COLUMN IF NOT EXISTS "bankAccount" TEXT;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "idx_petty_cash_expense_payment_method" ON "PettyCashExpense"("paymentMethod");
CREATE INDEX IF NOT EXISTS "idx_petty_cash_expense_transaction_type" ON "PettyCashExpense"("transactionType");
CREATE INDEX IF NOT EXISTS "idx_petty_cash_expense_affects_cash" ON "PettyCashExpense"("affectsPhysicalCash");
CREATE INDEX IF NOT EXISTS "idx_petty_cash_purchase_payment_method" ON "PettyCashPurchase"("paymentMethod");
CREATE INDEX IF NOT EXISTS "idx_petty_cash_purchase_transaction_type" ON "PettyCashPurchase"("transactionType");
CREATE INDEX IF NOT EXISTS "idx_petty_cash_purchase_affects_cash" ON "PettyCashPurchase"("affectsPhysicalCash");

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN "PettyCashExpense"."paymentMethod" IS 'Método de pago: cash (efectivo), transfer (transferencia), card (tarjeta), other (otro)';
COMMENT ON COLUMN "PettyCashExpense"."transactionType" IS 'Tipo de transacción: expense (gasto), income (ingreso), refund (reembolso)';
COMMENT ON COLUMN "PettyCashExpense"."affectsPhysicalCash" IS 'Indica si la transacción afecta el dinero físico en caja';
COMMENT ON COLUMN "PettyCashExpense"."bankReference" IS 'Referencia bancaria para transferencias';
COMMENT ON COLUMN "PettyCashExpense"."bankAccount" IS 'Cuenta bancaria utilizada';

COMMENT ON COLUMN "PettyCashPurchase"."paymentMethod" IS 'Método de pago: cash (efectivo), transfer (transferencia), card (tarjeta), other (otro)';
COMMENT ON COLUMN "PettyCashPurchase"."transactionType" IS 'Tipo de transacción: purchase (compra), return (devolución)';
COMMENT ON COLUMN "PettyCashPurchase"."affectsPhysicalCash" IS 'Indica si la transacción afecta el dinero físico en caja';
COMMENT ON COLUMN "PettyCashPurchase"."bankReference" IS 'Referencia bancaria para transferencias';
COMMENT ON COLUMN "PettyCashPurchase"."bankAccount" IS 'Cuenta bancaria utilizada'; 