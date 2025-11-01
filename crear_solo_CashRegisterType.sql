-- ============================================
-- CREAR SOLO LA TABLA CashRegisterType QUE FALTA
-- ============================================

-- Primero, verificar si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CashRegisterType') THEN
        RAISE NOTICE '✅ La tabla CashRegisterType YA EXISTE';
    ELSE
        RAISE NOTICE '⚠️ La tabla CashRegisterType NO EXISTE - Creando...';
    END IF;
END $$;

-- Crear la tabla CashRegisterType
CREATE TABLE IF NOT EXISTS "CashRegisterType" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar los 2 tipos de POS con los nombres nuevos
INSERT INTO "CashRegisterType" ("id", "name", "displayName", "description") VALUES
(1, 'recepcion', 'Ventas', 'Punto de ventas principal'),
(2, 'restaurante', 'Ventas2', 'Punto de ventas secundario')
ON CONFLICT ("name") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "description" = EXCLUDED."description",
  "updatedAt" = NOW();

-- Asegurar que los IDs sean 1 y 2
SELECT setval('"CashRegisterType_id_seq"', 2, true);

-- Habilitar RLS
ALTER TABLE "CashRegisterType" ENABLE ROW LEVEL SECURITY;

-- Crear política RLS para usuarios autenticados
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "CashRegisterType";
CREATE POLICY "Allow all for authenticated users" ON "CashRegisterType" 
FOR ALL TO authenticated USING (true);

-- Verificar la creación
SELECT 
    '✅ TABLA CREADA - Verificación:' as resultado;

SELECT 
    "id",
    "name" as nombre_interno,
    "displayName" as nombre_mostrado,
    "description" as descripcion,
    "isActive" as activo
FROM "CashRegisterType"
ORDER BY "id";

-- Verificar que CashRegister ahora pueda hacer JOIN
SELECT 
    '✅ VERIFICANDO RELACIÓN CON CashRegister:' as resultado;

SELECT 
    cr."id",
    cr."name" as caja,
    cr."typeId",
    crt."displayName" as tipo_pos
FROM "CashRegister" cr
LEFT JOIN "CashRegisterType" crt ON cr."typeId" = crt."id"
LIMIT 5;

