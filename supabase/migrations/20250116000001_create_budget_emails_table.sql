-- Crear tabla para historial de emails de presupuestos
-- Fecha: 2025-01-16
-- Descripción: Almacena el historial de emails enviados y recibidos para cada presupuesto

CREATE TABLE IF NOT EXISTS budget_emails (
    id BIGSERIAL PRIMARY KEY,
    budget_id BIGINT NOT NULL REFERENCES sales_quotes(id) ON DELETE CASCADE,
    email_type VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (email_type IN ('sent', 'received')),
    recipient_email VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    message_id VARCHAR(255), -- ID del email del proveedor (Gmail, etc.)
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC'::TEXT, NOW()),
    sent_by UUID REFERENCES "User"(id), -- Usuario que envió el email
    attachments JSONB DEFAULT '[]'::jsonb, -- Información de archivos adjuntos
    metadata JSONB DEFAULT '{}'::jsonb -- Información adicional (plantilla usada, etc.)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_budget_emails_budget_id ON budget_emails(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_emails_email_type ON budget_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_budget_emails_status ON budget_emails(status);
CREATE INDEX IF NOT EXISTS idx_budget_emails_sent_at ON budget_emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_emails_recipient ON budget_emails(recipient_email);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_budget_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('UTC'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_emails_updated_at_trigger
  BEFORE UPDATE ON budget_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_emails_updated_at();

-- Comentarios explicativos
COMMENT ON TABLE budget_emails IS 'Historial de emails enviados y recibidos para presupuestos';
COMMENT ON COLUMN budget_emails.email_type IS 'Tipo de email: sent (enviado), received (recibido)';
COMMENT ON COLUMN budget_emails.status IS 'Estado del email: pending, sent, delivered, failed, bounced';
COMMENT ON COLUMN budget_emails.message_id IS 'ID único del mensaje del proveedor de email';
COMMENT ON COLUMN budget_emails.attachments IS 'Array JSON con información de archivos adjuntos';
COMMENT ON COLUMN budget_emails.metadata IS 'Información adicional como plantilla usada, configuración';

-- Políticas RLS para seguridad
ALTER TABLE budget_emails ENABLE ROW LEVEL SECURITY;

-- Solo usuarios autenticados pueden acceder
CREATE POLICY "Users can view budget emails" ON budget_emails
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert budget emails" ON budget_emails
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update budget emails" ON budget_emails
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Solo administradores pueden eliminar
CREATE POLICY "Admins can delete budget emails" ON budget_emails
    FOR DELETE USING (auth.role() = 'authenticated');

-- Vista para consultas optimizadas con información del presupuesto y cliente
CREATE OR REPLACE VIEW budget_emails_with_details AS
SELECT 
    be.*,
    sq.number as budget_number,
    sq.status as budget_status,
    sq.total as budget_total,
    c.id as client_id,
    c."nombrePrincipal" as client_name,
    c."apellido" as client_lastname,
    c.email as client_email,
    u.name as sent_by_name
FROM budget_emails be
LEFT JOIN sales_quotes sq ON be.budget_id = sq.id
LEFT JOIN "Client" c ON sq.client_id = c.id
LEFT JOIN "User" u ON be.sent_by = u.id
ORDER BY be.created_at DESC;

-- Función para obtener estadísticas de emails por presupuesto
CREATE OR REPLACE FUNCTION get_budget_email_stats(p_budget_id BIGINT)
RETURNS TABLE (
    total_emails BIGINT,
    sent_emails BIGINT,
    received_emails BIGINT,
    successful_emails BIGINT,
    failed_emails BIGINT,
    last_email_sent TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_emails,
        COUNT(*) FILTER (WHERE email_type = 'sent')::BIGINT as sent_emails,
        COUNT(*) FILTER (WHERE email_type = 'received')::BIGINT as received_emails,
        COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))::BIGINT as successful_emails,
        COUNT(*) FILTER (WHERE status IN ('failed', 'bounced'))::BIGINT as failed_emails,
        MAX(sent_at) as last_email_sent
    FROM budget_emails
    WHERE budget_id = p_budget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 