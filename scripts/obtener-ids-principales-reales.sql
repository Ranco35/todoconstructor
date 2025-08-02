-- 🎯 OBTENER IDs PRINCIPALES REALES para Check-out
-- Problema confirmado: 132/133 son IDs modulares, necesitamos los principales

-- ================================================================
-- 1️⃣ OBTENER IDs PRINCIPALES REALES DE LAS RESERVAS PROBLEMÁTICAS
-- ================================================================
SELECT 
    '🎯 SOLUCION_CHECKOUT' as tipo,
    mr.id as id_modular_mostrado_calendario,
    mr.reservation_id as id_principal_USAR_PARA_CHECKOUT,
    r.guest_name,
    r.status as estado_principal,
    mr.room_code,
    mr.status as estado_modular,
    CONCAT('✅ USAR: checkOutReservation(', mr.reservation_id, ')') as comando_correcto
FROM modular_reservations mr
JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.id IN (132, 133)
ORDER BY mr.id;

-- ================================================================
-- 2️⃣ VERIFICAR ESTADOS DE LAS RESERVAS PRINCIPALES REALES
-- ================================================================
SELECT 
    '📋 VERIFICACION_ESTADOS' as tipo,
    r.id as id_principal_real,
    r.guest_name,
    r.status,
    r.payment_status,
    COUNT(mr.id) as num_habitaciones,
    STRING_AGG(mr.room_code, ', ') as habitaciones,
    STRING_AGG(mr.id::text, ', ') as ids_modulares_mostrados_calendario,
    CASE 
        WHEN r.status = 'en_curso' THEN '✅ LISTO PARA CHECK-OUT'
        WHEN r.status = 'confirmada' THEN '⚠️ NECESITA CHECK-IN PRIMERO'
        WHEN r.status = 'finalizada' THEN '✅ YA FINALIZADA'
        ELSE '❓ REVISAR ESTADO'
    END as accion_recomendada
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE mr.id IN (132, 133)
GROUP BY r.id, r.guest_name, r.status, r.payment_status
ORDER BY r.id;

-- ================================================================
-- 3️⃣ COMANDOS DIRECTOS PARA COPIAR Y PEGAR
-- ================================================================
SELECT 
    '🚀 COMANDOS_CHECKOUT_CORRECTOS' as instrucciones,
    CONCAT('-- Para ', r.guest_name, ':') as comentario,
    CONCAT('checkOutReservation(', mr.reservation_id, ');') as comando_typescript,
    CONCAT('UPDATE reservations SET status = ''finalizada'' WHERE id = ', mr.reservation_id, ';') as comando_sql_directo
FROM modular_reservations mr
JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.id IN (132, 133)
ORDER BY mr.id;

-- ================================================================
-- 4️⃣ VERIFICACION FINAL POST-CHECKOUT
-- ================================================================
SELECT 
    '✅ PARA_VERIFICAR_DESPUES_CHECKOUT' as tipo,
    CONCAT('SELECT id, guest_name, status FROM reservations WHERE id IN (', 
           STRING_AGG(DISTINCT mr.reservation_id::text, ', '), 
           ');') as query_verificacion
FROM modular_reservations mr
WHERE mr.id IN (132, 133);