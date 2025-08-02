-- 🔍 SCRIPT DE DIAGNÓSTICO: Reservas Múltiples - Problemas de Check-out
-- Casos específicos: Ximena Leichtle (ID: 132) y Alejandra Arriagada (ID: 133)
-- CORREGIDO: Eliminada referencia incorrecta a mr.guest_name (esa columna no existe)

-- 1️⃣ VERIFICAR RESERVAS PRINCIPALES
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.status as main_status,
    r.payment_status,
    r.created_at,
    r.updated_at
FROM reservations r 
WHERE r.id IN (132, 133) 
   OR r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
ORDER BY r.id;

-- 2️⃣ VERIFICAR RESERVAS MODULARES ASOCIADAS
SELECT 
    mr.id as modular_id,
    mr.reservation_id,
    r.guest_name,
    mr.room_code,
    mr.status as modular_status,
    mr.created_at,
    mr.updated_at,
    r.status as main_status,
    r.payment_status
FROM modular_reservations mr
JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.id IN (132, 133)
   OR r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
ORDER BY mr.reservation_id, mr.room_code;

-- 3️⃣ DETECTAR INCONSISTENCIAS DE ESTADO
SELECT 
    r.id as reservation_id,
    r.guest_name as main_guest,
    r.status as main_status,
    COUNT(mr.id) as habitaciones_count,
    STRING_AGG(mr.room_code, ', ') as habitaciones,
    STRING_AGG(DISTINCT mr.status, ', ') as modular_statuses,
    CASE 
        WHEN COUNT(DISTINCT mr.status) > 1 THEN '❌ ESTADOS INCONSISTENTES'
        WHEN r.status != mr.status THEN '⚠️ DESINCRONIZADO'
        ELSE '✅ SINCRONIZADO'
    END as sync_status
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
   OR r.id IN (132, 133)
GROUP BY r.id, r.guest_name, r.status
ORDER BY r.id;

-- 4️⃣ HISTORIAL DE COMENTARIOS/CAMBIOS
SELECT 
    rc.reservation_id,
    rc.text,
    rc.author,
    rc.comment_type,
    rc.created_at,
    r.guest_name
FROM reservation_comments rc
JOIN reservations r ON rc.reservation_id = r.id
WHERE r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
   OR r.id IN (132, 133)
ORDER BY rc.reservation_id, rc.created_at DESC;

-- 5️⃣ VERIFICAR PAGOS
SELECT 
    rp.reservation_id,
    rp.amount,
    rp.payment_method,
    rp.reference,
    rp.created_at,
    r.guest_name
FROM reservation_payments rp
JOIN reservations r ON rp.reservation_id = r.id
WHERE r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
   OR r.id IN (132, 133)
ORDER BY rp.reservation_id, rp.created_at;