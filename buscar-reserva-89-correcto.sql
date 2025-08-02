-- 🔍 BÚSQUEDA CORRECTA DE RESERVA ID 89
-- Usando las estructuras reales de las tablas

-- ============================================
-- CONSULTA 1: BUSCAR ID 89 EN TABLA RESERVATIONS (PRINCIPAL)
-- ============================================
SELECT 
    'PRINCIPAL' as tipo,
    id,
    guest_name,
    guest_email,
    check_in,
    check_out,
    room_id,
    status,
    total_amount
FROM reservations 
WHERE id = 89;

-- ============================================
-- CONSULTA 2: BUSCAR ID 89 EN TABLA MODULAR_RESERVATIONS
-- ============================================
SELECT 
    'MODULAR' as tipo,
    id,
    reservation_id,
    -- guest_name NO existe en modular_reservations, omitir
    check_in,
    check_out,
    room_code,
    package_name,
    total_with_vat
FROM modular_reservations 
WHERE id = 89 OR reservation_id = 89;

-- ============================================
-- CONSULTA 3: BÚSQUEDA COMBINADA ID 89
-- ============================================
SELECT 
    tipo,
    id_encontrado,
    nombre_huesped,
    check_in,
    check_out,
    habitacion,
    estado_reserva
FROM (
    -- Buscar en reservations (principal)
    SELECT 
        'PRINCIPAL' as tipo,
        id as id_encontrado,
        guest_name as nombre_huesped,
        check_in,
        check_out,
        'room_' || room_id as habitacion,
        status as estado_reserva
    FROM reservations 
    WHERE id = 89
    
    UNION ALL
    
    -- Buscar en modular_reservations (modular)
    SELECT 
        'MODULAR' as tipo,
        id as id_encontrado,
        'Modular ID: ' || id || ' -> Principal: ' || reservation_id as nombre_huesped,
        check_in,
        check_out,
        room_code as habitacion,
        'modular' as estado_reserva
    FROM modular_reservations 
    WHERE id = 89
    
    UNION ALL
    
    -- Buscar modulares vinculadas a principal 89
    SELECT 
        'VINCULADA_A_89' as tipo,
        id as id_encontrado,
        'Modular vinculada a Principal 89' as nombre_huesped,
        check_in,
        check_out,
        room_code as habitacion,
        'vinculada' as estado_reserva
    FROM modular_reservations 
    WHERE reservation_id = 89
) AS resultados
ORDER BY tipo;

-- ============================================
-- CONSULTA 4: COMPARAR CON VICTOR Y KAREN
-- ============================================
SELECT 
    caso,
    id_principal,
    id_modular,
    nombre_en_principal,
    habitacion_modular,
    fechas,
    id_compuesto
FROM (
    -- Victor Vilo (Principal 83 -> Modular 64)
    SELECT 
        'VICTOR' as caso,
        r.id as id_principal,
        mr.id as id_modular,
        r.guest_name as nombre_en_principal,
        mr.room_code as habitacion_modular,
        mr.check_in || ' → ' || mr.check_out as fechas,
        'R83-M64' as id_compuesto
    FROM reservations r
    JOIN modular_reservations mr ON r.id = mr.reservation_id
    WHERE r.id = 83 AND mr.id = 64
    
    UNION ALL
    
    -- Karen Alejandra (Principal 64 -> Modular 46)
    SELECT 
        'KAREN' as caso,
        r.id as id_principal,
        mr.id as id_modular,
        r.guest_name as nombre_en_principal,
        mr.room_code as habitacion_modular,
        mr.check_in || ' → ' || mr.check_out as fechas,
        'R64-M46' as id_compuesto
    FROM reservations r
    JOIN modular_reservations mr ON r.id = mr.reservation_id
    WHERE r.id = 64 AND mr.id = 46
    
    UNION ALL
    
    -- ID 89 como principal
    SELECT 
        'ID_89_PRINCIPAL' as caso,
        r.id as id_principal,
        mr.id as id_modular,
        r.guest_name as nombre_en_principal,
        mr.room_code as habitacion_modular,
        mr.check_in || ' → ' || mr.check_out as fechas,
        'R89-M' || mr.id as id_compuesto
    FROM reservations r
    JOIN modular_reservations mr ON r.id = mr.reservation_id
    WHERE r.id = 89
    
    UNION ALL
    
    -- ID 89 como modular
    SELECT 
        'ID_89_MODULAR' as caso,
        mr.reservation_id as id_principal,
        89 as id_modular,
        r.guest_name as nombre_en_principal,
        mr.room_code as habitacion_modular,
        mr.check_in || ' → ' || mr.check_out as fechas,
        'R' || mr.reservation_id || '-M89' as id_compuesto
    FROM modular_reservations mr
    LEFT JOIN reservations r ON mr.reservation_id = r.id
    WHERE mr.id = 89
) AS comparacion
ORDER BY caso;

-- ============================================
-- CONSULTA 5: SÚPER SIMPLE - SOLO RESULTADOS
-- ============================================
-- Si las otras son complejas, ejecuta solo esta:
SELECT 
    id,
    reservation_id,
    room_code,
    check_in,
    check_out
FROM modular_reservations 
WHERE id = 89 OR reservation_id = 89; 