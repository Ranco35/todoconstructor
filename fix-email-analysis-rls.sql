-- Corrección de políticas RLS para EmailAnalysis
-- Siguiendo el patrón estándar del proyecto: docs/troubleshooting/rls-pattern-standardization.md

-- 1. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow all operations on EmailAnalysis" ON "EmailAnalysis";
DROP POLICY IF EXISTS "Enable all for service role on EmailAnalysis" ON "EmailAnalysis";

-- 2. Crear las dos políticas estándar del proyecto
CREATE POLICY "Allow all operations on EmailAnalysis" ON "EmailAnalysis"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on EmailAnalysis" ON "EmailAnalysis"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- 3. Asegurar que RLS esté habilitado
ALTER TABLE "EmailAnalysis" ENABLE ROW LEVEL SECURITY;

-- 4. Comentario de documentación
COMMENT ON TABLE "EmailAnalysis" IS 'Tabla para análisis de correos electrónicos con políticas RLS permisivas para usuarios autenticados';

-- 5. Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'EmailAnalysis'; 