-- ================================================
-- CONSULTAS ESPECÍFICAS PARA RESERVA ID 117 (SUPABASE)
-- ================================================

-- ================================================
-- 1. CONSULTA ESPECÍFICA DE LA RESERVA 117
-- ================================================
SELECT 
    r.id,
    r.guest_name AS "Nombre del Huésped",
    r.guest_email AS "Email del Huésped",
    r.guest_phone AS "Teléfono del Huésped",
    r.client_id AS "ID del Cliente",
    r.client_type AS "Tipo de Cliente",
    r.billing_name AS "Nombre de Facturación",
    r.billing_rut AS "RUT de Facturación",
    r.billing_address AS "Dirección de Facturación",
    r.authorized_by AS "Autorizado por",
    r.check_in AS "Check-in",
    r.check_out AS "Check-out",
    r.guests AS "Número de Huéspedes",
    r.status AS "Estado",
    r.total_amount AS "Monto Total",
    r.paid_amount AS "Monto Pagado",
    r.pending_amount AS "Monto Pendiente",
    r.payment_status AS "Estado de Pago",
    r.created_at AS "Fecha de Creación",
    r.updated_at AS "Fecha de Actualización"
FROM reservations r
WHERE r.id = 117;

-- ================================================
-- 2. VERIFICAR RESERVAS MODULARES PARA ID 117
-- ================================================
SELECT 
    mr.id AS "ID Reserva Modular",
    mr.reservation_id AS "ID Reserva Principal",
    mr.client_id AS "ID del Cliente",
    mr.adults AS "Adultos",
    mr.children AS "Niños",
    mr.children_ages AS "Edades de Niños",
    mr.room_code AS "Código Habitación",
    mr.package_code AS "Código Paquete",
    mr.grand_total AS "Total General",
    mr.nights AS "Noches",
    mr.status AS "Estado",
    mr.created_at AS "Fecha Creación"
FROM modular_reservations mr
WHERE mr.reservation_id = 117;

-- ================================================
-- 3. CONTAR CUÁNTAS HABITACIONES TIENE LA RESERVA 117
-- ================================================
SELECT 
    CASE 
        WHEN COUNT(mr.id) = 0 THEN 'RESERVA INDIVIDUAL - 1 habitación'
        ELSE CONCAT('RESERVA MÚLTIPLES HABITACIONES - ', COUNT(mr.id), ' habitaciones')
    END AS "TIPO DE RESERVA",
    r.guest_name AS "Huésped",
    r.status AS "Estado",
    r.total_amount AS "Monto Total"
FROM reservations r
LEFT JOIN modular_reservations mr ON mr.reservation_id = r.id
WHERE r.id = 117
GROUP BY r.id, r.guest_name, r.status, r.total_amount;

-- ================================================
-- 4. DETALLES DE CADA HABITACIÓN (SI ES MODULAR)
-- ================================================
SELECT 
    mr.id AS "ID Modular",
    mr.room_code AS "Habitación",
    mr.package_code AS "Paquete",
    mr.adults AS "Adultos",
    mr.children AS "Niños",
    mr.children_ages AS "Edades Niños",
    mr.grand_total AS "Total Habitación",
    mr.nights AS "Noches",
    mr.status AS "Estado Habitación"
FROM modular_reservations mr
WHERE mr.reservation_id = 117
ORDER BY mr.room_code;

-- ================================================
-- 5. VERIFICAR PAGOS DE LA RESERVA 117
-- ================================================
SELECT 
    rp.id AS "ID Pago",
    rp.reservation_id AS "ID Reserva",
    rp.amount AS "Monto del Pago",
    rp.payment_type AS "Tipo de Pago",
    rp.payment_method AS "Método de Pago",
    rp.previous_paid_amount AS "Monto Pagado Anterior",
    rp.new_total_paid AS "Nuevo Total Pagado",
    rp.remaining_balance AS "Saldo Pendiente",
    rp.total_reservation_amount AS "Total de la Reserva",
    rp.reference_number AS "Número de Referencia",
    rp.processed_by AS "Procesado por",
    rp.created_at AS "Fecha del Pago"
FROM reservation_payments rp
WHERE rp.reservation_id = 117
ORDER BY rp.created_at DESC;

-- ================================================
-- 6. RESUMEN RÁPIDO - RESPUESTA DIRECTA
-- ================================================
SELECT 
    r.id as "ID Reserva",
    r.guest_name as "Huésped",
    CASE 
        WHEN COUNT(mr.id) = 0 THEN '1 habitación (tradicional)'
        WHEN COUNT(mr.id) = 1 THEN '1 habitación (modular)'
        ELSE CONCAT(COUNT(mr.id), ' habitaciones (múltiples)')
    END as "Número de Habitaciones",
    CASE 
        WHEN COUNT(mr.id) > 1 THEN STRING_AGG(mr.room_code, ', ' ORDER BY mr.room_code)
        WHEN COUNT(mr.id) = 1 THEN mr.room_code
        ELSE 'Sin información modular'
    END as "Habitaciones",
    r.status as "Estado",
    r.total_amount as "Total"
FROM reservations r
LEFT JOIN modular_reservations mr ON mr.reservation_id = r.id
WHERE r.id = 117
GROUP BY r.id, r.guest_name, r.status, r.total_amount; 