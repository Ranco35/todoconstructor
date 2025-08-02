-- Script seguro para crear sistema de backups
-- Elimina elementos existentes antes de crear nuevos

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_update_system_backups_updated_at ON system_backups;

-- Eliminar función si existe
DROP FUNCTION IF EXISTS update_system_backups_updated_at();

-- Eliminar políticas RLS si existen
DROP POLICY IF EXISTS "Administradores pueden ver todos los backups" ON system_backups;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios backups" ON system_backups;

-- Eliminar índices si existen
DROP INDEX IF EXISTS idx_system_backups_status;
DROP INDEX IF EXISTS idx_system_backups_created_at;
DROP INDEX IF EXISTS idx_system_backups_created_by;

-- Eliminar tabla si existe
DROP TABLE IF EXISTS system_backups;

-- Crear tabla para sistema de backups
CREATE TABLE system_backups (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_table TEXT,
    total_tables INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    record_count INTEGER DEFAULT 0,
    file_size TEXT,
    tables TEXT[],
    error_message TEXT
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_system_backups_status ON system_backups(status);
CREATE INDEX idx_system_backups_created_at ON system_backups(created_at DESC);
CREATE INDEX idx_system_backups_created_by ON system_backups(created_by);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_system_backups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER trigger_update_system_backups_updated_at
    BEFORE UPDATE ON system_backups
    FOR EACH ROW
    EXECUTE FUNCTION update_system_backups_updated_at();

-- Políticas RLS para system_backups
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

-- Política para administradores (pueden ver todos los backups)
CREATE POLICY "Administradores pueden ver todos los backups" ON system_backups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND (u.raw_user_meta_data->>'role' = 'ADMIN' OR u.raw_user_meta_data->>'role' = 'admin')
        )
    );

-- Política para usuarios que crearon el backup (pueden ver sus propios backups)
CREATE POLICY "Usuarios pueden ver sus propios backups" ON system_backups
    FOR SELECT USING (created_by = auth.uid()); 