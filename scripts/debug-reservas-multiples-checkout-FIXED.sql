-- 🔍 SCRIPT CORREGIDO: Diagnóstico Reservas Múltiples - Check-out
-- Casos: Ximena Leichtle (ID: 132) y Alejandra Arriagada (ID: 133)
-- ✅ CORREGIDO: Sin referencias a mr.guest_name (columna inexistente)

-- ================================================================
-- 1️⃣ BUSCAR RESERVAS POR NOMBRE (MÉTODO SEGURO)
-- ================================================================
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.status as main_status,
    r.payment_status,
    r.check_in,
    r.check_out,
    r.total_amount,
    r.paid_amount,
    r.created_at,
    r.updated_at
FROM reservations r 
WHERE r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
   OR r.guest_name ILIKE '%Ximena Leichtle%'
   OR r.guest_name ILIKE '%Alejandra Arriagada%'
ORDER BY r.id;

-- ================================================================
-- 2️⃣ VERIFICAR RESERVAS MODULARES DE ESTOS HUÉSPEDES
-- ================================================================
SELECT 
    mr.id as modular_id,
    mr.reservation_id,
    r.guest_name,
    mr.room_code,
    mr.status as modular_status,
    r.status as main_status,
    r.payment_status,
    mr.adults,
    mr.children,
    mr.grand_total,
    mr.created_at as modular_created,
    r.created_at as main_created
FROM modular_reservations mr
JOIN reservations r ON mr.reservation_id = r.id
WHERE r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
   OR r.guest_name ILIKE '%Ximena Leichtle%'
   OR r.guest_name ILIKE '%Alejandra Arriagada%'
ORDER BY mr.reservation_id, mr.room_code;

-- ================================================================
-- 3️⃣ DETECTAR INCONSISTENCIAS DE ESTADO
-- ================================================================
SELECT 
    r.id as reservation_id,
    r.guest_name as main_guest,
    r.status as main_status,
    COUNT(mr.id) as habitaciones_count,
    STRING_AGG(mr.room_code, ', ' ORDER BY mr.room_code) as habitaciones,
    STRING_AGG(DISTINCT mr.status, ', ') as modular_statuses,
    CASE 
        WHEN COUNT(DISTINCT mr.status) > 1 THEN '❌ ESTADOS INCONSISTENTES'
        WHEN r.status != COALESCE(mr.status, r.status) THEN '⚠️ DESINCRONIZADO'
        WHEN r.status = 'confirmada' THEN '🟡 NECESITA CHECK-IN'
        WHEN r.status = 'en_curso' THEN '✅ LISTO PARA CHECK-OUT'
        WHEN r.status = 'finalizada' THEN '🏁 YA FINALIZADA'
        ELSE '❓ ESTADO DESCONOCIDO'
    END as sync_status,
    r.payment_status,
    r.paid_amount,
    r.total_amount
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
   OR r.guest_name ILIKE '%Ximena Leichtle%'
   OR r.guest_name ILIKE '%Alejandra Arriagada%'
GROUP BY r.id, r.guest_name, r.status, r.payment_status, r.paid_amount, r.total_amount
ORDER BY r.id;

-- ================================================================
-- 4️⃣ HISTORIAL DE COMENTARIOS/CAMBIOS
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
WHERE r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
   OR r.guest_name ILIKE '%Ximena Leichtle%'
   OR r.guest_name ILIKE '%Alejandra Arriagada%'
ORDER BY rc.reservation_id, rc.created_at DESC;

-- ================================================================
-- 5️⃣ VERIFICAR PAGOS
-- ================================================================
SELECT 
    rp.reservation_id,
    r.guest_name,
    rp.amount,
    rp.payment_method,
    rp.reference,
    rp.notes,
    rp.created_at
FROM reservation_payments rp
JOIN reservations r ON rp.reservation_id = r.id
WHERE r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
   OR r.guest_name ILIKE '%Ximena Leichtle%'
   OR r.guest_name ILIKE '%Alejandra Arriagada%'
ORDER BY rp.reservation_id, rp.created_at;

-- ================================================================
-- 6️⃣ RESUMEN EJECUTIVO POR HUÉSPED
-- ================================================================
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.status as estado_actual,
    r.payment_status as estado_pago,
    COUNT(mr.id) as num_habitaciones,
    STRING_AGG(mr.room_code, ', ' ORDER BY mr.room_code) as habitaciones,
    CASE 
        WHEN r.status = 'confirmada' AND r.payment_status IN ('partial', 'paid') THEN 
            '🔧 NECESITA: Cambiar a "en_curso" para permitir check-out'
        WHEN r.status = 'en_curso' THEN 
            '✅ PUEDE: Hacer check-out normal'
        WHEN r.status = 'finalizada' THEN 
            '✅ COMPLETADO: Check-out ya realizado'
        ELSE 
            '❓ REVISAR: Estado no esperado'
    END as accion_recomendada,
    r.total_amount,
    r.paid_amount,
    CASE 
        WHEN r.paid_amount >= r.total_amount THEN '✅ PAGADO'
        WHEN r.paid_amount > 0 THEN '🟡 ABONO'
        ELSE '❌ SIN PAGO'
    END as estado_pago_real
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.guest_name ILIKE '%Ximena%Leichtle%' 
   OR r.guest_name ILIKE '%Alejandra%Arriagada%'
   OR r.guest_name ILIKE '%Ximena Leichtle%'
   OR r.guest_name ILIKE '%Alejandra Arriagada%'
GROUP BY r.id, r.guest_name, r.status, r.payment_status, r.total_amount, r.paid_amount
ORDER BY r.id;

-- ================================================================
-- 🎯 INSTRUCCIONES DESPUÉS DE EJECUTAR:
-- ================================================================
-- 1. Revisa el RESUMEN EJECUTIVO (#6) para ver qué hacer
-- 2. Si dice "NECESITA: Cambiar a en_curso" → usar fix script
-- 3. Si dice "PUEDE: Hacer check-out" → ya está listo
-- 4. Si no aparecen los huéspedes → verificar nombres exactos