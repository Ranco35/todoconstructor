-- ================================================
-- PROPUESTA DE NORMALIZACIÓN - SISTEMA IDS RESERVAS
-- ================================================

-- 🎯 PROBLEMA IDENTIFICADO:
-- El sistema tiene dos tablas (reservations y modular_reservations) que pueden mostrar nombres diferentes
-- para la misma reserva, causando confusión en la gestión.

-- 📋 OPCIÓN 1: NORMALIZAR MOSTRANDO AMBOS IDS CON NOMBRES DESCRIPTIVOS
-- ================================================

-- Vista unificada que muestra todos los IDs claramente identificados
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
    
    -- Información del huésped (puede ser diferente al cliente)
    COALESCE(r.guest_name, mr.guest_name) as huesped_nombre,
    r.guest_email as huesped_email,
    r.guest_phone as huesped_telefono,
    
    -- Datos de la reserva
    COALESCE(r.check_in, mr.check_in) as fecha_llegada,
    COALESCE(r.check_out, mr.check_out) as fecha_salida,
    COALESCE(r.status, mr.status) as estado,
    
    -- Información financiera (priorizando modular si existe)
    COALESCE(mr.grand_total, r.total_amount) as total_reserva,
    r.paid_amount as monto_pagado,
    r.payment_status as estado_pago,
    
    -- Información de habitación y paquete
    mr.room_code as habitacion,
    mr.package_code as paquete,
    mr.adults as adultos,
    mr.children as ninos,
    
    -- Metadatos
    COALESCE(r.created_at, mr.created_at) as fecha_creacion,
    
    -- Indicadores de consistencia
    CASE 
        WHEN r.client_id = mr.client_id THEN '✅ Consistente'
        WHEN r.client_id IS NULL OR mr.client_id IS NULL THEN '⚠️ Datos incompletos'
        ELSE '❌ Inconsistente'
    END as estado_consistencia,
    
    -- Nombre para mostrar (cliente principal, con huésped si es diferente)
    CASE 
        WHEN c."nombrePrincipal" != COALESCE(r.guest_name, mr.guest_name) 
        THEN c."nombrePrincipal" || ' (huésped: ' || COALESCE(r.guest_name, mr.guest_name) || ')'
        ELSE c."nombrePrincipal"
    END as nombre_display

FROM reservations r
FULL OUTER JOIN modular_reservations mr ON mr.reservation_id = r.id
LEFT JOIN "Client" c ON c.id = COALESCE(r.client_id, mr.client_id);

-- 📋 OPCIÓN 2: FUNCIÓN PARA OBTENER NOMBRE UNIFICADO
-- ================================================

CREATE OR REPLACE FUNCTION get_reservation_display_name(
    reservation_id_param INTEGER DEFAULT NULL,
    modular_reservation_id_param INTEGER DEFAULT NULL
) 
RETURNS TABLE (
    display_name TEXT,
    client_name TEXT,
    guest_name TEXT,
    is_different_guest BOOLEAN,
    client_id INTEGER,
    main_reservation_id INTEGER,
    modular_reservation_id INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN c."nombrePrincipal" != COALESCE(r.guest_name, mr.guest_name) 
            THEN c."nombrePrincipal" || ' (huésped: ' || COALESCE(r.guest_name, mr.guest_name) || ')'
            ELSE c."nombrePrincipal"
        END as display_name,
        c."nombrePrincipal" as client_name,
        COALESCE(r.guest_name, mr.guest_name) as guest_name,
        (c."nombrePrincipal" != COALESCE(r.guest_name, mr.guest_name)) as is_different_guest,
        c.id as client_id,
        r.id as main_reservation_id,
        mr.id as modular_reservation_id
    FROM reservations r
    FULL OUTER JOIN modular_reservations mr ON mr.reservation_id = r.id
    LEFT JOIN "Client" c ON c.id = COALESCE(r.client_id, mr.client_id)
    WHERE (reservation_id_param IS NULL OR r.id = reservation_id_param)
      AND (modular_reservation_id_param IS NULL OR mr.id = modular_reservation_id_param);
END;
$$;

-- 📋 OPCIÓN 3: CONSULTAS ESTÁNDAR PARA EL FRONTEND
-- ================================================

-- Consulta estándar para listado de reservas (unificada)
-- Reemplazar las consultas actuales en list.ts
/*
SELECT 
    vrn.id_reserva_principal,
    vrn.id_reserva_modular,
    vrn.cliente_id,
    vrn.cliente_nombre,
    vrn.cliente_rut,
    vrn.nombre_display,
    vrn.fecha_llegada,
    vrn.fecha_salida,
    vrn.estado,
    vrn.total_reserva,
    vrn.estado_pago,
    vrn.habitacion,
    vrn.estado_consistencia
FROM v_reservas_normalizadas vrn
ORDER BY vrn.fecha_creacion DESC;
*/

-- Consulta estándar para detalle de reserva (unificada)
-- Reemplazar las consultas actuales en get.ts
/*
SELECT 
    vrn.*,
    rp.id as pago_id,
    rp.amount as pago_monto,
    rp.payment_method as pago_metodo,
    rp.created_at as pago_fecha
FROM v_reservas_normalizadas vrn
LEFT JOIN reservation_payments rp ON rp.reservation_id = vrn.id_reserva_principal
WHERE vrn.id_reserva_principal = $1 OR vrn.id_reserva_modular = $1;
*/

-- 📋 OPCIÓN 4: MIGRACIÓN PARA CORREGIR DATOS EXISTENTES
-- ================================================

-- Script para identificar y corregir inconsistencias
DO $$
DECLARE
    inconsistent_record RECORD;
BEGIN
    -- Buscar registros inconsistentes
    FOR inconsistent_record IN 
        SELECT 
            r.id as reservation_id,
            mr.id as modular_id,
            r.client_id as r_client_id,
            mr.client_id as mr_client_id,
            r.guest_name as r_guest_name,
            mr.guest_name as mr_guest_name
        FROM reservations r
        FULL OUTER JOIN modular_reservations mr ON mr.reservation_id = r.id
        WHERE r.client_id != mr.client_id 
           OR (r.guest_name IS NOT NULL AND mr.guest_name IS NOT NULL AND r.guest_name != mr.guest_name)
    LOOP
        RAISE NOTICE 'INCONSISTENCIA ENCONTRADA:';
        RAISE NOTICE '  Reserva Principal ID: %, Cliente ID: %, Huésped: %', 
            inconsistent_record.reservation_id, 
            inconsistent_record.r_client_id, 
            inconsistent_record.r_guest_name;
        RAISE NOTICE '  Reserva Modular ID: %, Cliente ID: %, Huésped: %', 
            inconsistent_record.modular_id, 
            inconsistent_record.mr_client_id, 
            inconsistent_record.mr_guest_name;
        RAISE NOTICE '  ----------------------------------------';
    END LOOP;
END;
$$;

-- 📋 OPCIÓN 5: COMPONENTE REACT MEJORADO PARA MOSTRAR IDS
-- ================================================

/*
// Componente ReservationDisplay.tsx
interface ReservationDisplayProps {
  reservation: {
    id_reserva_principal: number;
    id_reserva_modular: number;
    cliente_nombre: string;
    cliente_rut: string;
    nombre_display: string;
    estado_consistencia: string;
  };
}

export function ReservationDisplay({ reservation }: ReservationDisplayProps) {
  return (
    <div className="reservation-display">
      <div className="reservation-header">
        <h3>{reservation.nombre_display}</h3>
        <span className="rut">RUT: {reservation.cliente_rut}</span>
      </div>
      
      <div className="reservation-ids">
        <span className="id-badge primary">
          ID Principal: {reservation.id_reserva_principal}
        </span>
        <span className="id-badge secondary">
          ID Modular: {reservation.id_reserva_modular}
        </span>
      </div>
      
      <div className={`consistency-status ${getStatusClass(reservation.estado_consistencia)}`}>
        {reservation.estado_consistencia}
      </div>
    </div>
  );
}
*/

-- 📋 RECOMENDACIÓN FINAL
-- ================================================

-- ESTRATEGIA RECOMENDADA:
-- 1. Implementar vista unificada v_reservas_normalizadas
-- 2. Actualizar componentes frontend para mostrar ambos IDs claramente
-- 3. Usar función get_reservation_display_name() para nombres consistentes
-- 4. Ejecutar script de migración para identificar y corregir inconsistencias
-- 5. Actualizar todas las consultas para usar la vista unificada

-- PARA LA RESERVA ID 64 ESPECÍFICAMENTE:
-- Ejecutar primero las consultas de análisis (archivo anterior)
-- Luego aplicar la corrección basada en los resultados encontrados 