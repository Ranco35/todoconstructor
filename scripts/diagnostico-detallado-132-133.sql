-- 🔍 DIAGNÓSTICO DETALLADO: Reservas 132 y 133
-- ¿Por qué no pueden hacer check-out si están en "en_curso"?

-- ================================================================
-- 1️⃣ DETALLES COMPLETOS DE LAS RESERVAS
-- ================================================================
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.status,
    r.payment_status,
    r.total_amount,
    r.paid_amount,
    r.pending_amount,
    r.check_in,
    r.check_out,
    r.created_at,
    r.updated_at,
    '--- PRINCIPAL ---' as separador
FROM reservations r 
WHERE r.id IN (132, 133)
ORDER BY r.id;

-- ================================================================
-- 2️⃣ HABITACIONES MODULARES ASOCIADAS
-- ================================================================
SELECT 
    'MODULAR' as tipo,
    mr.id as modular_id,
    mr.reservation_id,
    r.guest_name,
    mr.room_code as habitacion,
    mr.status as estado_habitacion,
    r.status as estado_principal,
    mr.adults,
    mr.children,
    mr.grand_total,
    mr.created_at,
    mr.updated_at,
    CASE 
        WHEN mr.status != r.status THEN '⚠️ DESINCRONIZADO'
        ELSE '✅ SINCRONIZADO'
    END as sincronizacion
FROM modular_reservations mr
JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.reservation_id IN (132, 133)
ORDER BY mr.reservation_id, mr.room_code;

-- ================================================================
-- 3️⃣ VERIFICAR SI HAY MODULAR_RESERVATIONS CON IDs 132/133
-- ================================================================
SELECT 
    'POSIBLE_PROBLEMA' as tipo,
    mr.id as modular_id_directo,
    mr.reservation_id,
    r.guest_name,
    mr.room_code,
    mr.status as estado_modular,
    r.status as estado_principal,
    '❌ Calendario puede estar mostrando ID modular en lugar de principal' as problema_potencial
FROM modular_reservations mr
JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.id IN (132, 133);

-- ================================================================
-- 4️⃣ HISTORIAL DE COMENTARIOS (CHECK-INS/CHECK-OUTS PREVIOS)
-- ================================================================
SELECT 
    rc.reservation_id,
    r.guest_name,
    rc.text,
    rc.author,
    rc.comment_type,
    rc.created_at
FROM reservation_comments rc
JOIN reservations r ON rc.reservation_id = r.id
WHERE rc.reservation_id IN (132, 133)
ORDER BY rc.reservation_id, rc.created_at DESC;

-- ================================================================
-- 5️⃣ PAGOS Y TRANSACCIONES
-- ================================================================
SELECT 
    rp.reservation_id,
    r.guest_name,
    rp.amount,
    rp.payment_method,
    rp.reference,
    rp.created_at
FROM reservation_payments rp
JOIN reservations r ON rp.reservation_id = r.id
WHERE rp.reservation_id IN (132, 133)
ORDER BY rp.reservation_id, rp.created_at;

-- ================================================================
-- 6️⃣ RESUMEN PARA DIAGNÓSTICO
-- ================================================================
SELECT 
    r.id,
    r.guest_name,
    r.status as estado_principal,
    r.payment_status,
    COUNT(mr.id) as num_habitaciones,
    STRING_AGG(mr.room_code, ', ' ORDER BY mr.room_code) as habitaciones,
    STRING_AGG(DISTINCT mr.status, ', ') as estados_habitaciones,
    CASE 
        WHEN r.status = 'en_curso' AND COUNT(DISTINCT mr.status) = 1 AND mr.status = 'en_curso' THEN 
            '✅ TODO CORRECTO - Problema debe ser en UI/funciones'
        WHEN r.status = 'en_curso' AND mr.status != 'en_curso' THEN 
            '⚠️ PRINCIPAL OK, MODULARES DESINCRONIZADAS'
        WHEN r.status != 'en_curso' THEN 
            '❌ PRINCIPAL INCORRECTO'
        ELSE 
            '❓ REVISAR CASO ESPECIAL'
    END as diagnostico
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.id IN (132, 133)
GROUP BY r.id, r.guest_name, r.status, r.payment_status
ORDER BY r.id;