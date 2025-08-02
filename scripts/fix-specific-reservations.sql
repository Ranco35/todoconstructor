-- Script específico para corregir reservas problemáticas
-- Basado en los logs del sistema

-- 1. Corregir Reserva 37 (Eduardo Proboste) - Debería estar en_curso
UPDATE modular_reservations 
SET status = 'en_curso'
WHERE id = 37;

UPDATE reservations 
SET payment_status = 'paid'
WHERE id = 55 AND paid_amount >= total_amount;

-- 2. Corregir Reserva 30 (Valeria Gavilan) - Mantener en_curso con pago parcial
UPDATE reservations 
SET payment_status = 'partial'
WHERE id = 46 AND paid_amount > 0 AND paid_amount < total_amount;

-- 3. Corregir reservas con payment_status incorrecto
UPDATE reservations 
SET payment_status = CASE 
    WHEN paid_amount = 0 THEN 'no_payment'
    WHEN paid_amount >= total_amount THEN 'paid'
    WHEN paid_amount > 0 THEN 'partial'
    ELSE 'no_payment'
END
WHERE id IN (31, 46, 56, 57, 59, 58, 63, 62, 64);

-- 4. Corregir estados de reservas modulares basado en fechas y pagos
UPDATE modular_reservations 
SET status = CASE 
    WHEN EXISTS (
        SELECT 1 FROM reservations r 
        WHERE r.id = modular_reservations.reservation_id 
        AND r.payment_status = 'paid'
        AND r.check_in <= CURRENT_DATE
        AND r.check_out > CURRENT_DATE
    ) THEN 'en_curso'
    WHEN EXISTS (
        SELECT 1 FROM reservations r 
        WHERE r.id = modular_reservations.reservation_id 
        AND r.check_out < CURRENT_DATE
    ) THEN 'finalizada'
    ELSE 'active'
END
WHERE id IN (37, 30, 16, 13, 38, 39);

-- 5. Verificar las correcciones específicas
SELECT 
    'RESERVA 37' as descripcion,
    mr.id as modular_id,
    r.id as reservation_id,
    r.check_in,
    r.check_out,
    r.payment_status,
    r.paid_amount,
    r.total_amount,
    mr.status as modular_status
FROM modular_reservations mr
JOIN reservations r ON r.id = mr.reservation_id
WHERE mr.id = 37

UNION ALL

SELECT 
    'RESERVA 30' as descripcion,
    mr.id as modular_id,
    r.id as reservation_id,
    r.check_in,
    r.check_out,
    r.payment_status,
    r.paid_amount,
    r.total_amount,
    mr.status as modular_status
FROM modular_reservations mr
JOIN reservations r ON r.id = mr.reservation_id
WHERE mr.id = 30

UNION ALL

SELECT 
    'RESERVA 16' as descripcion,
    mr.id as modular_id,
    r.id as reservation_id,
    r.check_in,
    r.check_out,
    r.payment_status,
    r.paid_amount,
    r.total_amount,
    mr.status as modular_status
FROM modular_reservations mr
JOIN reservations r ON r.id = mr.reservation_id
WHERE mr.id = 16

UNION ALL

SELECT 
    'RESERVA 13' as descripcion,
    mr.id as modular_id,
    r.id as reservation_id,
    r.check_in,
    r.check_out,
    r.payment_status,
    r.paid_amount,
    r.total_amount,
    mr.status as modular_status
FROM modular_reservations mr
JOIN reservations r ON r.id = mr.reservation_id
WHERE mr.id = 13; 