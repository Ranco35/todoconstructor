-- Script para corregir inconsistencias en pagos de reservas
-- Ejecutar en Supabase SQL Editor

-- 1. Corregir payment_status basado en paid_amount
UPDATE reservations 
SET payment_status = CASE 
    WHEN paid_amount = 0 THEN 'no_payment'
    WHEN paid_amount >= total_amount THEN 'paid'
    WHEN paid_amount > 0 AND paid_amount < total_amount THEN 'partial'
    ELSE 'no_payment'
END
WHERE payment_status IS NULL OR payment_status = '';

-- 2. Corregir estados de reservas modulares basado en payment_status
UPDATE modular_reservations 
SET status = CASE 
    WHEN EXISTS (
        SELECT 1 FROM reservations r 
        WHERE r.id = modular_reservations.reservation_id 
        AND r.payment_status = 'paid'
    ) THEN 'en_curso'
    WHEN EXISTS (
        SELECT 1 FROM reservations r 
        WHERE r.id = modular_reservations.reservation_id 
        AND r.payment_status = 'partial'
    ) THEN 'active'
    ELSE 'active'
END
WHERE status = 'en_curso' 
AND EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.id = modular_reservations.reservation_id 
    AND r.payment_status = 'no_payment'
);

-- 3. Corregir reservas que están finalizadas pero deberían estar en curso
UPDATE modular_reservations 
SET status = 'en_curso'
WHERE status = 'finalizada' 
AND EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.id = modular_reservations.reservation_id 
    AND r.payment_status = 'paid'
    AND r.check_in <= CURRENT_DATE
    AND r.check_out > CURRENT_DATE
);

-- 4. Corregir reservas que están en curso pero deberían estar finalizadas
UPDATE modular_reservations 
SET status = 'finalizada'
WHERE status = 'en_curso' 
AND EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.id = modular_reservations.reservation_id 
    AND r.check_out < CURRENT_DATE
);

-- 5. Verificar resultados
SELECT 
    mr.id as modular_id,
    r.id as reservation_id,
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
    END as fecha_estado
FROM modular_reservations mr
JOIN reservations r ON r.id = mr.reservation_id
ORDER BY r.check_in DESC; 