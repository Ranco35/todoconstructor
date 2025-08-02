-- Migración para Sistema POS - Solo tablas nuevas
-- Admintermas - Punto de Ventas

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

-- Insertar tipos de caja por defecto
INSERT INTO "CashRegisterType" ("name", "displayName", "description") VALUES
('recepcion', 'Recepción', 'Punto de ventas para área de recepción'),
('restaurante', 'Restaurante', 'Punto de ventas para área de restaurante')
ON CONFLICT ("name") DO NOTHING;

-- ============================================
-- 2. TABLA DE CAJAS REGISTRADORAS
-- ============================================

CREATE TABLE IF NOT EXISTS "CashRegister" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "typeId" BIGINT NOT NULL REFERENCES "CashRegisterType"("id"),
  "location" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "costCenterId" BIGINT REFERENCES "Cost_Center"("id"),
  "currentSessionId" BIGINT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear cajas por defecto
INSERT INTO "CashRegister" ("name", "typeId", "location") VALUES
('Caja Recepción Principal', 1, 'Lobby Principal'),
('Caja Restaurante Principal', 2, 'Área de Mesas')
ON CONFLICT DO NOTHING;

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

-- Categorías para Recepción
INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") VALUES
('room_service', 'Servicio a Habitación', '🛎️', '#8B5CF6', 1, 1),
('amenities', 'Amenidades', '🧴', '#06B6D4', 1, 2),
('laundry', 'Lavandería', '👔', '#10B981', 1, 3),
('tours', 'Tours', '🗺️', '#F59E0B', 1, 4),
('extras', 'Extras', '⭐', '#EF4444', 1, 5)
ON CONFLICT DO NOTHING;

-- Categorías para Restaurante
INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") VALUES
('food', 'Comida', '🍽️', '#EA580C', 2, 1),
('drinks', 'Bebidas', '🥤', '#2563EB', 2, 2),
('desserts', 'Postres', '🍰', '#EC4899', 2, 3),
('appetizers', 'Entradas', '🥗', '#16A34A', 2, 4),
('specials', 'Especiales', '⭐', '#7C3AED', 2, 5)
ON CONFLICT DO NOTHING;

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
  "sessionId" BIGINT NOT NULL REFERENCES "CashSession"("id"),
  "saleNumber" TEXT NOT NULL,
  "customerName" TEXT,
  "customerDocument" TEXT,
  "tableNumber" TEXT,
  "roomNumber" TEXT,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "cashReceived" DECIMAL(10,2),
  "change" DECIMAL(10,2),
  "status" TEXT NOT NULL DEFAULT 'completed',
  "notes" TEXT,
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
-- 8. TABLA DE MESAS (SOLO RESTAURANTE)
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

-- Crear mesas por defecto para restaurante
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
('10', 'Mesa 10', 10)
ON CONFLICT DO NOTHING;

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
INSERT INTO "POSConfig" ("cashRegisterTypeId", "receiptFooter", "requireCustomerInfo") VALUES
(1, 'Gracias por hospedarse con nosotros', false),
(2, 'Esperamos que haya disfrutado su comida', false)
ON CONFLICT DO NOTHING;

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
    -- Obtener prefijo según tipo de caja
    SELECT CASE 
        WHEN name = 'recepcion' THEN 'REC'
        WHEN name = 'restaurante' THEN 'REST'
        ELSE 'GEN'
    END INTO prefix
    FROM "CashRegisterType" 
    WHERE id = register_type_id;
    
    -- Obtener siguiente número
    SELECT COALESCE(MAX(CAST(SUBSTRING(s."saleNumber" FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM "POSSale" s
    JOIN "CashSession" cs ON s."sessionId" = cs.id
    WHERE cs."cashRegisterTypeId" = register_type_id
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

-- ============================================
-- 13. ACTUALIZAR FOREIGN KEY EN CASHREGISTER
-- ============================================

-- Agregar foreign key para sesión actual si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_cash_register_current_session'
    ) THEN
        ALTER TABLE "CashRegister" 
        ADD CONSTRAINT "fk_cash_register_current_session" 
        FOREIGN KEY ("currentSessionId") REFERENCES "CashSession"("id");
    END IF;
END $$;
