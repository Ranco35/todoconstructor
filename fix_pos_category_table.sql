-- Script completo para crear todas las tablas del sistema POS
-- Ejecutar directamente en Supabase SQL Editor
-- Fecha: 20 de Enero 2025

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
('ferreteria', 'Ferretería', 'Punto de ventas para ferretería y construcción'),
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
  "currentSessionId" BIGINT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear cajas por defecto
INSERT INTO "CashRegister" ("name", "typeId", "location") VALUES
('Caja Ferretería Principal', 1, 'Área de Ferretería'),
('Caja Restaurante Principal', 2, 'Área de Mesas')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. ACTUALIZAR TABLA CASHSESSION (si existe)
-- ============================================

-- Agregar columna de tipo de caja si no existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CashSession') THEN
        -- Verificar si la columna ya existe antes de agregarla
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'CashSession' 
            AND column_name = 'cashRegisterTypeId'
        ) THEN
            ALTER TABLE "CashSession" 
            ADD COLUMN "cashRegisterTypeId" BIGINT REFERENCES "CashRegisterType"("id");
        END IF;
        
        -- Actualizar sesiones existentes para asignarles tipo 'ferreteria' por defecto
        UPDATE "CashSession" 
        SET "cashRegisterTypeId" = 1 
        WHERE "cashRegisterTypeId" IS NULL;
    END IF;
END $$;

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

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS "idx_pos_product_category_register_type" 
ON "POSProductCategory"("cashRegisterTypeId");

CREATE INDEX IF NOT EXISTS "idx_pos_product_category_active" 
ON "POSProductCategory"("isActive") 
WHERE "isActive" = true;

-- Insertar categorías para Ferretería
INSERT INTO "POSProductCategory" ("name", "displayName", "icon", "color", "cashRegisterTypeId", "sortOrder") VALUES
('herramientas', 'Herramientas y Equipos', '🔧', '#2563EB', 1, 1),
('materiales', 'Materiales de Construcción', '🧱', '#059669', 1, 2),
('electricos', 'Productos Eléctricos', '⚡', '#DC2626', 1, 3),
('ferreteria_general', 'Ferretería General', '🛠️', '#7C3AED', 1, 4),
('pinturas', 'Pinturas y Acabados', '🎨', '#EA580C', 1, 5)
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
  "sessionId" BIGINT,
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

-- Agregar referencia a CashSession si la tabla existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CashSession') THEN
        -- Verificar si la restricción ya existe antes de agregarla
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'POSSale_sessionId_fkey' 
            AND table_name = 'POSSale'
        ) THEN
            ALTER TABLE "POSSale" 
            ADD CONSTRAINT "POSSale_sessionId_fkey" 
            FOREIGN KEY ("sessionId") REFERENCES "CashSession"("id");
        END IF;
    END IF;
END $$;

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
  "allowDiscounts" BOOLEAN DEFAULT true,
  "requireCustomerInfo" BOOLEAN DEFAULT false,
  "autoPrintReceipt" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración por defecto
INSERT INTO "POSConfig" ("cashRegisterTypeId", "taxRate", "currency", "allowDiscounts", "requireCustomerInfo") VALUES
(1, 19.00, 'CLP', true, false),
(2, 19.00, 'CLP', true, false)
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 'Sistema POS creado exitosamente' as resultado;

SELECT 
  'CashRegisterType' as tabla,
  COUNT(*) as registros 
FROM "CashRegisterType"
UNION ALL
SELECT 
  'CashRegister' as tabla,
  COUNT(*) as registros 
FROM "CashRegister"
UNION ALL
SELECT 
  'POSProductCategory' as tabla,
  COUNT(*) as registros 
FROM "POSProductCategory"
UNION ALL
SELECT 
  'POSProduct' as tabla,
  COUNT(*) as registros 
FROM "POSProduct"
UNION ALL
SELECT 
  'POSSale' as tabla,
  COUNT(*) as registros 
FROM "POSSale"
UNION ALL
SELECT 
  'POSSaleItem' as tabla,
  COUNT(*) as registros 
FROM "POSSaleItem"
UNION ALL
SELECT 
  'POSTable' as tabla,
  COUNT(*) as registros 
FROM "POSTable"
UNION ALL
SELECT 
  'POSConfig' as tabla,
  COUNT(*) as registros 
FROM "POSConfig";

-- Mostrar categorías creadas para ferretería
SELECT 
  id,
  name,
  "displayName",
  icon,
  color,
  "sortOrder"
FROM "POSProductCategory" 
WHERE "cashRegisterTypeId" = 1 
ORDER BY "sortOrder";
