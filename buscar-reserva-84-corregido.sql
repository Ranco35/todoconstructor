-- 🔍 BÚSQUEDA COMPLETA DE RESERVA ID 84 - CORREGIDO
-- Ejecutar estas consultas en Supabase SQL Editor

-- ============================================
-- 1. BUSCAR EN TABLA RESERVATIONS (ID PRINCIPAL)
-- ============================================
SELECT 
    'RESERVATIONS (Principal)' as tabla,
    r.id as id_principal,
    r.client_id,
    r.check_in,
    r.check_out,
    r.status,
    r.total_amount,
    r.created_at,
    c.full_name as cliente_nombre,
    c.email as cliente_email,
    c.phone as cliente_telefono
FROM reservations r
LEFT JOIN "Client" c ON r.client_id = c.id
WHERE r.id = 84;

-- ============================================
-- 2. BUSCAR EN TABLA MODULAR_RESERVATIONS (ID MODULAR)
-- ============================================
SELECT 
    'MODULAR_RESERVATIONS (Modular)' as tabla,
    mr.id as id_modular,
    mr.reservation_id as id_principal,
    mr.check_in,
    mr.check_out,
    mr.guest_name,
    mr.package_name,
    mr.total_with_vat,
    mr.room_code,
    mr.created_at
FROM modular_reservations mr
WHERE mr.id = 84;

-- ============================================
-- 3. BÚSQUEDA AMPLIA - TODAS LAS RELACIONES CON ID 84
-- ============================================
SELECT 
    'RELACIONES_CON_84' as tipo,
    mr.id as id_modular,
    mr.reservation_id as id_principal,
    mr.guest_name,
    mr.package_name,
    mr.room_code,
    mr.check_in,
    mr.check_out,
    CASE 
        WHEN mr.id = 84 THEN '🎯 ID MODULAR = 84'
        WHEN mr.reservation_id = 84 THEN '🔗 ID PRINCIPAL = 84'
        ELSE 'OTRO'
    END as relacion_con_84
FROM modular_reservations mr
WHERE mr.id = 84 OR mr.reservation_id = 84
ORDER BY mr.id;

-- ============================================
-- 4. VISTA COMPLETA - RESERVAS SIMILARES (IDs 83, 84, 64, 46)
-- ============================================
SELECT 
    CASE 
        WHEN tabla = 'reservations' THEN '📋 PRINCIPAL'
        ELSE '🏨 MODULAR'
    END as tipo,
    tabla,
    id_tabla,
    cliente_nombre,
    paquete,
    habitacion,
    check_in,
    check_out,
    CASE 
        WHEN id_tabla = 84 THEN '🎯 BUSCADO'
        ELSE '📌 RELACIONADO'
    END as relevancia
FROM (
    -- Reservas principales
    SELECT 
        'reservations' as tabla,
        r.id as id_tabla,
        c.full_name as cliente_nombre,
        'N/A' as paquete,
        'N/A' as habitacion,
        r.check_in,
        r.check_out
    FROM reservations r
    LEFT JOIN "Client" c ON r.client_id = c.id
    WHERE r.id IN (64, 83, 84, 46)
    
    UNION ALL
    
    -- Reservas modulares
    SELECT 
        'modular_reservations' as tabla,
        mr.id as id_tabla,
        mr.guest_name as cliente_nombre,
        mr.package_name as paquete,
        mr.room_code as habitacion,
        mr.check_in,
        mr.check_out
    FROM modular_reservations mr
    WHERE mr.id IN (64, 83, 84, 46)
    
    UNION ALL
    
    -- Modulares vinculadas a principales relevantes
    SELECT 
        'modular_reservations' as tabla,
        mr.id as id_tabla,
        mr.guest_name as cliente_nombre,
        mr.package_name as paquete,
        mr.room_code as habitacion,
        mr.check_in,
        mr.check_out
    FROM modular_reservations mr
    WHERE mr.reservation_id IN (64, 83, 84, 46)
) AS todas_reservas
ORDER BY tabla, id_tabla;

-- ============================================
-- 5. ANÁLISIS ESPECÍFICO - SI EXISTE RESERVA CON ID 84
-- ============================================
WITH reserva_84 AS (
    -- Buscar si existe ID 84 como principal
    SELECT 
        'PRINCIPAL' as tipo,
        84 as id,
        c.full_name as nombre,
        r.check_in,
        r.check_out,
        'reservations' as tabla_origen
    FROM reservations r
    LEFT JOIN "Client" c ON r.client_id = c.id
    WHERE r.id = 84
    
    UNION ALL
    
    -- Buscar si existe ID 84 como modular
    SELECT 
        'MODULAR' as tipo,
        84 as id,
        mr.guest_name as nombre,
        mr.check_in,
        mr.check_out,
        'modular_reservations' as tabla_origen
    FROM modular_reservations mr
    WHERE mr.id = 84
)
SELECT 
    tipo,
    id,
    nombre,
    check_in,
    check_out,
    tabla_origen,
    CASE 
        WHEN nombre IS NOT NULL THEN '✅ ENCONTRADA'
        ELSE '❌ NO ENCONTRADA'
    END as estado
FROM reserva_84
WHERE nombre IS NOT NULL;

-- ============================================
-- 6. VERIFICACIÓN FINAL - PATRÓN COMO VICTOR/KAREN
-- ============================================
-- Verificar si ID 84 tiene el mismo patrón que Victor (83-64) y Karen (64-46)
SELECT 
    mr.guest_name,
    mr.id as id_modular,
    mr.reservation_id as id_principal,
    mr.package_name,
    mr.room_code,
    mr.check_in,
    mr.check_out,
    CASE 
        WHEN mr.id = 84 THEN 
            CASE 
                WHEN mr.reservation_id IS NOT NULL THEN 
                    '🎯 ID 84 es MODULAR, Principal: ' || mr.reservation_id
                ELSE 
                    '⚠️ ID 84 es MODULAR sin Principal'
            END
        WHEN mr.reservation_id = 84 THEN 
            '🔗 Modular: ' || mr.id || ' → Principal: 84'
        ELSE 'N/A'
    END as analisis
FROM modular_reservations mr
WHERE mr.id = 84 OR mr.reservation_id = 84
ORDER BY mr.id;

-- ============================================
-- 7. CONSULTA RÁPIDA - SOLO ID 84
-- ============================================
-- Si quieres una consulta simple y rápida:
SELECT 
    mr.id as id_modular,
    mr.reservation_id as id_principal,
    mr.guest_name as nombre,
    mr.package_name as paquete,
    mr.room_code as habitacion,
    mr.check_in,
    mr.check_out
FROM modular_reservations mr
WHERE mr.id = 84 OR mr.reservation_id = 84; 