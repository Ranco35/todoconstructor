-- Migración inicial para Admintermas
-- Crea las tablas principales del sistema

-- Tabla de Roles
CREATE TABLE IF NOT EXISTS "public"."Role" (
    "id" BIGSERIAL PRIMARY KEY,
    "roleName" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar los roles básicos del sistema
INSERT INTO "public"."Role" ("roleName", "description") VALUES
('SUPER_USER', 'Acceso completo a todas las funcionalidades del sistema.'),
('ADMINISTRADOR', 'Gestión general del sistema, usuarios y configuraciones.'),
('JEFE_SECCION', 'Gestión de un departamento o sección específica.'),
('USUARIO_FINAL', 'Acceso a funcionalidades operativas básicas.')
ON CONFLICT ("roleName") DO NOTHING;

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS "Category" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "parentId" BIGINT REFERENCES "Category"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Centros de Costo
CREATE TABLE IF NOT EXISTS "Cost_Center" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "code" TEXT UNIQUE,
  "isActive" BOOLEAN DEFAULT true,
  "parentId" BIGINT REFERENCES "Cost_Center"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Usuarios (Perfil Público)
-- Se enlaza con la tabla auth.users de Supabase
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "username" TEXT UNIQUE,
  "email" TEXT UNIQUE,
  "roleId" BIGINT REFERENCES "Role"(id),
  "department" TEXT,
  "costCenterId" BIGINT REFERENCES "Cost_Center"(id),
  "isActive" BOOLEAN DEFAULT true,
  "lastLogin" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "country" TEXT,
  "postalCode" TEXT,
  "taxId" TEXT,
  "companyType" TEXT,
  "rank" TEXT,
  "paymentTerm" TEXT,
  "creditLimit" DECIMAL(10,2),
  "isActive" BOOLEAN DEFAULT true,
  "notes" TEXT,
  "costCenterId" BIGINT REFERENCES "Cost_Center"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Almacenes
CREATE TABLE IF NOT EXISTS "Warehouse" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "location" TEXT,
  "type" TEXT NOT NULL,
  "capacity" INTEGER,
  "costCenterId" BIGINT REFERENCES "Cost_Center"("id"),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS "Product" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "barcode" TEXT,
  "description" TEXT,
  "categoryid" BIGINT REFERENCES "Category"("id"),
  "brand" TEXT,
  "image" TEXT,
  "costprice" DECIMAL(10,2),
  "saleprice" DECIMAL(10,2),
  "vat" DECIMAL(5,2),
  "supplierid" BIGINT REFERENCES "Supplier"("id"),
  "supplierCode" TEXT,
  "defaultCostCenterId" BIGINT REFERENCES "Cost_Center"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Productos en Almacenes
CREATE TABLE IF NOT EXISTS "Warehouse_Product" (
  "id" BIGSERIAL PRIMARY KEY,
  "warehouseId" BIGINT NOT NULL REFERENCES "Warehouse"("id"),
  "productId" BIGINT NOT NULL REFERENCES "Product"("id"),
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "minStock" INTEGER DEFAULT 0,
  "maxStock" INTEGER,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("warehouseId", "productId")
);

-- Tabla de Sesiones de Caja
CREATE TABLE IF NOT EXISTS "CashSession" (
  "id" BIGSERIAL PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES "User"("id"),
  "cashRegisterId" BIGINT,
  "openingAmount" DECIMAL(10,2) NOT NULL,
  "currentAmount" DECIMAL(10,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "openedAt" TIMESTAMPTZ DEFAULT NOW(),
  "closedAt" TIMESTAMPTZ,
  "notes" TEXT
);

-- Tabla de Gastos de Caja Menor
CREATE TABLE IF NOT EXISTS "PettyCashExpense" (
  "id" BIGSERIAL PRIMARY KEY,
  "sessionId" BIGINT NOT NULL REFERENCES "CashSession"("id"),
  "amount" DECIMAL(10,2) NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "costCenterId" BIGINT REFERENCES "Cost_Center"("id"),
  "receiptNumber" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Compras de Caja Menor
CREATE TABLE IF NOT EXISTS "PettyCashPurchase" (
  "id" BIGSERIAL PRIMARY KEY,
  "sessionId" BIGINT NOT NULL REFERENCES "CashSession"("id"),
  "productId" BIGINT REFERENCES "Product"("id"),
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "totalAmount" DECIMAL(10,2) NOT NULL,
  "costCenterId" BIGINT REFERENCES "Cost_Center"("id"),
  "supplierId" BIGINT REFERENCES "Supplier"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "idx_category_parent" ON "Category"("parentId");
CREATE INDEX IF NOT EXISTS "idx_cost_center_parent" ON "Cost_Center"("parentId");
CREATE INDEX IF NOT EXISTS "idx_supplier_cost_center" ON "Supplier"("costCenterId");
CREATE INDEX IF NOT EXISTS "idx_user_cost_center" ON "User"("costCenterId");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("roleId");
CREATE INDEX IF NOT EXISTS "idx_warehouse_cost_center" ON "Warehouse"("costCenterId");
CREATE INDEX IF NOT EXISTS "idx_product_category" ON "Product"("categoryid");
CREATE INDEX IF NOT EXISTS "idx_product_supplier" ON "Product"("supplierid");
CREATE INDEX IF NOT EXISTS "idx_product_cost_center" ON "Product"("defaultCostCenterId");
CREATE INDEX IF NOT EXISTS "idx_warehouse_product_warehouse" ON "Warehouse_Product"("warehouseId");
CREATE INDEX IF NOT EXISTS "idx_warehouse_product_product" ON "Warehouse_Product"("productId");
CREATE INDEX IF NOT EXISTS "idx_cash_session_user" ON "CashSession"("userId");
CREATE INDEX IF NOT EXISTS "idx_petty_cash_expense_session" ON "PettyCashExpense"("sessionId");
CREATE INDEX IF NOT EXISTS "idx_petty_cash_purchase_session" ON "PettyCashPurchase"("sessionId");

-- Habilitar Row Level Security (RLS)
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cost_Center" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Warehouse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Warehouse_Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CashSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PettyCashExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PettyCashPurchase" ENABLE ROW LEVEL SECURITY;
