-- 🔍 ANÁLISIS SISTÉMICO: Problema IDs Modulares vs Principales
-- Verificar cuántas reservas están afectadas por este problema

-- ================================================================
-- 1️⃣ MAGNITUD DEL PROBLEMA: ¿Cuántas reservas múltiples existen?
-- ================================================================
SELECT 
    '📊 ESTADÍSTICAS_GENERALES' as tipo,
    COUNT(DISTINCT r.id) as reservas_principales_total,
    COUNT(mr.id) as habitaciones_modulares_total,
    COUNT(DISTINCT CASE WHEN cnt.habitaciones > 1 THEN r.id END) as reservas_multiples,
    ROUND(
        COUNT(DISTINCT CASE WHEN cnt.habitaciones > 1 THEN r.id END) * 100.0 / 
        COUNT(DISTINCT r.id), 2
    ) as porcentaje_reservas_multiples
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
LEFT JOIN (
    SELECT reservation_id, COUNT(*) as habitaciones
    FROM modular_reservations 
    GROUP BY reservation_id
) cnt ON r.id = cnt.reservation_id;

-- ================================================================
-- 2️⃣ RESERVAS PROBLEMÁTICAS ACTUALES (Estados activos)
-- ================================================================
SELECT 
    '🚨 RESERVAS_PROBLEMÁTICAS_ACTIVAS' as tipo,
    r.id as id_principal_correcto,
    r.guest_name,
    r.status,
    r.payment_status,
    COUNT(mr.id) as num_habitaciones,
    STRING_AGG(mr.id::text, ', ') as ids_modulares_mostrados_calendario,
    STRING_AGG(mr.room_code, ', ') as habitaciones,
    CASE 
        WHEN r.status IN ('confirmada', 'en_curso') THEN '🚨 AFECTADA POR PROBLEMA'
        ELSE 'Sin problema inmediato'
    END as severidad
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.status IN ('prereserva', 'confirmada', 'en_curso')  -- Estados activos
GROUP BY r.id, r.guest_name, r.status, r.payment_status
HAVING COUNT(mr.id) > 1  -- Solo reservas múltiples
ORDER BY 
    CASE r.status 
        WHEN 'en_curso' THEN 1 
        WHEN 'confirmada' THEN 2 
        ELSE 3 
    END,
    r.created_at DESC;

-- ================================================================
-- 3️⃣ ANÁLISIS POR ESTADOS: ¿Cuántas en cada estado?
-- ================================================================
SELECT 
    '📈 DISTRIBUCIÓN_POR_ESTADOS' as análisis,
    r.status,
    COUNT(DISTINCT r.id) as reservas_multiples,
    COUNT(mr.id) as habitaciones_totales,
    STRING_AGG(DISTINCT CONCAT(r.guest_name, ' (', r.id, ')'), '; ') as ejemplos
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.status IN ('prereserva', 'confirmada', 'en_curso', 'finalizada')
GROUP BY r.status
HAVING COUNT(mr.id) > COUNT(DISTINCT r.id)  -- Solo múltiples habitaciones
ORDER BY 
    CASE r.status 
        WHEN 'en_curso' THEN 1 
        WHEN 'confirmada' THEN 2 
        WHEN 'prereserva' THEN 3 
        WHEN 'finalizada' THEN 4 
    END;

-- ================================================================
-- 4️⃣ IMPACTO EN FUNCIONALIDADES
-- ================================================================
SELECT 
    '⚡ FUNCIONALIDADES_AFECTADAS' as categoría,
    'Check-in desde calendario' as funcionalidad,
    COUNT(DISTINCT r.id) as reservas_afectadas,
    'IDs modulares causan confusión en checkInReservation()' as descripción_problema
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.status = 'confirmada'
GROUP BY 1,2,4

UNION ALL

SELECT 
    '⚡ FUNCIONALIDADES_AFECTADAS',
    'Check-out desde calendario',
    COUNT(DISTINCT r.id),
    'IDs modulares causan confusión en checkOutReservation()'
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.status = 'en_curso'
GROUP BY 1,2,4

UNION ALL

SELECT 
    '⚡ FUNCIONALIDADES_AFECTADAS',
    'Gestión/Edición de reservas',
    COUNT(DISTINCT r.id),
    'Enlaces y modales usan IDs incorrectos'
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.status IN ('prereserva', 'confirmada', 'en_curso')
GROUP BY 1,2,4;

-- ================================================================
-- 5️⃣ CASOS CRÍTICOS INMEDIATOS
-- ================================================================
SELECT 
    '🔥 CASOS_CRÍTICOS_INMEDIATOS' as urgencia,
    r.id as id_principal_usar,
    r.guest_name,
    r.status as estado_actual,
    STRING_AGG(mr.id::text, ', ') as ids_modulares_problematicos,
    STRING_AGG(mr.room_code, ', ') as habitaciones,
    CASE 
        WHEN r.status = 'en_curso' THEN 'URGENTE: Check-out bloqueado'
        WHEN r.status = 'confirmada' THEN 'ALTO: Check-in puede fallar'
        WHEN r.status = 'prereserva' THEN 'MEDIO: Confirmación puede fallar'
    END as nivel_problema,
    CONCAT('Afecta: ', COUNT(mr.id), ' habitaciones') as impacto
FROM reservations r
JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.status IN ('prereserva', 'confirmada', 'en_curso')
GROUP BY r.id, r.guest_name, r.status
HAVING COUNT(mr.id) > 1
ORDER BY 
    CASE r.status 
        WHEN 'en_curso' THEN 1 
        WHEN 'confirmada' THEN 2 
        WHEN 'prereserva' THEN 3 
    END,
    COUNT(mr.id) DESC;

-- ================================================================
-- 6️⃣ RESUMEN EJECUTIVO
-- ================================================================
SELECT 
    '📋 RESUMEN_EJECUTIVO' as tipo,
    CONCAT(
        'PROBLEMA SISTÉMICO CONFIRMADO: ',
        COUNT(DISTINCT CASE WHEN habitaciones > 1 THEN r.id END),
        ' reservas múltiples afectadas de ',
        COUNT(DISTINCT r.id),
        ' total (',
        ROUND(COUNT(DISTINCT CASE WHEN habitaciones > 1 THEN r.id END) * 100.0 / COUNT(DISTINCT r.id), 1),
        '%)'
    ) as diagnóstico,
    'Calendario muestra IDs modulares en lugar de principales' as causa_raíz,
    'Requiere corrección en ReservationCalendar.tsx' as solución_requerida
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
LEFT JOIN (
    SELECT reservation_id, COUNT(*) as habitaciones
    FROM modular_reservations 
    GROUP BY reservation_id
) cnt ON r.id = cnt.reservation_id;