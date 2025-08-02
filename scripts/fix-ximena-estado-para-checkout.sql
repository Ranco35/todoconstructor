-- SOLUCIÓN INMEDIATA: Habilitar check-out para Ximena Leichtle (ID 132)
-- PROBLEMA: Reserva está en estado "Activa" pero debería estar "en_curso" para mostrar botón check-out

-- 1. VERIFICAR estado actual
SELECT 
    'ESTADO ACTUAL:' as info,
    r.id as id_principal,
    r.guest_name,
    r.status as estado_actual,
    r.payment_status,
    'Modular ID: ' || mr.id as id_mostrado_ui
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE mr.id = 132;

-- 2. CORREGIR estado para habilitar check-out
UPDATE reservations 
SET 
    status = 'en_curso',
    updated_at = NOW()
WHERE id = (
    SELECT reservation_id 
    FROM modular_reservations 
    WHERE id = 132
);

-- 3. VERIFICAR corrección
SELECT 
    'ESTADO DESPUÉS DEL FIX:' as info,
    r.id as id_principal,
    r.guest_name,
    r.status as nuevo_estado,
    r.payment_status,
    'Ahora debería mostrar botón CHECK-OUT' as resultado_esperado
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE mr.id = 132;

-- 4. MOSTRAR todas las habitaciones de esta reserva
SELECT 
    'HABITACIONES DE ESTA RESERVA:' as info,
    r.guest_name,
    mr.id as id_modular,
    mr.room_number,
    r.status as estado_principal
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.id = (
    SELECT reservation_id 
    FROM modular_reservations 
    WHERE id = 132
)
ORDER BY mr.room_number;