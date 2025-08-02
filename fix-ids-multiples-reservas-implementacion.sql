-- ================================================
-- SOLUCIÓN COMPLETA - NORMALIZACIÓN IDS RESERVAS
-- ================================================

-- 🎯 PASO 1: Crear vista unificada que resuelve el problema de IDs múltiples
CREATE OR REPLACE VIEW v_reservas_normalizadas AS
SELECT 
    -- IDs principales con nombres descriptivos
    r.id as id_reserva_principal,
    mr.id as id_reserva_modular,
    
    -- Información del cliente (fuente autoritativa)
    c.id as cliente_id,
    c."nombrePrincipal" as cliente_nombre,
    c."apellido" as cliente_apellido,
    c."rut" as cliente_rut,
    c."email" as cliente_email,
    
    -- Información del huésped (puede ser diferente al cliente)
    COALESCE(mr.guest_name, r.guest_name) as huesped_nombre,
    COALESCE(mr.guest_email, r.guest_email) as huesped_email,
    
    -- Fechas (usar modular como fuente principal)
    COALESCE(mr.check_in, r.check_in) as check_in,
    COALESCE(mr.check_out, r.check_out) as check_out,
    
    -- Estados (normalizar)
    COALESCE(mr.status, r.status) as estado_principal,
    r.status as estado_reservations,
    mr.status as estado_modular,
    
    -- Información de habitación y paquete
    mr.room_code as habitacion,
    mr.package_code as paquete_codigo,
    mr.adults,
    mr.children,
    
    -- Información financiera
    COALESCE(mr.grand_total, mr.total_amount, r.total_amount) as monto_total,
    COALESCE(mr.payment_status, r.payment_status) as estado_pago,
    
    -- Fechas de creación
    r.created_at as creado_reservations,
    mr.created_at as creado_modular,
    
    -- Indicador de consistencia
    CASE 
        WHEN mr.reservation_id = r.id THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE'
    END as estado_consistencia,
    
    -- Fuente de datos
    CASE 
        WHEN mr.id IS NOT NULL AND r.id IS NOT NULL THEN 'AMBAS_TABLAS'
        WHEN mr.id IS NOT NULL THEN 'SOLO_MODULAR'
        WHEN r.id IS NOT NULL THEN 'SOLO_PRINCIPAL'
        ELSE 'ERROR'
    END as fuente_datos
    
FROM reservations r
FULL OUTER JOIN modular_reservations mr ON (
    mr.reservation_id = r.id  -- Relación CORRECTA
)
LEFT JOIN "Client" c ON c.id = COALESCE(mr.client_id, r.client_id);

-- 🎯 PASO 2: Crear función para obtener nombre completo consistente
CREATE OR REPLACE FUNCTION get_reservation_display_name(
    p_reservation_id INTEGER
) RETURNS TEXT AS $$
DECLARE
    v_cliente_nombre TEXT;
    v_huesped_nombre TEXT;
    v_resultado TEXT;
BEGIN
    SELECT 
        CONCAT(cliente_nombre, ' ', COALESCE(cliente_apellido, '')) as cliente_completo,
        huesped_nombre
    INTO v_cliente_nombre, v_huesped_nombre
    FROM v_reservas_normalizadas 
    WHERE id_reserva_principal = p_reservation_id;
    
    -- Si cliente y huésped son diferentes, mostrar ambos
    IF v_cliente_nombre != v_huesped_nombre AND v_huesped_nombre IS NOT NULL THEN
        v_resultado := v_cliente_nombre || ' (Huésped: ' || v_huesped_nombre || ')';
    ELSE
        v_resultado := v_cliente_nombre;
    END IF;
    
    RETURN COALESCE(v_resultado, 'Cliente no encontrado');
END;
$$ LANGUAGE plpgsql;

-- 🎯 PASO 3: Consulta para verificar la corrección del problema ID 64
SELECT 
    '🔍 VERIFICACIÓN RESERVA ID 64' as tipo_consulta,
    id_reserva_principal,
    id_reserva_modular,
    cliente_nombre,
    cliente_apellido,
    huesped_nombre,
    habitacion,
    paquete_codigo,
    estado_principal,
    estado_consistencia,
    fuente_datos
FROM v_reservas_normalizadas 
WHERE id_reserva_principal = 64 OR id_reserva_modular = 64
ORDER BY id_reserva_principal;

-- 🎯 PASO 4: Identificar TODAS las reservas con problemas similares
SELECT 
    '⚠️ RESERVAS CON PROBLEMAS DE CONSISTENCIA' as tipo_consulta,
    id_reserva_principal,
    id_reserva_modular,
    cliente_nombre,
    huesped_nombre,
    estado_consistencia,
    COUNT(*) OVER () as total_problemas
FROM v_reservas_normalizadas 
WHERE estado_consistencia = '❌ INCONSISTENTE'
ORDER BY id_reserva_principal;

-- 🎯 PASO 5: Función para obtener reserva corregida por ID
CREATE OR REPLACE FUNCTION get_reserva_normalizada_by_id(
    p_id INTEGER,
    p_tipo TEXT DEFAULT 'principal' -- 'principal' o 'modular'
) RETURNS TABLE (
    reserva_id INTEGER,
    reserva_modular_id INTEGER,
    cliente_completo TEXT,
    huesped_nombre TEXT,
    habitacion TEXT,
    paquete TEXT,
    estado TEXT,
    check_in DATE,
    check_out DATE,
    monto_total NUMERIC,
    estado_consistencia TEXT
) AS $$
BEGIN
    IF p_tipo = 'principal' THEN
        RETURN QUERY
        SELECT 
            v.id_reserva_principal,
            v.id_reserva_modular,
            CONCAT(v.cliente_nombre, ' ', COALESCE(v.cliente_apellido, '')) as cliente_completo,
            v.huesped_nombre,
            v.habitacion,
            v.paquete_codigo,
            v.estado_principal,
            v.check_in::DATE,
            v.check_out::DATE,
            v.monto_total,
            v.estado_consistencia
        FROM v_reservas_normalizadas v
        WHERE v.id_reserva_principal = p_id;
    ELSE
        RETURN QUERY
        SELECT 
            v.id_reserva_principal,
            v.id_reserva_modular,
            CONCAT(v.cliente_nombre, ' ', COALESCE(v.cliente_apellido, '')) as cliente_completo,
            v.huesped_nombre,
            v.habitacion,
            v.paquete_codigo,
            v.estado_principal,
            v.check_in::DATE,
            v.check_out::DATE,
            v.monto_total,
            v.estado_consistencia
        FROM v_reservas_normalizadas v
        WHERE v.id_reserva_modular = p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 🎯 PASO 6: Prueba de la función con el caso problemático
SELECT 
    '🧪 PRUEBA FUNCIÓN - RESERVA PRINCIPAL 64' as prueba,
    * 
FROM get_reserva_normalizada_by_id(64, 'principal');

SELECT 
    '🧪 PRUEBA FUNCIÓN - RESERVA MODULAR 64' as prueba,
    * 
FROM get_reserva_normalizada_by_id(64, 'modular');

-- 🎯 PASO 7: Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_modular_reservations_reservation_id 
ON modular_reservations(reservation_id);

CREATE INDEX IF NOT EXISTS idx_client_id_nombres 
ON "Client"(id, "nombrePrincipal", "apellido");

-- ✅ RESULTADO ESPERADO:
-- 1. Vista v_reservas_normalizadas unifica datos de ambas tablas
-- 2. Función get_reservation_display_name() provee nombres consistentes  
-- 3. Función get_reserva_normalizada_by_id() obtiene datos normalizados
-- 4. Consultas de verificación muestran el problema y su solución
-- 5. Índices optimizan rendimiento de las consultas

COMMENT ON VIEW v_reservas_normalizadas IS 
'Vista que normaliza y unifica datos de reservas principales y modulares, resolviendo problemas de IDs múltiples';

COMMENT ON FUNCTION get_reservation_display_name IS 
'Función que retorna nombre consistente para mostrar en interfaces, manejando casos donde cliente y huésped son diferentes';

COMMENT ON FUNCTION get_reserva_normalizada_by_id IS 
'Función que obtiene datos normalizados de reserva por ID, especificando si es ID principal o modular'; 