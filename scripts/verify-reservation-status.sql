-- Script de verificación del estado de reservas
-- Ejecutar en Supabase SQL Editor para ver el estado actual

-- Vista general de todas las reservas con sus estados
SELECT 
    mr.id as modular_id,
    r.id as reservation_id,
    c.first_name || ' ' || c.last_name as cliente,
    r.check_in,
    r.check_out,
    r.payment_status,
    r.paid_amount,
    r.total_amount,
    mr.status as modular_status,
    CASE 
        WHEN r.check_out < CURRENT_DATE THEN 'PASADA'
        WHEN r.check_in <= CURRENT_DATE AND r.check_out >= CURRENT_DATE THEN 'ACTUAL'
        ELSE 'FUTURA'
    END as fecha_estado,
    CASE 
        WHEN r.paid_amount = 0 THEN 'SIN PAGO'
        WHEN r.paid_amount >= r.total_amount THEN 'PAGADO COMPLETO'
        WHEN r.paid_amount > 0 THEN 'PAGO PARCIAL'
        ELSE 'SIN PAGO'
    END as estado_pago
FROM modular_reservations mr
JOIN reservations r ON r.id = mr.reservation_id
LEFT JOIN clients c ON c.id = r.client_id
ORDER BY r.check_in DESC;

-- Verificar inconsistencias específicas
SELECT 
    'INCONSISTENCIAS ENCONTRADAS' as tipo,
    mr.id as modular_id,
    r.id as reservation_id,
    c.first_name || ' ' || c.last_name as cliente,
    r.payment_status,
    r.paid_amount,
    r.total_amount,
    mr.status as modular_status,
    CASE 
        WHEN r.paid_amount > 0 AND r.payment_status = 'no_payment' THEN 'PAGO PARCIAL CON STATUS NO_PAYMENT'
        WHEN r.paid_amount >= r.total_amount AND r.payment_status != 'paid' THEN 'PAGO COMPLETO CON STATUS INCORRECTO'
        WHEN r.paid_amount = 0 AND r.payment_status != 'no_payment' THEN 'SIN PAGO CON STATUS INCORRECTO'
        WHEN r.check_out < CURRENT_DATE AND mr.status = 'en_curso' THEN 'PASADA PERO EN CURSO'
        WHEN r.check_in <= CURRENT_DATE AND r.check_out >= CURRENT_DATE AND r.payment_status = 'paid' AND mr.status != 'en_curso' THEN 'ACTUAL PAGADA PERO NO EN CURSO'
        ELSE 'OK'
    END as problema
FROM modular_reservations mr
JOIN reservations r ON r.id = mr.reservation_id
LEFT JOIN clients c ON c.id = r.client_id
WHERE 
    (r.paid_amount > 0 AND r.payment_status = 'no_payment') OR
    (r.paid_amount >= r.total_amount AND r.payment_status != 'paid') OR
    (r.paid_amount = 0 AND r.payment_status != 'no_payment') OR
    (r.check_out < CURRENT_DATE AND mr.status = 'en_curso') OR
    (r.check_in <= CURRENT_DATE AND r.check_out >= CURRENT_DATE AND r.payment_status = 'paid' AND mr.status != 'en_curso')
ORDER BY r.check_in DESC;

-- Resumen por estados
SELECT 
    mr.status as estado_modular,
    r.payment_status as estado_pago,
    COUNT(*) as cantidad,
    SUM(r.paid_amount) as total_pagado,
    SUM(r.total_amount) as total_facturado
FROM modular_reservations mr
JOIN reservations r ON r.id = mr.reservation_id
GROUP BY mr.status, r.payment_status
ORDER BY mr.status, r.payment_status; 