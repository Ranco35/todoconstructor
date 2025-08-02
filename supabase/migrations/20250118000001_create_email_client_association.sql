-- Migración para asociar correos electrónicos con clientes
-- Permite tracking completo de comunicaciones por cliente

-- 1. Crear tabla de asociación correos-clientes
CREATE TABLE IF NOT EXISTS "EmailClientAssociation" (
    "id" BIGSERIAL PRIMARY KEY,
    "emailAnalysisId" BIGINT REFERENCES "EmailAnalysis"("id") ON DELETE CASCADE,
    "clientId" BIGINT REFERENCES "Client"("id") ON DELETE CASCADE,
    "senderEmail" TEXT NOT NULL,
    "subject" TEXT,
    "isPaymentRelated" BOOLEAN DEFAULT false,
    "reservationId" BIGINT REFERENCES "reservations"("id") ON DELETE SET NULL,
    "paymentAmount" DECIMAL(12,2),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para consultas eficientes
CREATE INDEX IF NOT EXISTS "idx_email_client_association_client_id" ON "EmailClientAssociation"("clientId");
CREATE INDEX IF NOT EXISTS "idx_email_client_association_email_analysis_id" ON "EmailClientAssociation"("emailAnalysisId");
CREATE INDEX IF NOT EXISTS "idx_email_client_association_sender_email" ON "EmailClientAssociation"("senderEmail");
CREATE INDEX IF NOT EXISTS "idx_email_client_association_payment_related" ON "EmailClientAssociation"("isPaymentRelated");
CREATE INDEX IF NOT EXISTS "idx_email_client_association_reservation_id" ON "EmailClientAssociation"("reservationId");

-- 3. Crear políticas RLS siguiendo el patrón del proyecto
CREATE POLICY "Allow all operations on EmailClientAssociation" ON "EmailClientAssociation"
    FOR ALL 
    TO authenticated
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all for service role on EmailClientAssociation" ON "EmailClientAssociation"
    FOR ALL 
    TO service_role
    USING (true) 
    WITH CHECK (true);

-- 4. Habilitar RLS
ALTER TABLE "EmailClientAssociation" ENABLE ROW LEVEL SECURITY;

-- 5. Función para buscar cliente por email
CREATE OR REPLACE FUNCTION find_client_by_email(p_email TEXT)
RETURNS JSON AS $$
DECLARE
    client_record RECORD;
    result JSON;
BEGIN
    -- Buscar cliente por email (principal o contactos)
    SELECT 
        c.*,
        COUNT(r.id) as total_reservations,
        COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as confirmed_reservations,
        COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_reservations,
        MAX(r.check_in) as last_reservation_date
    INTO client_record
    FROM "Client" c
    LEFT JOIN "reservations" r ON c.id = r.client_id
    WHERE 
        LOWER(c.email) = LOWER(p_email)
        OR EXISTS (
            SELECT 1 FROM "ClientContact" cc 
            WHERE cc."clienteId" = c.id 
            AND LOWER(cc.email) = LOWER(p_email)
        )
    GROUP BY c.id, c.name, c.email, c.phone, c.rut, c.created_at
    LIMIT 1;

    IF client_record IS NULL THEN
        RETURN json_build_object(
            'found', false,
            'email', p_email
        );
    END IF;

    -- Construir respuesta
    result := json_build_object(
        'found', true,
        'client', json_build_object(
            'id', client_record.id,
            'name', client_record.name,
            'email', client_record.email,
            'phone', client_record.phone,
            'rut', client_record.rut,
            'created_at', client_record.created_at
        ),
        'reservations_summary', json_build_object(
            'total', COALESCE(client_record.total_reservations, 0),
            'confirmed', COALESCE(client_record.confirmed_reservations, 0),
            'pending', COALESCE(client_record.pending_reservations, 0),
            'last_reservation_date', client_record.last_reservation_date
        )
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para obtener reservas recientes de un cliente
CREATE OR REPLACE FUNCTION get_client_recent_reservations(p_client_id BIGINT, p_limit INTEGER DEFAULT 5)
RETURNS JSON AS $$
DECLARE
    reservations_json JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', r.id,
            'check_in', r.check_in,
            'check_out', r.check_out,
            'status', r.status,
            'total_amount', r.total_amount,
            'guest_count', r.guest_count,
            'special_requests', r.special_requests,
            'created_at', r.created_at
        ) ORDER BY r.check_in DESC
    )
    INTO reservations_json
    FROM "reservations" r
    WHERE r.client_id = p_client_id
    ORDER BY r.check_in DESC
    LIMIT p_limit;

    RETURN COALESCE(reservations_json, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para asociar correo con cliente
CREATE OR REPLACE FUNCTION associate_email_with_client(
    p_email_analysis_id BIGINT,
    p_sender_email TEXT,
    p_subject TEXT DEFAULT NULL,
    p_is_payment_related BOOLEAN DEFAULT false,
    p_payment_amount DECIMAL DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    client_info JSON;
    association_id BIGINT;
    result JSON;
BEGIN
    -- Buscar cliente
    client_info := find_client_by_email(p_sender_email);
    
    -- Si no se encuentra cliente, crear registro sin asociación
    IF (client_info->>'found')::boolean = false THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cliente no encontrado',
            'email', p_sender_email,
            'client_info', client_info
        );
    END IF;

    -- Crear asociación
    INSERT INTO "EmailClientAssociation" (
        "emailAnalysisId",
        "clientId", 
        "senderEmail",
        "subject",
        "isPaymentRelated",
        "paymentAmount",
        "notes"
    ) VALUES (
        p_email_analysis_id,
        (client_info->'client'->>'id')::BIGINT,
        p_sender_email,
        p_subject,
        p_is_payment_related,
        p_payment_amount,
        p_notes
    ) RETURNING id INTO association_id;

    -- Construir respuesta
    result := json_build_object(
        'success', true,
        'association_id', association_id,
        'client_info', client_info,
        'email_analysis_id', p_email_analysis_id
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant permisos
GRANT EXECUTE ON FUNCTION find_client_by_email TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_recent_reservations TO authenticated;
GRANT EXECUTE ON FUNCTION associate_email_with_client TO authenticated;

-- 9. Comentarios
COMMENT ON TABLE "EmailClientAssociation" IS 'Asociación entre correos analizados y clientes para tracking de comunicaciones';
COMMENT ON FUNCTION find_client_by_email IS 'Busca cliente por email en tablas Client y ClientContact';
COMMENT ON FUNCTION get_client_recent_reservations IS 'Obtiene reservas recientes de un cliente';
COMMENT ON FUNCTION associate_email_with_client IS 'Asocia un correo analizado con un cliente existente'; 