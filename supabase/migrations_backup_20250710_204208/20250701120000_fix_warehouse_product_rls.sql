-- Habilitar RLS si no está habilitado
ALTER TABLE "Warehouse_Product" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen (opcional)
DROP POLICY IF EXISTS "Allow all insert for service role" ON "Warehouse_Product";
DROP POLICY IF EXISTS "Allow all update for service role" ON "Warehouse_Product";

-- Permitir INSERT solo al rol de servicio
CREATE POLICY "Allow all insert for service role"
  ON "Warehouse_Product"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Permitir UPDATE solo al rol de servicio
CREATE POLICY "Allow all update for service role"
  ON "Warehouse_Product"
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true); 