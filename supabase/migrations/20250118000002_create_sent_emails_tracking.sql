-- Migración para tracking completo de correos enviados
-- Permite seguimiento de todas las comunicaciones salientes

-- 1. Crear tabla principal de correos enviados
CREATE TABLE IF NOT EXISTS "SentEmailTracking" (
    "id" BIGSERIAL PRIMARY KEY,
    "clientId" BIGINT REFERENCES "Client"("id") ON DELETE CASCADE,
    "reservationId" BIGINT REFERENCES "reservations"("id") ON DELETE SET NULL,
    "budgetId" BIGINT REFERENCES "sales_quotes"("id") ON DELETE SET NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "senderEmail" TEXT NOT NULL,
    "senderName" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "emailType" TEXT NOT NULL, -- 'confirmation', 'reminder', 'payment_request', 'follow_up', 'marketing', 'custom'
    "status" TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
    "isAutomated" BOOLEAN DEFAULT false,
    "templateUsed" TEXT,
    "attachments" JSONB,
    "metadata" JSONB,
    "sentAt" TIMESTAMPTZ DEFAULT NOW(),
    "deliveredAt" TIMESTAMPTZ,
    "openedAt" TIMESTAMPTZ,
    "clickedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de resumen de comunicaciones por cliente
CREATE TABLE IF NOT EXISTS "ClientCommunicationSummary" (
    "id" BIGSERIAL PRIMARY KEY,
    "clientId" BIGINT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "totalEmailsSent" INTEGER DEFAULT 0,
    "totalEmailsReceived" INTEGER DEFAULT 0,
    "lastEmailSent" TIMESTAMPTZ,
    "lastEmailReceived" TIMESTAMPTZ,
    "totalReservationEmails" INTEGER DEFAULT 0,
    "totalBudgetEmails" INTEGER DEFAULT 0,
    "totalPaymentEmails" INTEGER DEFAULT 0,
    "communicationScore" INTEGER DEFAULT 0, -- 1-10 basado en frecuencia y respuesta
    "preferredContactMethod" TEXT, -- 'email', 'phone', 'whatsapp'
    "responseRate" DECIMAL(5,2) DEFAULT 0, -- Porcentaje de emails que reciben respuesta
    "avgResponseTime" INTERVAL, -- Tiempo promedio de respuesta
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("clientId")
);

-- 3. Crear índices para consultas eficientes
CREATE INDEX IF NOT EXISTS "idx_sent_email_tracking_client_id" ON "SentEmailTracking"("clientId");
CREATE INDEX IF NOT EXISTS "idx_sent_email_tracking_reservation_id" ON "SentEmailTracking"("reservationId");
CREATE INDEX IF NOT EXISTS "idx_sent_email_tracking_budget_id" ON "SentEmailTracking"("budgetId");
CREATE INDEX IF NOT EXISTS "idx_sent_email_tracking_recipient_email" ON "SentEmailTracking"("recipientEmail");
CREATE INDEX IF NOT EXISTS "idx_sent_email_tracking_email_type" ON "SentEmailTracking"("emailType");
CREATE INDEX IF NOT EXISTS "idx_sent_email_tracking_status" ON "SentEmailTracking"("status");
CREATE INDEX IF NOT EXISTS "idx_sent_email_tracking_sent_at" ON "SentEmailTracking"("sentAt");

CREATE INDEX IF NOT EXISTS "idx_client_communication_summary_client_id" ON "ClientCommunicationSummary"("clientId");
CREATE INDEX IF NOT EXISTS "idx_client_communication_summary_score" ON "ClientCommunicationSummary"("communicationScore");

-- 4. Crear políticas RLS
CREATE POLICY "Allow all operations on SentEmailTracking" ON "SentEmailTracking"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on SentEmailTracking" ON "SentEmailTracking"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow all operations on ClientCommunicationSummary" ON "ClientCommunicationSummary"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on ClientCommunicationSummary" ON "ClientCommunicationSummary"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- 5. Habilitar RLS
ALTER TABLE "SentEmailTracking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientCommunicationSummary" ENABLE ROW LEVEL SECURITY;

-- 6. Función para registrar correo enviado
CREATE OR REPLACE FUNCTION track_sent_email(
    p_client_id BIGINT,
    p_recipient_email TEXT,
    p_recipient_name TEXT DEFAULT NULL,
    p_sender_email TEXT DEFAULT 'info@admintermas.com',
    p_sender_name TEXT DEFAULT 'Hotel Termas Llifén',
    p_subject TEXT DEFAULT '',
    p_body TEXT DEFAULT '',
    p_email_type TEXT DEFAULT 'custom',
    p_reservation_id BIGINT DEFAULT NULL,
    p_budget_id BIGINT DEFAULT NULL,
    p_template_used TEXT DEFAULT NULL,
    p_is_automated BOOLEAN DEFAULT false,
    p_attachments JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    sent_email_id BIGINT;
    result JSON;
BEGIN
    -- Insertar registro de correo enviado
    INSERT INTO "SentEmailTracking" (
        "clientId",
        "reservationId", 
        "budgetId",
        "recipientEmail",
        "recipientName",
        "senderEmail",
        "senderName",
        "subject",
        "body",
        "emailType",
        "isAutomated",
        "templateUsed",
        "attachments",
        "metadata"
    ) VALUES (
        p_client_id,
        p_reservation_id,
        p_budget_id,
        p_recipient_email,
        p_recipient_name,
        p_sender_email,
        p_sender_name,
        p_subject,
        p_body,
        p_email_type,
        p_is_automated,
        p_template_used,
        p_attachments,
        p_metadata
    ) RETURNING id INTO sent_email_id;

    -- Actualizar resumen de comunicaciones del cliente
    INSERT INTO "ClientCommunicationSummary" ("clientId", "totalEmailsSent", "lastEmailSent")
    VALUES (p_client_id, 1, NOW())
    ON CONFLICT ("clientId") 
    DO UPDATE SET 
        "totalEmailsSent" = "ClientCommunicationSummary"."totalEmailsSent" + 1,
        "lastEmailSent" = NOW(),
        "totalReservationEmails" = CASE 
            WHEN p_reservation_id IS NOT NULL 
            THEN "ClientCommunicationSummary"."totalReservationEmails" + 1 
            ELSE "ClientCommunicationSummary"."totalReservationEmails"
        END,
        "totalBudgetEmails" = CASE 
            WHEN p_budget_id IS NOT NULL 
            THEN "ClientCommunicationSummary"."totalBudgetEmails" + 1 
            ELSE "ClientCommunicationSummary"."totalBudgetEmails"
        END,
        "totalPaymentEmails" = CASE 
            WHEN p_email_type = 'payment_request' 
            THEN "ClientCommunicationSummary"."totalPaymentEmails" + 1 
            ELSE "ClientCommunicationSummary"."totalPaymentEmails"
        END,
        "updatedAt" = NOW();

    -- Construir respuesta
    result := json_build_object(
        'success', true,
        'sent_email_id', sent_email_id,
        'client_id', p_client_id,
        'email_type', p_email_type,
        'sent_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para obtener resumen de comunicaciones de un cliente
CREATE OR REPLACE FUNCTION get_client_communication_summary(p_client_id BIGINT)
RETURNS JSON AS $$
DECLARE
    summary_record RECORD;
    recent_sent_emails JSON;
    recent_received_emails JSON;
    result JSON;
BEGIN
    -- Obtener resumen de comunicaciones
    SELECT * INTO summary_record
    FROM "ClientCommunicationSummary"
    WHERE "clientId" = p_client_id;

    -- Obtener correos enviados recientes
    SELECT json_agg(
        json_build_object(
            'id', id,
            'subject', subject,
            'emailType', "emailType",
            'sentAt', "sentAt",
            'status', status,
            'reservationId', "reservationId",
            'budgetId', "budgetId"
        ) ORDER BY "sentAt" DESC
    ) INTO recent_sent_emails
    FROM "SentEmailTracking"
    WHERE "clientId" = p_client_id
    ORDER BY "sentAt" DESC
    LIMIT 10;

    -- Obtener correos recibidos recientes
    SELECT json_agg(
        json_build_object(
            'id', eca.id,
            'subject', eca.subject,
            'isPaymentRelated', eca."isPaymentRelated",
            'createdAt', eca."createdAt",
            'paymentAmount', eca."paymentAmount"
        ) ORDER BY eca."createdAt" DESC
    ) INTO recent_received_emails
    FROM "EmailClientAssociation" eca
    WHERE eca."clientId" = p_client_id
    ORDER BY eca."createdAt" DESC
    LIMIT 10;

    -- Construir respuesta completa
    result := json_build_object(
        'client_id', p_client_id,
        'summary', CASE 
            WHEN summary_record IS NOT NULL THEN json_build_object(
                'totalEmailsSent', summary_record."totalEmailsSent",
                'totalEmailsReceived', summary_record."totalEmailsReceived",
                'lastEmailSent', summary_record."lastEmailSent",
                'lastEmailReceived', summary_record."lastEmailReceived",
                'totalReservationEmails', summary_record."totalReservationEmails",
                'totalBudgetEmails', summary_record."totalBudgetEmails",
                'totalPaymentEmails', summary_record."totalPaymentEmails",
                'communicationScore', summary_record."communicationScore",
                'responseRate', summary_record."responseRate"
            )
            ELSE json_build_object(
                'totalEmailsSent', 0,
                'totalEmailsReceived', 0,
                'totalReservationEmails', 0,
                'totalBudgetEmails', 0,
                'totalPaymentEmails', 0,
                'communicationScore', 0,
                'responseRate', 0
            )
        END,
        'recentSentEmails', COALESCE(recent_sent_emails, '[]'::json),
        'recentReceivedEmails', COALESCE(recent_received_emails, '[]'::json)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para obtener estadísticas globales de correos enviados
CREATE OR REPLACE FUNCTION get_sent_emails_stats(p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalSent', COUNT(*),
        'byType', json_object_agg("emailType", type_count),
        'byStatus', json_object_agg(status, status_count),
        'recentActivity', recent_activity
    ) INTO result
    FROM (
        SELECT 
            "emailType",
            status,
            COUNT(*) FILTER (WHERE "emailType" = "emailType") as type_count,
            COUNT(*) FILTER (WHERE status = status) as status_count,
            json_agg(
                json_build_object(
                    'date', DATE("sentAt"),
                    'count', COUNT(*)
                ) ORDER BY DATE("sentAt") DESC
            ) as recent_activity
        FROM "SentEmailTracking"
        WHERE "sentAt" >= NOW() - INTERVAL '%s days'
        GROUP BY "emailType", status
    ) stats;

    RETURN COALESCE(result, json_build_object(
        'totalSent', 0,
        'byType', '{}',
        'byStatus', '{}',
        'recentActivity', '[]'
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger para actualizar automáticamente el resumen cuando llegan correos recibidos
CREATE OR REPLACE FUNCTION update_communication_summary_on_received_email()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "ClientCommunicationSummary" ("clientId", "totalEmailsReceived", "lastEmailReceived")
    VALUES (NEW."clientId", 1, NOW())
    ON CONFLICT ("clientId") 
    DO UPDATE SET 
        "totalEmailsReceived" = "ClientCommunicationSummary"."totalEmailsReceived" + 1,
        "lastEmailReceived" = NOW(),
        "updatedAt" = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_communication_summary ON "EmailClientAssociation";
CREATE TRIGGER trigger_update_communication_summary
    AFTER INSERT ON "EmailClientAssociation"
    FOR EACH ROW
    EXECUTE FUNCTION update_communication_summary_on_received_email();

-- 10. Grant permisos
GRANT EXECUTE ON FUNCTION track_sent_email TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_communication_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_sent_emails_stats TO authenticated;

-- 11. Comentarios
COMMENT ON TABLE "SentEmailTracking" IS 'Tracking completo de correos enviados a clientes';
COMMENT ON TABLE "ClientCommunicationSummary" IS 'Resumen de comunicaciones por cliente (enviados + recibidos)';
COMMENT ON FUNCTION track_sent_email IS 'Registra un correo enviado y actualiza estadísticas del cliente';
COMMENT ON FUNCTION get_client_communication_summary IS 'Obtiene resumen completo de comunicaciones de un cliente';
COMMENT ON FUNCTION get_sent_emails_stats IS 'Estadísticas globales de correos enviados';

-- 12. Verificación final
SELECT 'Sent email tracking system installed successfully' as status; 