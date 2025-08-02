-- ================================================
-- MIGRACIÓN: Crear tabla email_analysis
-- ================================================
-- Esta tabla almacena análisis automáticos de correos electrónicos
-- para el sistema de administración de Hotel/Spa Admintermas

-- 1. Crear tabla email_analysis
CREATE TABLE IF NOT EXISTS public.email_analysis (
    id SERIAL PRIMARY KEY,
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_slot TEXT NOT NULL DEFAULT 'morning',
    emails_analyzed INTEGER NOT NULL DEFAULT 0,
    summary TEXT DEFAULT 'Análisis en proceso...',
    analysis_status TEXT NOT NULL DEFAULT 'processing',
    execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Campos adicionales para métricas
    emails_processed INTEGER DEFAULT 0,
    emails_failed INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    error_details TEXT,
    
    -- Índices para optimizar consultas
    CONSTRAINT uk_email_analysis_date_slot UNIQUE (analysis_date, time_slot)
);

-- 2. Crear índices para optimizar rendimiento
CREATE INDEX IF NOT EXISTS idx_email_analysis_date ON email_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_email_analysis_status ON email_analysis(analysis_status);
CREATE INDEX IF NOT EXISTS idx_email_analysis_execution_time ON email_analysis(execution_time);
CREATE INDEX IF NOT EXISTS idx_email_analysis_user_id ON email_analysis(user_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE email_analysis ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS permisivas para el sistema
-- Permitir SELECT para usuarios autenticados
CREATE POLICY "email_analysis_select_policy" ON email_analysis
FOR SELECT 
TO authenticated
USING (true);

-- Permitir INSERT para usuarios autenticados
CREATE POLICY "email_analysis_insert_policy" ON email_analysis
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para usuarios autenticados
CREATE POLICY "email_analysis_update_policy" ON email_analysis
FOR UPDATE 
TO authenticated
USING (true);

-- Permitir DELETE solo para administradores
CREATE POLICY "email_analysis_delete_policy" ON email_analysis
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM "User" 
        WHERE "User".id = auth.uid() 
        AND ("User"."roleId" = 1 OR "User".role = 'ADMINISTRADOR')
    )
);

-- 5. Crear función de trigger para updated_at
CREATE OR REPLACE FUNCTION update_email_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER trigger_email_analysis_updated_at
    BEFORE UPDATE ON email_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_email_analysis_updated_at();

-- 7. Insertar datos de ejemplo para testing
INSERT INTO email_analysis (
    analysis_date,
    time_slot,
    emails_analyzed,
    summary,
    analysis_status,
    emails_processed,
    processing_time_ms
) VALUES 
(
    CURRENT_DATE,
    'morning',
    0,
    'Sistema inicializado - Sin análisis previos',
    'completed',
    0,
    0
) ON CONFLICT (analysis_date, time_slot) DO NOTHING;

-- 8. Comentarios para documentación
COMMENT ON TABLE email_analysis IS 'Almacena análisis automáticos de correos electrónicos del sistema';
COMMENT ON COLUMN email_analysis.analysis_date IS 'Fecha del análisis';
COMMENT ON COLUMN email_analysis.time_slot IS 'Franja horaria del análisis (morning, afternoon, evening)';
COMMENT ON COLUMN email_analysis.emails_analyzed IS 'Número de emails analizados';
COMMENT ON COLUMN email_analysis.summary IS 'Resumen del análisis realizado';
COMMENT ON COLUMN email_analysis.analysis_status IS 'Estado del análisis (processing, completed, failed)';
COMMENT ON COLUMN email_analysis.execution_time IS 'Momento de ejecución del análisis';

-- 9. Grant permisos
GRANT ALL ON email_analysis TO authenticated;
GRANT USAGE ON SEQUENCE email_analysis_id_seq TO authenticated; 