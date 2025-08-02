-- ================================================
-- SINCRONIZAR ESTADOS - RESERVA 117
-- ================================================

-- 1️⃣ VERIFICAR ESTADO ACTUAL
SELECT 
    'ESTADO ACTUAL' as seccion,
    r.id as reserva_principal_id,
    r.status as estado_principal,
    r.payment_status as pago_principal,
    COUNT(mr.id) as cantidad_modulares
FROM reservations r
LEFT JOIN modular_reservations mr ON mr.reservation_id = r.id
WHERE r.id = 117
GROUP BY r.id, r.status, r.payment_status;

-- 2️⃣ DETALLE DE ESTADOS MODULARES
SELECT 
    'ESTADOS MODULARES' as seccion,
    mr.id as modular_id,
    mr.room_code as habitacion,
    mr.status as estado_modular,
    mr.reservation_id
FROM modular_reservations mr
WHERE mr.reservation_id = 117
ORDER BY mr.room_code;

-- 3️⃣ SINCRONIZAR ESTADOS (ACTUALIZAR MODULARES AL ESTADO PRINCIPAL)
UPDATE modular_reservations 
SET status = (
    SELECT status 
    FROM reservations 
    WHERE id = 117
)
WHERE reservation_id = 117;

-- 4️⃣ VERIFICAR SINCRONIZACIÓN
SELECT 
    'DESPUÉS DE SINCRONIZAR' as seccion,
    mr.id as modular_id,
    mr.room_code as habitacion,
    mr.status as estado_modular_actualizado,
    r.status as estado_principal
FROM modular_reservations mr
JOIN reservations r ON r.id = mr.reservation_id
WHERE mr.reservation_id = 117
ORDER BY mr.room_code;

-- 5️⃣ RESULTADO FINAL
SELECT 
    'RESULTADO FINAL' as seccion,
    'Reserva 117 sincronizada correctamente' as mensaje,
    COUNT(CASE WHEN mr.status = r.status THEN 1 END) as modulares_sincronizadas,
    COUNT(mr.id) as total_modulares
FROM reservations r
LEFT JOIN modular_reservations mr ON mr.reservation_id = r.id
WHERE r.id = 117; 