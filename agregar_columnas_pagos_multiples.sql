-- ============================================
-- AGREGAR COLUMNAS PARA PAGOS MÚLTIPLES
-- ============================================

-- Agregar columnas para el sistema de pagos múltiples
ALTER TABLE "POSSale" 
ADD COLUMN IF NOT EXISTS "paidAmount" DECIMAL(10,2) DEFAULT 0;

ALTER TABLE "POSSale" 
ADD COLUMN IF NOT EXISTS "pendingAmount" DECIMAL(10,2) DEFAULT 0;

ALTER TABLE "POSSale" 
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'paid';

-- Actualizar ventas existentes para que tengan valores correctos
UPDATE "POSSale" 
SET 
    "paidAmount" = "total",
    "pendingAmount" = 0,
    "paymentStatus" = 'paid'
WHERE "paidAmount" IS NULL OR "paidAmount" = 0;

-- Crear índice
CREATE INDEX IF NOT EXISTS "idx_pos_sale_payment_status" ON "POSSale"("paymentStatus");

-- Refrescar schema cache
NOTIFY pgrst, 'reload schema';

-- Verificar columnas
SELECT 
    '✅ VERIFICACIÓN DE COLUMNAS:' as titulo;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'POSSale' 
  AND column_name IN ('clientId', 'paidAmount', 'pendingAmount', 'paymentStatus')
ORDER BY column_name;

SELECT '✅ Columnas para pagos múltiples agregadas correctamente' as resultado;

