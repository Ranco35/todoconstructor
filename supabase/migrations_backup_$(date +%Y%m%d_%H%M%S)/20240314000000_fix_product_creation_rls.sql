-- Migración para arreglar políticas RLS para creación de productos
-- Asegurar que los usuarios autenticados puedan crear y leer productos

-- 1. Políticas para la tabla Product
-- Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Enable read access for all users" ON "Product";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "Product";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "Product";
DROP POLICY IF EXISTS "Enable delete for users based on email" ON "Product";

-- Crear políticas permisivas para usuarios autenticados
CREATE POLICY "Authenticated users can do everything on Product" ON "Product"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para service_role
CREATE POLICY "Service role can do everything on Product" ON "Product"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Políticas para la tabla Warehouse_Product
-- Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Enable read access for all users" ON "Warehouse_Product";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "Warehouse_Product";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "Warehouse_Product";
DROP POLICY IF EXISTS "Enable delete for users based on email" ON "Warehouse_Product";

-- Crear políticas permisivas para usuarios autenticados
CREATE POLICY "Authenticated users can do everything on Warehouse_Product" ON "Warehouse_Product"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para service_role
CREATE POLICY "Service role can do everything on Warehouse_Product" ON "Warehouse_Product"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Asegurar que RLS esté habilitado en ambas tablas
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Warehouse_Product" ENABLE ROW LEVEL SECURITY;

-- 4. Verificar que las tablas existan y tengan las columnas necesarias
-- Si la tabla Product no tiene la columna 'type', agregarla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'type'
  ) THEN
    ALTER TABLE "Product" ADD COLUMN "type" text;
  END IF;
END $$;

-- Comentario sobre la migración
COMMENT ON TABLE "Product" IS 'Tabla de productos con políticas RLS permisivas para usuarios autenticados';
COMMENT ON TABLE "Warehouse_Product" IS 'Tabla de relación producto-bodega con políticas RLS permisivas para usuarios autenticados';
