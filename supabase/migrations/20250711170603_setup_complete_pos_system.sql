-- Migration: Configuración completa del sistema POS
-- Incluye políticas RLS y datos iniciales para todas las tablas POS

-- ============================================================================
-- 1. Configurar políticas RLS para CashRegisterType
-- ============================================================================
ALTER TABLE "public"."CashRegisterType" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "CashRegisterType_select_policy" ON "public"."CashRegisterType";
DROP POLICY IF EXISTS "CashRegisterType_insert_policy" ON "public"."CashRegisterType";
DROP POLICY IF EXISTS "CashRegisterType_update_policy" ON "public"."CashRegisterType";
DROP POLICY IF EXISTS "CashRegisterType_delete_policy" ON "public"."CashRegisterType";

-- Crear políticas RLS para CashRegisterType
CREATE POLICY "CashRegisterType_select_policy" 
ON "public"."CashRegisterType" 
FOR SELECT 
USING (true);

CREATE POLICY "CashRegisterType_insert_policy" 
ON "public"."CashRegisterType" 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "CashRegisterType_update_policy" 
ON "public"."CashRegisterType" 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "CashRegisterType_delete_policy" 
ON "public"."CashRegisterType" 
FOR DELETE 
USING (true);

-- ============================================================================
-- 2. Insertar tipos de caja registradora por defecto
-- ============================================================================
INSERT INTO "public"."CashRegisterType" (id, name, "displayName", description) 
VALUES 
  (1, 'reception', 'Recepción', 'Caja registradora de recepción'),
  (2, 'restaurant', 'Restaurante', 'Caja registradora del restaurante')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "displayName" = EXCLUDED."displayName",
  description = EXCLUDED.description;

-- ============================================================================
-- 3. Insertar categorías POS por defecto
-- ============================================================================
-- Insertar categorías para Restaurante (cashRegisterTypeId = 2)
INSERT INTO "public"."POSProductCategory" (name, "displayName", icon, color, "cashRegisterTypeId", "isActive", "sortOrder") 
VALUES 
  ('comidas', 'Comidas', 'food', '#FF6B6B', 2, true, 1),
  ('bebidas', 'Bebidas', 'drink', '#4ECDC4', 2, true, 2),
  ('postres', 'Postres', 'dessert', '#FFE66D', 2, true, 3),
  ('entradas', 'Entradas', 'appetizer', '#95E1D3', 2, true, 4),
  ('especiales', 'Especiales', 'star', '#F38BA8', 2, true, 5);

-- Insertar categorías para Recepción (cashRegisterTypeId = 1)
INSERT INTO "public"."POSProductCategory" (name, "displayName", icon, color, "cashRegisterTypeId", "isActive", "sortOrder") 
VALUES 
  ('servicios', 'Servicios', 'service', '#A8DADC', 1, true, 1),
  ('productos', 'Productos', 'product', '#457B9D', 1, true, 2),
  ('amenidades', 'Amenidades', 'amenity', '#1D3557', 1, true, 3);

-- ============================================================================
-- 4. Configurar políticas RLS adicionales para tablas POS relacionadas
-- ============================================================================

-- Políticas para POSProduct
ALTER TABLE "public"."POSProduct" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "POSProduct_select_policy" ON "public"."POSProduct";
DROP POLICY IF EXISTS "POSProduct_insert_policy" ON "public"."POSProduct";
DROP POLICY IF EXISTS "POSProduct_update_policy" ON "public"."POSProduct";
DROP POLICY IF EXISTS "POSProduct_delete_policy" ON "public"."POSProduct";

CREATE POLICY "POSProduct_select_policy" ON "public"."POSProduct" FOR SELECT USING (true);
CREATE POLICY "POSProduct_insert_policy" ON "public"."POSProduct" FOR INSERT WITH CHECK (true);
CREATE POLICY "POSProduct_update_policy" ON "public"."POSProduct" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "POSProduct_delete_policy" ON "public"."POSProduct" FOR DELETE USING (true);

-- Políticas para CashRegister
ALTER TABLE "public"."CashRegister" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CashRegister_select_policy" ON "public"."CashRegister";
DROP POLICY IF EXISTS "CashRegister_insert_policy" ON "public"."CashRegister";
DROP POLICY IF EXISTS "CashRegister_update_policy" ON "public"."CashRegister";
DROP POLICY IF EXISTS "CashRegister_delete_policy" ON "public"."CashRegister";

CREATE POLICY "CashRegister_select_policy" ON "public"."CashRegister" FOR SELECT USING (true);
CREATE POLICY "CashRegister_insert_policy" ON "public"."CashRegister" FOR INSERT WITH CHECK (true);
CREATE POLICY "CashRegister_update_policy" ON "public"."CashRegister" FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "CashRegister_delete_policy" ON "public"."CashRegister" FOR DELETE USING (true); 