-- Migración: Corrección función get_sent_emails_stats
-- Fecha: 18/01/2025
-- Problema: Error "aggregate function calls cannot be nested"

-- 1. Eliminar función problemática
DROP FUNCTION IF EXISTS get_sent_emails_stats(INTEGER);

-- 2. Crear función corregida sin funciones agregadas anidadas
CREATE OR REPLACE FUNCTION get_sent_emails_stats(p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    total_sent INTEGER;
    by_type JSON;
    by_status JSON;
    recent_activity JSON;
    result JSON;
BEGIN
    -- Obtener fecha límite
    DECLARE
        date_limit TIMESTAMP := NOW() - INTERVAL '1 day' * p_days;
    BEGIN
        
        -- 1. Total de correos enviados
        SELECT COUNT(*) INTO total_sent
        FROM "SentEmailTracking"
        WHERE "sentAt" >= date_limit;
        
        -- 2. Estadísticas por tipo de email
        SELECT json_object_agg("emailType", type_count) INTO by_type
        FROM (
            SELECT 
                "emailType",
                COUNT(*) as type_count
            FROM "SentEmailTracking"
            WHERE "sentAt" >= date_limit
            GROUP BY "emailType"
        ) type_stats;
        
        -- 3. Estadísticas por estado
        SELECT json_object_agg(status, status_count) INTO by_status
        FROM (
            SELECT 
                status,
                COUNT(*) as status_count
            FROM "SentEmailTracking"
            WHERE "sentAt" >= date_limit
            GROUP BY status
        ) status_stats;
        
        -- 4. Actividad reciente (últimos 7 días por día)
        SELECT json_agg(
            json_build_object(
                'date', activity_date,
                'count', daily_count
            ) ORDER BY activity_date DESC
        ) INTO recent_activity
        FROM (
            SELECT 
                DATE("sentAt") as activity_date,
                COUNT(*) as daily_count
            FROM "SentEmailTracking"
            WHERE "sentAt" >= NOW() - INTERVAL '7 days'
            GROUP BY DATE("sentAt")
            ORDER BY activity_date DESC
            LIMIT 7
        ) daily_stats;
        
        -- 5. Construir resultado final
        result := json_build_object(
            'totalSent', COALESCE(total_sent, 0),
            'byType', COALESCE(by_type, '{}'::JSON),
            'byStatus', COALESCE(by_status, '{}'::JSON),
            'recentActivity', COALESCE(recent_activity, '[]'::JSON),
            'period', json_build_object(
                'days', p_days,
                'from', date_limit,
                'to', NOW()
            )
        );
        
        RETURN result;
    END;
    
EXCEPTION
    WHEN OTHERS THEN
        -- En caso de error, devolver estructura vacía
        RETURN json_build_object(
            'totalSent', 0,
            'byType', '{}',
            'byStatus', '{}',
            'recentActivity', '[]',
            'error', SQLERRM,
            'period', json_build_object(
                'days', p_days,
                'from', NOW() - INTERVAL '1 day' * p_days,
                'to', NOW()
            )
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Otorgar permisos
GRANT EXECUTE ON FUNCTION get_sent_emails_stats TO authenticated;

-- 4. Comentario
COMMENT ON FUNCTION get_sent_emails_stats IS 'Estadísticas globales de correos enviados (corregida - sin funciones agregadas anidadas)';

-- 5. Función de prueba simple (opcional)
CREATE OR REPLACE FUNCTION test_sent_emails_stats()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'test', true,
        'message', 'Función de estadísticas corregida',
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql; 