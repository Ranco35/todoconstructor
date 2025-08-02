-- 🛠️ SCRIPT DE REPARACIÓN: Fix Check-out Reservas Múltiples
-- ✅ CORREGIDO: Sin referencias a mr.guest_name (columna inexistente)
-- IMPORTANTE: Ejecutar solo después de verificar con el script de diagnóstico

-- ⚠️ PASOS PREVIOS OBLIGATORIOS:
-- 1. Ejecutar 'debug-reservas-multiples-checkout-FIXED.sql' para identificar los IDs correctos
-- 2. Confirmar que las reservas están pagadas y deberían estar en check-in
-- 3. Reemplazar los IDs de ejemplo por los IDs reales encontrados

-- 🔧 PASO 1: CORREGIR ESTADO A 'en_curso' (Check-in realizado)
-- Reemplazar 132, 133 por los IDs reales de las reservas principales
BEGIN;

-- Actualizar reserva principal de Ximena Leichtle
UPDATE reservations 
SET status = 'en_curso', 
    updated_at = NOW()
WHERE id = 132 -- ⚠️ REEMPLAZAR POR ID REAL
  AND status != 'en_curso';

-- Actualizar reserva principal de Alejandra Arriagada  
UPDATE reservations 
SET status = 'en_curso', 
    updated_at = NOW()
WHERE id = 133 -- ⚠️ REEMPLAZAR POR ID REAL
  AND status != 'en_curso';

-- Sincronizar reservas modulares (habitaciones múltiples)
UPDATE modular_reservations mr
SET status = 'en_curso', 
    updated_at = NOW()
FROM reservations r 
WHERE mr.reservation_id = r.id 
  AND r.id IN (132, 133) -- ⚠️ REEMPLAZAR POR IDs REALES
  AND mr.status != 'en_curso';

-- Agregar comentarios de sistema para auditoría
INSERT INTO reservation_comments (reservation_id, text, author, comment_type, created_at)
SELECT 
    r.id,
    '🔧 Estado corregido manualmente: Confirmada → En Curso (Check-in completado)',
    'Sistema - Fix Manual',
    'system',
    NOW()
FROM reservations r 
WHERE r.id IN (132, 133) -- ⚠️ REEMPLAZAR POR IDs REALES
  AND NOT EXISTS (
    SELECT 1 FROM reservation_comments rc 
    WHERE rc.reservation_id = r.id 
      AND rc.text LIKE '%Estado corregido manualmente%'
  );

COMMIT;

-- 🔧 PASO 2: VERIFICAR CORRECCIÓN
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.status as main_status,
    COUNT(mr.id) as habitaciones,
    STRING_AGG(mr.room_code, ', ') as rooms,
    STRING_AGG(DISTINCT mr.status, ', ') as modular_statuses,
    CASE 
        WHEN r.status = 'en_curso' AND NOT EXISTS (
            SELECT 1 FROM modular_reservations mr2 
            WHERE mr2.reservation_id = r.id AND mr2.status != 'en_curso'
        ) THEN '✅ LISTO PARA CHECK-OUT'
        ELSE '⚠️ REQUIERE REVISIÓN'
    END as checkout_status
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.id IN (132, 133) -- ⚠️ REEMPLAZAR POR IDs REALES
GROUP BY r.id, r.guest_name, r.status;

-- 🎯 RESULTADO ESPERADO:
-- main_status: 'en_curso'
-- modular_statuses: 'en_curso' 
-- checkout_status: '✅ LISTO PARA CHECK-OUT'