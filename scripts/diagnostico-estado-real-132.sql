-- DIAGNÓSTICO URGENTE: Estado real de ID 132 y su reserva principal
-- Ejecutar en Supabase para ver el estado actual

-- 1. Verificar ID 132 como modular
SELECT 
    'ID 132 es modular:' as verificacion,
    mr.id as id_modular,
    mr.reservation_id as id_principal,
    mr.room_number,
    r.guest_name,
    r.status as estado_principal,
    r.payment_status,
    r.check_in_date,
    r.check_out_date
FROM modular_reservations mr
JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.id = 132;

-- 2. Ver TODA la reserva principal (todas las habitaciones)
SELECT 
    'Reserva completa de Ximena:' as info,
    r.id as id_principal,
    r.guest_name,
    r.status as estado_principal,
    r.payment_status,
    r.check_in_date,
    r.check_out_date,
    mr.id as id_modular,
    mr.room_number
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.id = (
    SELECT reservation_id 
    FROM modular_reservations 
    WHERE id = 132
)
ORDER BY mr.room_number;

-- 3. Verificar por qué no aparece check-out
SELECT 
    'Análisis botón check-out:' as analisis,
    r.status,
    r.payment_status,
    CASE 
        WHEN r.status = 'confirmada' AND r.payment_status = 'paid' THEN '✅ Debería mostrar: Check-In'
        WHEN r.status = 'en_curso' THEN '✅ Debería mostrar: Check-Out'
        WHEN r.status = 'finalizada' THEN '✅ Ya finalizada'
        ELSE '❓ Estado inesperado'
    END as boton_esperado,
    r.created_at,
    r.updated_at
FROM reservations r
WHERE r.id = (
    SELECT reservation_id 
    FROM modular_reservations 
    WHERE id = 132
);