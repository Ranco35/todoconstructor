-- =====================================================
-- SOLUCIÓN SQL DIRECTA: Habilitar Check-out Ximena ID 132
-- =====================================================
-- EJECUTAR EN SUPABASE SQL EDITOR
-- =====================================================

-- 1. DIAGNÓSTICO: Ver estado actual
SELECT 
    'ESTADO ACTUAL' as diagnostico,
    r.id as id_principal,
    r.guest_name,
    r.status as estado_actual,
    r.payment_status,
    mr.id as id_modular_mostrado,
    mr.room_code
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE mr.id = 132;

-- 2. SOLUCIÓN: Cambiar estado a 'en_curso' para habilitar check-out
UPDATE reservations 
SET status = 'en_curso', updated_at = NOW()
WHERE id = (
    SELECT reservation_id 
    FROM modular_reservations 
    WHERE id = 132
);

-- 3. VERIFICACIÓN: Confirmar cambio
SELECT 
    'DESPUÉS DEL FIX' as resultado,
    r.id as id_principal,
    r.guest_name,
    r.status as nuevo_estado,
    'Ahora debería aparecer botón CHECK-OUT' as esperado
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE mr.id = 132;

-- 4. BONUS: Ver todas las habitaciones de esta reserva
SELECT 
    'HABITACIONES COMPLETAS' as info,
    r.guest_name,
    mr.id as id_modular,
    mr.room_number,
    r.status as estado_reserva
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.id = (SELECT reservation_id FROM modular_reservations WHERE id = 132)
ORDER BY mr.room_number;

-- =====================================================
-- OPCIONAL: TAMBIÉN ARREGLAR ALEJANDRA (ID 133)
-- =====================================================

-- Si también necesitas arreglar Alejandra:
UPDATE reservations 
SET status = 'en_curso', updated_at = NOW()
WHERE id = (
    SELECT reservation_id 
    FROM modular_reservations 
    WHERE id = 133
);

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Copia y pega este SQL en Supabase SQL Editor
-- 2. Ejecuta paso a paso (o todo junto)
-- 3. Ve al calendario de reservas
-- 4. Recarga la página (F5)
-- 5. ✅ Debería aparecer el botón "Check-Out" para Ximena
-- =====================================================