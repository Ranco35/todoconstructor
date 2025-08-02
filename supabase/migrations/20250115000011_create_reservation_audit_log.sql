-- ================================================
-- TABLA DE HISTORIAL DE CAMBIOS (AUDIT LOG)
-- ================================================

-- Crear tabla para el historial de cambios de reservas
CREATE TABLE public.reservation_audit_log (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    
    -- Información del cambio
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Datos del cambio
    field_name VARCHAR(100),        -- Campo que cambió (NULL para CREATE/DELETE)
    old_value TEXT,                 -- Valor anterior (NULL para CREATE)
    new_value TEXT,                 -- Valor nuevo (NULL para DELETE)
    
    -- Contexto adicional
    change_reason TEXT,             -- Razón del cambio (opcional)
    ip_address INET,                -- IP desde donde se hizo el cambio
    user_agent TEXT,                -- Información del navegador
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para optimizar consultas
CREATE INDEX idx_reservation_audit_log_reservation_id ON public.reservation_audit_log (reservation_id);
CREATE INDEX idx_reservation_audit_log_user_id ON public.reservation_audit_log (user_id);
CREATE INDEX idx_reservation_audit_log_action_type ON public.reservation_audit_log (action_type);
CREATE INDEX idx_reservation_audit_log_created_at ON public.reservation_audit_log (created_at DESC);
CREATE INDEX idx_reservation_audit_log_field_name ON public.reservation_audit_log (field_name);

-- Comentarios para documentar la tabla
COMMENT ON TABLE public.reservation_audit_log IS 'Historial completo de cambios realizados a las reservas';
COMMENT ON COLUMN public.reservation_audit_log.action_type IS 'Tipo de acción: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN public.reservation_audit_log.field_name IS 'Campo específico que cambió (NULL para CREATE/DELETE)';
COMMENT ON COLUMN public.reservation_audit_log.old_value IS 'Valor anterior del campo';
COMMENT ON COLUMN public.reservation_audit_log.new_value IS 'Valor nuevo del campo';
COMMENT ON COLUMN public.reservation_audit_log.change_reason IS 'Razón del cambio proporcionada por el usuario';

-- Habilitar RLS para seguridad
ALTER TABLE public.reservation_audit_log ENABLE ROW LEVEL SECURITY;

-- Política RLS: Solo usuarios autenticados pueden ver el historial
CREATE POLICY "Users can view audit log" ON public.reservation_audit_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política RLS: Solo el sistema puede insertar en el audit log
CREATE POLICY "System can insert audit log" ON public.reservation_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 