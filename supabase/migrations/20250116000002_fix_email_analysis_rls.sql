-- Migración para corregir políticas RLS de EmailAnalysis
-- Permite que el sistema de análisis de correos funcione correctamente

-- 1. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "email_analysis_select_policy" ON "EmailAnalysis";
DROP POLICY IF EXISTS "email_analysis_insert_policy" ON "EmailAnalysis";
DROP POLICY IF EXISTS "email_analysis_update_policy" ON "EmailAnalysis";
DROP POLICY IF EXISTS "email_analysis_delete_policy" ON "EmailAnalysis";

-- 2. Crear políticas más permisivas para el análisis de correos
-- Permitir SELECT para usuarios autenticados
CREATE POLICY "email_analysis_select_policy" ON "EmailAnalysis"
FOR SELECT 
TO authenticated
USING (true);

-- Permitir INSERT para usuarios autenticados (necesario para crear análisis)
CREATE POLICY "email_analysis_insert_policy" ON "EmailAnalysis"
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para usuarios autenticados (necesario para actualizar estado)
CREATE POLICY "email_analysis_update_policy" ON "EmailAnalysis"
FOR UPDATE 
TO authenticated
USING (true);

-- Permitir DELETE solo para administradores
CREATE POLICY "email_analysis_delete_policy" ON "EmailAnalysis"
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM User 
        WHERE User.id = auth.uid() 
        AND (User.roleId = 1 OR User.role = 'ADMINISTRADOR')
    )
);

-- 3. Asegurar que RLS está habilitado
ALTER TABLE "EmailAnalysis" ENABLE ROW LEVEL SECURITY;

-- 4. Crear función auxiliar para análisis automático (si no existe)
CREATE OR REPLACE FUNCTION create_email_analysis(
    p_analysis_date DATE,
    p_time_slot TEXT,
    p_emails_analyzed INTEGER DEFAULT 0,
    p_summary TEXT DEFAULT 'Análisis en proceso...',
    p_analysis_status TEXT DEFAULT 'processing'
) RETURNS JSON AS $$
DECLARE
    analysis_record "EmailAnalysis"%ROWTYPE;
BEGIN
    -- Insertar registro de análisis
    INSERT INTO "EmailAnalysis" (
        "analysisDate",
        "timeSlot", 
        "emailsAnalyzed",
        "summary",
        "analysisStatus",
        "createdAt"
    ) VALUES (
        p_analysis_date,
        p_time_slot,
        p_emails_analyzed,
        p_summary,
        p_analysis_status,
        NOW()
    ) RETURNING * INTO analysis_record;

    -- Retornar como JSON
    RETURN json_build_object(
        'id', analysis_record.id,
        'analysisDate', analysis_record."analysisDate",
        'timeSlot', analysis_record."timeSlot",
        'emailsAnalyzed', analysis_record."emailsAnalyzed",
        'summary', analysis_record.summary,
        'analysisStatus', analysis_record."analysisStatus",
        'createdAt', analysis_record."createdAt"
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permisos para la función
GRANT EXECUTE ON FUNCTION create_email_analysis TO authenticated;

-- 6. Comentario de la migración
COMMENT ON TABLE "EmailAnalysis" IS 'Tabla para almacenar análisis de correos electrónicos con políticas RLS corregidas';
COMMENT ON FUNCTION create_email_analysis IS 'Función auxiliar para crear análisis de correos con permisos apropiados'; 