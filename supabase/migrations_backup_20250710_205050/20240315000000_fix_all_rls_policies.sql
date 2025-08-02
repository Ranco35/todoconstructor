-- Migración completa para arreglar todas las políticas RLS
-- Asegurar que los usuarios autenticados puedan crear, leer, actualizar y eliminar
-- en todas las tablas relacionadas con productos y bodegas

-- ========================================
-- 1. TABLA PRODUCT
-- ========================================

-- Eliminar todas las políticas existentes de Product
DROP POLICY IF EXISTS "Enable read access for all users" ON "Product";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "Product";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "Product";
DROP POLICY IF EXISTS "Enable delete for users based on email" ON "Product";
DROP POLICY IF EXISTS "Authenticated users can do everything on Product" ON "Product";
DROP POLICY IF EXISTS "Service role can do everything on Product" ON "Product";

-- Crear políticas permisivas para Product
CREATE POLICY "Authenticated users can do everything on Product" ON "Product"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on Product" ON "Product"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 2. TABLA WAREHOUSE
-- ========================================

-- Eliminar todas las políticas existentes de Warehouse
DROP POLICY IF EXISTS "Enable read access for all users" ON "Warehouse";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "Warehouse";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "Warehouse";
DROP POLICY IF EXISTS "Enable delete for users based on email" ON "Warehouse";
DROP POLICY IF EXISTS "Authenticated users can do everything on Warehouse" ON "Warehouse";
DROP POLICY IF EXISTS "Service role can do everything on Warehouse" ON "Warehouse";

-- Crear políticas permisivas para Warehouse
CREATE POLICY "Authenticated users can do everything on Warehouse" ON "Warehouse"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on Warehouse" ON "Warehouse"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 3. TABLA WAREHOUSE_PRODUCT
-- ========================================

-- Eliminar todas las políticas existentes de Warehouse_Product
DROP POLICY IF EXISTS "Enable read access for all users" ON "Warehouse_Product";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "Warehouse_Product";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "Warehouse_Product";
DROP POLICY IF EXISTS "Enable delete for users based on email" ON "Warehouse_Product";
DROP POLICY IF EXISTS "Authenticated users can do everything on Warehouse_Product" ON "Warehouse_Product";
DROP POLICY IF EXISTS "Service role can do everything on Warehouse_Product" ON "Warehouse_Product";

-- Crear políticas permisivas para Warehouse_Product
CREATE POLICY "Authenticated users can do everything on Warehouse_Product" ON "Warehouse_Product"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on Warehouse_Product" ON "Warehouse_Product"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 4. TABLA CATEGORY
-- ========================================

-- Eliminar políticas existentes de Category
DROP POLICY IF EXISTS "Enable read access for all users" ON "Category";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "Category";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "Category";
DROP POLICY IF EXISTS "Enable delete for users based on email" ON "Category";
DROP POLICY IF EXISTS "Authenticated users can do everything on Category" ON "Category";
DROP POLICY IF EXISTS "Service role can do everything on Category" ON "Category";

-- Crear políticas permisivas para Category
CREATE POLICY "Authenticated users can do everything on Category" ON "Category"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on Category" ON "Category"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 5. TABLA SUPPLIER
-- ========================================

-- Eliminar políticas existentes de Supplier
DROP POLICY IF EXISTS "Enable read access for all users" ON "Supplier";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "Supplier";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "Supplier";
DROP POLICY IF EXISTS "Enable delete for users based on email" ON "Supplier";
DROP POLICY IF EXISTS "Authenticated users can do everything on Supplier" ON "Supplier";
DROP POLICY IF EXISTS "Service role can do everything on Supplier" ON "Supplier";

-- Crear políticas permisivas para Supplier
CREATE POLICY "Authenticated users can do everything on Supplier" ON "Supplier"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on Supplier" ON "Supplier"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 6. HABILITAR RLS EN TODAS LAS TABLAS
-- ========================================

-- Asegurar que RLS esté habilitado en todas las tablas
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Warehouse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Warehouse_Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. VERIFICAR ESTRUCTURA DE TABLAS
-- ========================================

-- Verificar que la tabla Product tenga la columna 'type'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'type'
  ) THEN
    ALTER TABLE "Product" ADD COLUMN "type" text;
  END IF;
END $$;

-- Verificar que la tabla Warehouse_Product tenga las columnas correctas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Warehouse_Product' AND column_name = 'productId'
  ) THEN
    -- Si no existe productId, verificar si existe productid (camelCase)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Warehouse_Product' AND column_name = 'productid'
    ) THEN
      -- Renombrar productid a productId para consistencia
      ALTER TABLE "Warehouse_Product" RENAME COLUMN "productid" TO "productId";
    END IF;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Warehouse_Product' AND column_name = 'warehouseId'
  ) THEN
    -- Si no existe warehouseId, verificar si existe warehouseid (camelCase)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Warehouse_Product' AND column_name = 'warehouseid'
    ) THEN
      -- Renombrar warehouseid a warehouseId para consistencia
      ALTER TABLE "Warehouse_Product" RENAME COLUMN "warehouseid" TO "warehouseId";
    END IF;
  END IF;
END $$;

-- ========================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- ========================================

COMMENT ON TABLE "Product" IS 'Tabla de productos con políticas RLS permisivas para usuarios autenticados';
COMMENT ON TABLE "Warehouse" IS 'Tabla de bodegas con políticas RLS permisivas para usuarios autenticados';
COMMENT ON TABLE "Warehouse_Product" IS 'Tabla de relación producto-bodega con políticas RLS permisivas para usuarios autenticados';
COMMENT ON TABLE "Category" IS 'Tabla de categorías con políticas RLS permisivas para usuarios autenticados';
COMMENT ON TABLE "Supplier" IS 'Tabla de proveedores con políticas RLS permisivas para usuarios autenticados';

-- ========================================
-- 9. VERIFICACIÓN FINAL
-- ========================================

-- Crear una función para verificar que las políticas estén aplicadas correctamente
CREATE OR REPLACE FUNCTION verify_rls_policies()
RETURNS TABLE(table_name text, policy_name text, policy_type text) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename as table_name,
    policyname as policy_name,
    cmd as policy_type
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN ('Product', 'Warehouse', 'Warehouse_Product', 'Category', 'Supplier')
  ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql;
