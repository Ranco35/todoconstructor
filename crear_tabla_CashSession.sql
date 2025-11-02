-- ============================================
-- CREAR TABLA CashSession SI NO EXISTE
-- ============================================

-- Crear tabla de sesiones de caja
CREATE TABLE IF NOT EXISTS "CashSession" (
  "id" BIGSERIAL PRIMARY KEY,
  "userId" UUID NOT NULL,
  "cashRegisterTypeId" BIGINT REFERENCES "CashRegisterType"("id"),
  "sessionNumber" TEXT,
  "openingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "currentAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "closingAmount" DECIMAL(10,2),
  "expectedAmount" DECIMAL(10,2),
  "difference" DECIMAL(10,2),
  "status" TEXT NOT NULL DEFAULT 'open',
  "isActive" BOOLEAN DEFAULT true,
  "openedAt" TIMESTAMPTZ DEFAULT NOW(),
  "closedAt" TIMESTAMPTZ,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS "idx_cash_session_user" ON "CashSession"("userId");
CREATE INDEX IF NOT EXISTS "idx_cash_session_register_type" ON "CashSession"("cashRegisterTypeId");
CREATE INDEX IF NOT EXISTS "idx_cash_session_status" ON "CashSession"("status");

-- Actualizar POSSale para que sessionId sea nullable (ya que puede funcionar sin sesión)
ALTER TABLE "POSSale" 
ALTER COLUMN "sessionId" DROP NOT NULL;

-- Habilitar RLS
ALTER TABLE "CashSession" ENABLE ROW LEVEL SECURITY;

-- Crear política RLS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "CashSession";
CREATE POLICY "Allow all for authenticated users" ON "CashSession" 
FOR ALL TO authenticated USING (true);

-- Refrescar schema cache
NOTIFY pgrst, 'reload schema';

-- Verificar creación
SELECT 
    '✅ TABLA CashSession CREADA/VERIFICADA' as titulo;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'CashSession'
ORDER BY ordinal_position;

-- Verificar que POSSale.sessionId sea nullable
SELECT 
    '✅ Verificando POSSale.sessionId:' as titulo;

SELECT 
    column_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'POSSale' 
  AND column_name = 'sessionId';

SELECT '✅ Sistema de sesiones de caja listo' as resultado;

