-- ============================================
-- CREAR SISTEMA POS COMPLETO SI NO EXISTE
-- Ejecutar si las tablas no existen
-- ============================================

-- ============================================
-- 1. TABLA DE TIPOS DE CAJA
-- ============================================

CREATE TABLE IF NOT EXISTS "CashRegisterType" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tipos de caja (YA CON LOS NUEVOS NOMBRES)
INSERT INTO "CashRegisterType" ("name", "displayName", "description") VALUES
('recepcion', 'Ventas', 'Punto de ventas principal'),
('restaurante', 'Ventas2', 'Punto de ventas secundario')
ON CONFLICT ("name") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "description" = EXCLUDED."description",
  "updatedAt" = NOW();

-- ============================================
-- 2. TABLA DE CAJAS REGISTRADORAS
-- ============================================

CREATE TABLE IF NOT EXISTS "CashRegister" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "typeId" BIGINT NOT NULL REFERENCES "CashRegisterType"("id"),
  "location" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "costCenterId" BIGINT,
  "currentSessionId" BIGINT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear cajas por defecto
INSERT INTO "CashRegister" ("name", "typeId", "location") 
SELECT 'Caja Ventas Principal', 1, 'Lobby Principal'
WHERE NOT EXISTS (SELECT 1 FROM "CashRegister" WHERE "name" = 'Caja Ventas Principal');

INSERT INTO "CashRegister" ("name", "typeId", "location") 
SELECT 'Caja Ventas2 Principal', 2, 'Área de Mesas'
WHERE NOT EXISTS (SELECT 1 FROM "CashRegister" WHERE "name" = 'Caja Ventas2 Principal');

-- ============================================
-- 3. ACTUALIZAR TABLA CASHSESSION
-- ============================================

-- Agregar columna de tipo de caja si no existe
ALTER TABLE "CashSession" 
ADD COLUMN IF NOT EXISTS "cashRegisterTypeId" BIGINT REFERENCES "CashRegisterType"("id");

-- Actualizar sesiones existentes para asignarles tipo 'recepcion' por defecto
UPDATE "CashSession" 
SET "cashRegisterTypeId" = 1 
WHERE "cashRegisterTypeId" IS NULL;

-- ============================================
-- 4. TABLA DE CATEGORÍAS DE PRODUCTOS POS
-- ============================================

CREATE TABLE IF NOT EXISTS "POSProductCategory" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "icon" TEXT,
  "color" TEXT,
  "cashRegisterTypeId" BIGINT REFERENCES "CashRegisterType"("id"),
  "sortOrder" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías para Ventas (tipo 1)
INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'room_service', 'Servicio a Habitación', '🛎️', '#8B5CF6', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'room_service' AND "cashRegisterTypeId" = 1);

INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'amenities', 'Amenidades', '🧴', '#06B6D4', 1, 2
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'amenities' AND "cashRegisterTypeId" = 1);

INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'laundry', 'Lavandería', '👔', '#10B981', 1, 3
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'laundry' AND "cashRegisterTypeId" = 1);

INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'tours', 'Tours', '🗺️', '#F59E0B', 1, 4
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'tours' AND "cashRegisterTypeId" = 1);

INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'extras', 'Extras', '⭐', '#EF4444', 1, 5
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'extras' AND "cashRegisterTypeId" = 1);

-- Categorías para Ventas2 (tipo 2)
INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'food', 'Comida', '🍽️', '#EA580C', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'food' AND "cashRegisterTypeId" = 2);

INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'drinks', 'Bebidas', '🥤', '#2563EB', 2, 2
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'drinks' AND "cashRegisterTypeId" = 2);

INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'desserts', 'Postres', '🍰', '#EC4899', 2, 3
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'desserts' AND "cashRegisterTypeId" = 2);

INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'appetizers', 'Entradas', '🥗', '#16A34A', 2, 4
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'appetizers' AND "cashRegisterTypeId" = 2);

INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") 
SELECT 'specials', 'Especiales', '⭐', '#7C3AED', 2, 5
WHERE NOT EXISTS (SELECT 1 FROM "POSProductCategory" WHERE "name" = 'specials' AND "cashRegisterTypeId" = 2);

-- ============================================
-- 5. TABLA DE PRODUCTOS POS
-- ============================================

CREATE TABLE IF NOT EXISTS "POSProduct" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sku" TEXT UNIQUE,
  "price" DECIMAL(10,2) NOT NULL,
  "cost" DECIMAL(10,2),
  "image" TEXT,
  "categoryId" BIGINT NOT NULL REFERENCES "POSProductCategory"("id"),
  "productId" BIGINT REFERENCES "Product"("id"),
  "isActive" BOOLEAN DEFAULT true,
  "stockRequired" BOOLEAN DEFAULT false,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TABLA DE VENTAS POS
-- ============================================

CREATE TABLE IF NOT EXISTS "POSSale" (
  "id" BIGSERIAL PRIMARY KEY,
  "sessionId" BIGINT REFERENCES "CashSession"("id"),
  "saleNumber" TEXT NOT NULL,
  "customerName" TEXT,
  "customerDocument" TEXT,
  "tableNumber" TEXT,
  "roomNumber" TEXT,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discountReason" TEXT,
  "total" DECIMAL(10,2) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "cashReceived" DECIMAL(10,2),
  "change" DECIMAL(10,2),
  "status" TEXT NOT NULL DEFAULT 'completed',
  "notes" TEXT,
  "clientId" BIGINT REFERENCES "Client"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TABLA DE ITEMS DE VENTA
-- ============================================

CREATE TABLE IF NOT EXISTS "POSSaleItem" (
  "id" BIGSERIAL PRIMARY KEY,
  "saleId" BIGINT NOT NULL REFERENCES "POSSale"("id") ON DELETE CASCADE,
  "productId" BIGINT NOT NULL REFERENCES "POSProduct"("id"),
  "productName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "total" DECIMAL(10,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TABLA DE MESAS (SOLO VENTAS2)
-- ============================================

CREATE TABLE IF NOT EXISTS "POSTable" (
  "id" BIGSERIAL PRIMARY KEY,
  "number" TEXT NOT NULL,
  "name" TEXT,
  "capacity" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'available',
  "currentSaleId" BIGINT REFERENCES "POSSale"("id"),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear mesas por defecto para Ventas2
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "POSTable" LIMIT 1) THEN
    INSERT INTO "POSTable" ("number", "name", "capacity") VALUES
    ('1', 'Mesa 1', 4),
    ('2', 'Mesa 2', 2),
    ('3', 'Mesa 3', 6),
    ('4', 'Mesa 4', 4),
    ('5', 'Mesa 5', 8),
    ('6', 'Mesa 6', 2),
    ('7', 'Mesa 7', 4),
    ('8', 'Mesa 8', 6),
    ('9', 'Mesa 9', 4),
    ('10', 'Mesa 10', 10);
  END IF;
END $$;

-- ============================================
-- 9. TABLA DE CONFIGURACIÓN POS
-- ============================================

CREATE TABLE IF NOT EXISTS "POSConfig" (
  "id" BIGSERIAL PRIMARY KEY,
  "cashRegisterTypeId" BIGINT NOT NULL REFERENCES "CashRegisterType"("id"),
  "taxRate" DECIMAL(5,2) DEFAULT 19.00,
  "currency" TEXT DEFAULT 'CLP',
  "receiptFooter" TEXT,
  "allowNegativeStock" BOOLEAN DEFAULT false,
  "requireCustomerInfo" BOOLEAN DEFAULT false,
  "autoGenerateReceipt" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración por defecto para cada tipo de caja
INSERT INTO "POSConfig" ("cashRegisterTypeId", "receiptFooter", "requireCustomerInfo") 
SELECT 1, 'Gracias por su compra', false
WHERE NOT EXISTS (SELECT 1 FROM "POSConfig" WHERE "cashRegisterTypeId" = 1);

INSERT INTO "POSConfig" ("cashRegisterTypeId", "receiptFooter", "requireCustomerInfo") 
SELECT 2, 'Esperamos que haya disfrutado', false
WHERE NOT EXISTS (SELECT 1 FROM "POSConfig" WHERE "cashRegisterTypeId" = 2);

-- ============================================
-- 10. FUNCIÓN PARA GENERAR NÚMERO DE VENTA
-- ============================================

CREATE OR REPLACE FUNCTION generate_sale_number(register_type_id BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    prefix TEXT;
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Obtener prefijo según tipo de caja (ACTUALIZADO CON NUEVOS NOMBRES)
    SELECT CASE 
        WHEN name = 'recepcion' THEN 'VEN'
        WHEN name = 'restaurante' THEN 'VEN2'
        ELSE 'GEN'
    END INTO prefix
    FROM "CashRegisterType" 
    WHERE id = register_type_id;
    
    -- Obtener siguiente número
    SELECT COALESCE(MAX(CAST(SUBSTRING(s."saleNumber" FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM "POSSale" s
    LEFT JOIN "CashSession" cs ON s."sessionId" = cs.id
    WHERE (cs."cashRegisterTypeId" = register_type_id OR s."sessionId" IS NULL)
    AND s."saleNumber" LIKE prefix || '%';
    
    -- Formatear número
    formatted_number := prefix || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$$;

-- ============================================
-- 11. ÍNDICES Y OPTIMIZACIONES
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_cash_register_type" ON "CashRegister"("typeId");
CREATE INDEX IF NOT EXISTS "idx_cash_register_current_session" ON "CashRegister"("currentSessionId");
CREATE INDEX IF NOT EXISTS "idx_cash_session_register_type" ON "CashSession"("cashRegisterTypeId");
CREATE INDEX IF NOT EXISTS "idx_pos_product_category" ON "POSProduct"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_pos_product_product" ON "POSProduct"("productId");
CREATE INDEX IF NOT EXISTS "idx_pos_sale_session" ON "POSSale"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_pos_sale_number" ON "POSSale"("saleNumber");
CREATE INDEX IF NOT EXISTS "idx_pos_sale_item_sale" ON "POSSaleItem"("saleId");
CREATE INDEX IF NOT EXISTS "idx_pos_sale_item_product" ON "POSSaleItem"("productId");
CREATE INDEX IF NOT EXISTS "idx_pos_table_current_sale" ON "POSTable"("currentSaleId");

-- ============================================
-- 12. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE "CashRegisterType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashRegister" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POSProductCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POSProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POSSale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POSSaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POSTable" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POSConfig" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir todo a usuarios autenticados)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON "CashRegisterType";
CREATE POLICY "Allow all for authenticated users" ON "CashRegisterType" FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON "CashRegister";
CREATE POLICY "Allow all for authenticated users" ON "CashRegister" FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON "POSProductCategory";
CREATE POLICY "Allow all for authenticated users" ON "POSProductCategory" FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON "POSProduct";
CREATE POLICY "Allow all for authenticated users" ON "POSProduct" FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON "POSSale";
CREATE POLICY "Allow all for authenticated users" ON "POSSale" FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON "POSSaleItem";
CREATE POLICY "Allow all for authenticated users" ON "POSSaleItem" FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON "POSTable";
CREATE POLICY "Allow all for authenticated users" ON "POSTable" FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON "POSConfig";
CREATE POLICY "Allow all for authenticated users" ON "POSConfig" FOR ALL TO authenticated USING (true);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT '✅ Sistema POS creado exitosamente!' as mensaje;

SELECT 
    "id",
    "name" as nombre_interno,
    "displayName" as nombre_mostrado,
    "description",
    "isActive" as activo
FROM "CashRegisterType"
ORDER BY "id";

