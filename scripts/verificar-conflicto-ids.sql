-- 🔍 VERIFICAR CONFLICTO DE IDs: ¿Calendarios muestran IDs modulares?
-- Hipótesis: El calendario puede estar mostrando mr.id en lugar de r.id

-- ================================================================
-- 1️⃣ VERIFICAR SI 132/133 SON IDs MODULARES (NO PRINCIPALES)
-- ================================================================
SELECT 
    'MODULAR_RESERVATIONS' as tabla,
    mr.id as id_mostrado_calendario,
    mr.reservation_id as id_principal_real,
    r.guest_name,
    r.status as estado_principal,
    mr.status as estado_modular,
    mr.room_code,
    CASE 
        WHEN mr.id IN (132, 133) THEN '🎯 ESTE ES EL PROBLEMA'
        ELSE 'No problemático'
    END as diagnostico
FROM modular_reservations mr
JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.id IN (132, 133)
ORDER BY mr.id;

-- ================================================================
-- 2️⃣ VERIFICAR SI EXISTEN RESERVAS PRINCIPALES CON IDs 132/133
-- ================================================================
SELECT 
    'RESERVATIONS' as tabla,
    r.id as id_principal,
    r.guest_name,
    r.status,
    r.payment_status,
    COUNT(mr.id) as num_habitaciones,
    STRING_AGG(mr.room_code, ', ') as habitaciones,
    CASE 
        WHEN r.id IN (132, 133) THEN '✅ IDs PRINCIPALES CORRECTOS'
        ELSE 'No son principales'
    END as tipo
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.id IN (132, 133)
GROUP BY r.id, r.guest_name, r.status, r.payment_status
ORDER BY r.id;

-- ================================================================
-- 3️⃣ BUSCAR RESERVAS PRINCIPALES DE XIMENA Y ALEJANDRA
-- ================================================================
SELECT 
    '🎯 RESERVAS_PRINCIPALES_REALES' as tipo,
    r.id as id_principal_correcto,
    r.guest_name,
    r.status,
    r.payment_status,
    COUNT(mr.id) as habitaciones,
    STRING_AGG(mr.id::text, ', ') as ids_modulares,
    STRING_AGG(mr.room_code, ', ') as habitaciones_codigos,
    CASE 
        WHEN r.status = 'en_curso' THEN '✅ USAR ESTE ID PARA CHECK-OUT'
        ELSE '⚠️ REVISAR ESTADO'
    END as accion_recomendada
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.guest_name = 'Ximena' 
   OR r.guest_name = 'Alejandra'
GROUP BY r.id, r.guest_name, r.status, r.payment_status
ORDER BY r.id;

-- ================================================================
-- 4️⃣ COMPARAR: ¿Qué sucede si se intenta check-out con ID incorrecto?
-- ================================================================
SELECT 
    '📋 RESUMEN_COMPARACION' as tipo,
    'Si calendario muestra ID modular (132/133):' as escenario_1,
    '- checkOutReservation(132) → Busca en reservations table → NO ENCUENTRA' as resultado_1,
    '- Luego busca en modular_reservations → ENCUENTRA' as resultado_2,
    '- Pero el ID principal real es DIFERENTE' as problema,
    'SOLUCIÓN: Usar ID principal real para check-out' as solucion;

-- ================================================================
-- 5️⃣ COMANDO DE DIAGNÓSTICO EJECUTIVO
-- ================================================================
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM modular_reservations WHERE id IN (132, 133)) THEN
            '🚨 PROBLEMA CONFIRMADO: 132/133 son IDs modulares, no principales'
        WHEN EXISTS (SELECT 1 FROM reservations WHERE id IN (132, 133)) THEN
            '✅ IDs CORRECTOS: 132/133 son reservas principales'
        ELSE
            '❓ IDs NO ENCONTRADOS: Verificar datos'
    END as diagnostico_final;