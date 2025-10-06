-- =====================================================
-- Migración: Agregar Políticas RLS para Módulo de Clientes
-- Fecha: 2025-10-06
-- Descripción: Agregar políticas RLS para permitir acceso a usuarios autenticados
--              a las tablas del módulo de clientes
-- =====================================================

-- ============================================
-- 1. POLÍTICAS PARA TABLA Client
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "Client";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "Client";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "Client";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "Client";

-- Crear políticas para usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" 
  ON "Client" FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
  ON "Client" FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" 
  ON "Client" FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" 
  ON "Client" FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 2. POLÍTICAS PARA TABLA ClientContact
-- ============================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "ClientContact";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "ClientContact";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "ClientContact";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "ClientContact";

CREATE POLICY "Enable read access for authenticated users" 
  ON "ClientContact" FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
  ON "ClientContact" FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" 
  ON "ClientContact" FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" 
  ON "ClientContact" FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. POLÍTICAS PARA TABLA ClientTag
-- ============================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "ClientTag";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "ClientTag";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "ClientTag";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "ClientTag";

CREATE POLICY "Enable read access for authenticated users" 
  ON "ClientTag" FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
  ON "ClientTag" FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" 
  ON "ClientTag" FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" 
  ON "ClientTag" FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 4. POLÍTICAS PARA TABLA ClientTagAssignment
-- ============================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "ClientTagAssignment";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "ClientTagAssignment";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "ClientTagAssignment";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "ClientTagAssignment";

CREATE POLICY "Enable read access for authenticated users" 
  ON "ClientTagAssignment" FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
  ON "ClientTagAssignment" FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" 
  ON "ClientTagAssignment" FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" 
  ON "ClientTagAssignment" FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 5. POLÍTICAS PARA TABLA Country
-- ============================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "Country";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "Country";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "Country";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "Country";

CREATE POLICY "Enable read access for authenticated users" 
  ON "Country" FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
  ON "Country" FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" 
  ON "Country" FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" 
  ON "Country" FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 6. POLÍTICAS PARA TABLA EconomicSector
-- ============================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "EconomicSector";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "EconomicSector";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "EconomicSector";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "EconomicSector";

CREATE POLICY "Enable read access for authenticated users" 
  ON "EconomicSector" FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
  ON "EconomicSector" FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" 
  ON "EconomicSector" FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" 
  ON "EconomicSector" FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 7. POLÍTICAS PARA TABLA RelationshipType
-- ============================================

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "RelationshipType";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "RelationshipType";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "RelationshipType";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "RelationshipType";

CREATE POLICY "Enable read access for authenticated users" 
  ON "RelationshipType" FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" 
  ON "RelationshipType" FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" 
  ON "RelationshipType" FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" 
  ON "RelationshipType" FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que RLS esté habilitado
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY['Client', 'ClientContact', 'ClientTag', 'ClientTagAssignment', 
                        'Country', 'EconomicSector', 'RelationshipType'])
  LOOP
    EXECUTE format('ALTER TABLE "%s" ENABLE ROW LEVEL SECURITY', tbl);
    RAISE NOTICE 'RLS habilitado para tabla: %', tbl;
  END LOOP;
END $$;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS creadas exitosamente para módulo de clientes';
  RAISE NOTICE '✅ Usuarios autenticados ahora tienen acceso completo a las tablas de clientes';
END $$;

