-- 🔍 BÚSQUEDA AMPLIA: Encontrar reservas problemáticas
-- Buscar por partes del nombre y por IDs en ambas tablas

-- ================================================================
-- 1️⃣ BUSCAR POR PARTES DEL NOMBRE (MÁS FLEXIBLE)
-- ================================================================
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.status as estado_actual,
    r.payment_status,
    r.check_in,
    r.check_out,
    CASE 
        WHEN r.status = 'confirmada' THEN '🔧 NECESITA: Cambiar a en_curso'
        WHEN r.status = 'en_curso' THEN '✅ PUEDE: Hacer check-out'
        WHEN r.status = 'finalizada' THEN '✅ COMPLETADO'
        ELSE '❓ REVISAR: ' || r.status
    END as accion
FROM reservations r 
WHERE r.guest_name ILIKE '%Ximena%' 
   OR r.guest_name ILIKE '%Leichtle%'
   OR r.guest_name ILIKE '%Alejandra%' 
   OR r.guest_name ILIKE '%Arriagada%'
ORDER BY r.id;

-- ================================================================
-- 2️⃣ VERIFICAR SI IDs 132/133 SON MODULARES (NO PRINCIPALES)
-- ================================================================
SELECT 
    'MODULAR' as tipo,
    mr.id as modular_id,
    mr.reservation_id as principal_id,
    r.guest_name,
    mr.room_code,
    mr.status as modular_status,
    r.status as main_status,
    CASE 
        WHEN r.status = 'confirmada' THEN '🔧 NECESITA: Cambiar a en_curso'
        WHEN r.status = 'en_curso' THEN '✅ PUEDE: Hacer check-out'
        ELSE '❓ REVISAR: ' || r.status
    END as accion
FROM modular_reservations mr
JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.id IN (132, 133)
ORDER BY mr.id;

-- ================================================================
-- 3️⃣ BUSCAR RESERVAS RECIENTES CON MÚLTIPLES HABITACIONES
-- ================================================================
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.status,
    r.payment_status,
    COUNT(mr.id) as num_habitaciones,
    STRING_AGG(mr.room_code, ', ' ORDER BY mr.room_code) as habitaciones,
    STRING_AGG(DISTINCT mr.status, ', ') as estados_habitaciones,
    r.created_at,
    CASE 
        WHEN r.status = 'confirmada' AND COUNT(mr.id) > 1 THEN '🎯 POSIBLE CANDIDATO'
        WHEN r.status = 'en_curso' AND COUNT(mr.id) > 1 THEN '✅ MÚLTIPLE EN CURSO'
        ELSE 'Normal'
    END as tipo_reserva
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.created_at >= '2024-01-01'  -- Reservas del último año
GROUP BY r.id, r.guest_name, r.status, r.payment_status, r.created_at
HAVING COUNT(mr.id) > 1  -- Solo reservas con múltiples habitaciones
ORDER BY r.created_at DESC
LIMIT 20;

-- ================================================================
-- 4️⃣ BUSCAR RESERVAS EN ESTADO "CONFIRMADA" CON PROBLEMAS POTENCIALES
-- ================================================================
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.status,
    r.payment_status,
    r.paid_amount,
    r.total_amount,
    COUNT(mr.id) as habitaciones,
    STRING_AGG(mr.room_code, ', ' ORDER BY mr.room_code) as rooms,
    '🟢➜🟠 Cambiar a EN_CURSO' as solucion
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.status = 'confirmada'
  AND r.paid_amount > 0  -- Tienen algún pago
  AND r.created_at >= '2024-12-01'  -- Reservas recientes
GROUP BY r.id, r.guest_name, r.status, r.payment_status, r.paid_amount, r.total_amount
HAVING COUNT(mr.id) >= 1
ORDER BY r.created_at DESC
LIMIT 10;

-- ================================================================
-- 5️⃣ NOMBRES SIMILARES (FUZZY SEARCH)
-- ================================================================
SELECT 
    r.id,
    r.guest_name,
    r.status,
    CASE 
        WHEN r.guest_name ILIKE '%ximena%' THEN '🎯 POSIBLE XIMENA'
        WHEN r.guest_name ILIKE '%alejandra%' THEN '🎯 POSIBLE ALEJANDRA'
        WHEN r.guest_name ILIKE '%leicht%' THEN '🎯 POSIBLE LEICHTLE'
        WHEN r.guest_name ILIKE '%arriag%' THEN '🎯 POSIBLE ARRIAGADA'
        ELSE 'Otro'
    END as coincidencia
FROM reservations r 
WHERE r.guest_name ILIKE '%ximena%' 
   OR r.guest_name ILIKE '%alejandra%'
   OR r.guest_name ILIKE '%leicht%'
   OR r.guest_name ILIKE '%arriag%'
   OR r.guest_name ILIKE '%leichtle%'
   OR r.guest_name ILIKE '%arriagada%'
ORDER BY r.id;