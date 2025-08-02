-- Agregar tabla CashRegister
CREATE TABLE IF NOT EXISTS "CashRegister" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "baseAmount" DECIMAL(10,2) DEFAULT 0,
  "cashAmount" DECIMAL(10,2) DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "idx_cash_register_name" ON "CashRegister"("name");
CREATE INDEX IF NOT EXISTS "idx_cash_register_active" ON "CashRegister"("isActive");

-- Habilitar Row Level Security (RLS)
ALTER TABLE "CashRegister" ENABLE ROW LEVEL SECURITY;

-- Insertar algunas cajas registradoras por defecto
INSERT INTO "CashRegister" ("name", "location", "baseAmount", "cashAmount") VALUES
('Caja Principal', 'Recepción', 1000.00, 1000.00),
('Caja Secundaria', 'Oficina', 500.00, 500.00)
ON CONFLICT DO NOTHING;

-- Comentario para documentar el cambio
COMMENT ON TABLE "CashRegister" IS 'Tabla para gestionar las cajas registradoras del sistema';
COMMENT ON COLUMN "CashRegister"."name" IS 'Nombre de la caja registradora';
COMMENT ON COLUMN "CashRegister"."location" IS 'Ubicación física de la caja';
COMMENT ON COLUMN "CashRegister"."baseAmount" IS 'Monto base de la caja';
COMMENT ON COLUMN "CashRegister"."cashAmount" IS 'Monto actual en efectivo'; 