-- Políticas RLS para POSTable (mesas restaurante)
-- Permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "POSTable";
CREATE POLICY "Enable read access for authenticated users" ON "POSTable"
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Permitir acceso total al service role
DROP POLICY IF EXISTS "Service role can do everything on POSTable" ON "POSTable";
CREATE POLICY "Service role can do everything on POSTable" ON "POSTable"
  FOR ALL
  USING (auth.role() = 'service_role'); 