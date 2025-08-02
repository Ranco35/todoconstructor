-- 🔍 BÚSQUEDA ESPECÍFICA DE RESERVA ID 89
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. CONSULTA RÁPIDA - ¿DÓNDE ESTÁ EL ID 89?
-- ============================================
SELECT 
    'ENCONTRADO' as estado,
    'modular_reservations' as tabla,
    mr.id as id_encontrado,
    'ID_MODULAR' as tipo_id,
    mr.reservation_id as id_principal_asociado,
    mr.guest_name as nombre,
    mr.package_name as paquete,
    mr.room_code as habitacion,
    mr.check_in,
    mr.check_out
FROM modular_reservations mr
WHERE mr.id = 89 

UNION ALL

SELECT 
    'ENCONTRADO' as estado,
    'reservations' as tabla,
    r.id as id_encontrado,
    'ID_PRINCIPAL' as tipo_id,
    NULL as id_principal_asociado,
    c.full_name as nombre,
    'N/A' as paquete,
    'N/A' as habitacion,
    r.check_in,
    r.check_out
FROM reservations r
LEFT JOIN "Client" c ON r.client_id = c.id
WHERE r.id = 89

UNION ALL

SELECT 
    'RELACIONADO' as estado,
    'modular_reservations' as tabla,
    mr.id as id_encontrado,
    'VINCULADO_A_89' as tipo_id,
    mr.reservation_id as id_principal_asociado,
    mr.guest_name as nombre,
    mr.package_name as paquete,
    mr.room_code as habitacion,
    mr.check_in,
    mr.check_out
FROM modular_reservations mr
WHERE mr.reservation_id = 89;

-- ============================================
-- 2. ANÁLISIS DETALLADO - PATRÓN DEL ID 89
-- ============================================
SELECT 
    CASE 
        WHEN mr.id = 89 THEN '🎯 ID 89 es MODULAR'
        WHEN mr.reservation_id = 89 THEN '🔗 ID 89 es PRINCIPAL'
        ELSE 'OTRO'
    END as relacion,
    mr.id as id_modular,
    mr.reservation_id as id_principal,
    mr.guest_name,
    mr.package_name,
    mr.room_code,
    mr.check_in,
    mr.check_out,
    CASE 
        WHEN mr.id = 89 AND mr.reservation_id IS NOT NULL THEN 
            'ID Compuesto: R' || mr.reservation_id || '-M89'
        WHEN mr.reservation_id = 89 THEN 
            'ID Compuesto: R89-M' || mr.id
        ELSE 'Sin patrón compuesto'
    END as id_compuesto_seria
FROM modular_reservations mr
WHERE mr.id = 89 OR mr.reservation_id = 89
ORDER BY mr.id;

-- ============================================
-- 3. COMPARACIÓN CON CASOS CONOCIDOS
-- ============================================
-- Comparar ID 89 con Victor (83-64) y Karen (64-46)
SELECT 
    persona,
    id_principal,
    id_modular,
    id_compuesto,
    nombre,
    habitacion,
    fechas
FROM (
    -- Victor Vilo
    SELECT 
        'VICTOR' as persona,
        83 as id_principal,
        64 as id_modular,
        'R83-M64' as id_compuesto,
        mr.guest_name as nombre,
        mr.room_code as habitacion,
        mr.check_in || ' → ' || mr.check_out as fechas
    FROM modular_reservations mr
    WHERE mr.reservation_id = 83 AND mr.id = 64
    
    UNION ALL
    
    -- Karen Alejandra
    SELECT 
        'KAREN' as persona,
        64 as id_principal,
        46 as id_modular,
        'R64-M46' as id_compuesto,
        mr.guest_name as nombre,
        mr.room_code as habitacion,
        mr.check_in || ' → ' || mr.check_out as fechas
    FROM modular_reservations mr
    WHERE mr.reservation_id = 64 AND mr.id = 46
    
    UNION ALL
    
    -- ID 89 como modular
    SELECT 
        'ID_89_MODULAR' as persona,
        mr.reservation_id as id_principal,
        89 as id_modular,
        CASE 
            WHEN mr.reservation_id IS NOT NULL THEN 'R' || mr.reservation_id || '-M89'
            ELSE 'Sin principal'
        END as id_compuesto,
        mr.guest_name as nombre,
        mr.room_code as habitacion,
        mr.check_in || ' → ' || mr.check_out as fechas
    FROM modular_reservations mr
    WHERE mr.id = 89
    
    UNION ALL
    
    -- ID 89 como principal
    SELECT 
        'ID_89_PRINCIPAL' as persona,
        89 as id_principal,
        mr.id as id_modular,
        'R89-M' || mr.id as id_compuesto,
        mr.guest_name as nombre,
        mr.room_code as habitacion,
        mr.check_in || ' → ' || mr.check_out as fechas
    FROM modular_reservations mr
    WHERE mr.reservation_id = 89
) AS comparacion
ORDER BY persona;

-- ============================================
-- 4. CONSULTA SÚPER SIMPLE - SOLO RESULTADOS
-- ============================================
-- Ejecuta esta si las otras son muy complejas
SELECT 
    mr.id,
    mr.reservation_id,
    mr.guest_name,
    mr.room_code,
    mr.check_in,
    mr.check_out
FROM modular_reservations mr
WHERE mr.id = 89 OR mr.reservation_id = 89; 