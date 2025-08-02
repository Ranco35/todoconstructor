-- 🔍 BÚSQUEDA FINAL ID 89 - USANDO COLUMNAS REALES
-- Tabla modular_reservations NO tiene check_in/check_out

-- ============================================
-- CONSULTA 1: ID 89 EN TABLA RESERVATIONS (PRINCIPAL)
-- ============================================
SELECT 
    'PRINCIPAL' as tipo,
    id,
    guest_name,
    check_in,
    check_out,
    room_id,
    status
FROM reservations 
WHERE id = 89;

-- ============================================
-- CONSULTA 2: ID 89 EN TABLA MODULAR_RESERVATIONS (MODULAR)
-- ============================================
SELECT 
    'MODULAR' as tipo,
    id,
    reservation_id,
    room_code,
    package_code,
    adults,
    children,
    status,
    created_at
FROM modular_reservations 
WHERE id = 89 OR reservation_id = 89;

-- ============================================
-- CONSULTA 3: SÚPER SIMPLE - SOLO LO BÁSICO
-- ============================================
SELECT 
    id,
    reservation_id,
    room_code,
    package_code,
    status
FROM modular_reservations 
WHERE id = 89 OR reservation_id = 89;

-- ============================================
-- CONSULTA 4: CON FECHAS - COMBINANDO AMBAS TABLAS
-- ============================================
SELECT 
    mr.id as id_modular,
    mr.reservation_id as id_principal,
    mr.room_code,
    mr.package_code,
    mr.status as status_modular,
    r.guest_name,
    r.check_in,
    r.check_out,
    r.status as status_principal,
    CASE 
        WHEN mr.id = 89 THEN 'R' || mr.reservation_id || '-M89'
        WHEN mr.reservation_id = 89 THEN 'R89-M' || mr.id
        ELSE 'N/A'
    END as id_compuesto
FROM modular_reservations mr
LEFT JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.id = 89 OR mr.reservation_id = 89;

-- ============================================
-- CONSULTA 5: COMPARAR CON VICTOR Y KAREN
-- ============================================
SELECT 
    caso,
    id_principal,
    id_modular,
    nombre,
    habitacion,
    fechas,
    id_compuesto
FROM (
    -- Victor: Principal 83 -> Modular 64
    SELECT 
        'VICTOR' as caso,
        r.id as id_principal,
        mr.id as id_modular,
        r.guest_name as nombre,
        mr.room_code as habitacion,
        r.check_in || ' → ' || r.check_out as fechas,
        'R83-M64' as id_compuesto
    FROM reservations r
    JOIN modular_reservations mr ON r.id = mr.reservation_id
    WHERE r.id = 83 AND mr.id = 64
    
    UNION ALL
    
    -- Karen: Principal 64 -> Modular 46  
    SELECT 
        'KAREN' as caso,
        r.id as id_principal,
        mr.id as id_modular,
        r.guest_name as nombre,
        mr.room_code as habitacion,
        r.check_in || ' → ' || r.check_out as fechas,
        'R64-M46' as id_compuesto
    FROM reservations r
    JOIN modular_reservations mr ON r.id = mr.reservation_id
    WHERE r.id = 64 AND mr.id = 46
    
    UNION ALL
    
    -- ID 89 
    SELECT 
        'ID_89' as caso,
        mr.reservation_id as id_principal,
        mr.id as id_modular,
        r.guest_name as nombre,
        mr.room_code as habitacion,
        r.check_in || ' → ' || r.check_out as fechas,
        CASE 
            WHEN mr.id = 89 THEN 'R' || mr.reservation_id || '-M89'
            WHEN mr.reservation_id = 89 THEN 'R89-M' || mr.id
            ELSE 'ERROR'
        END as id_compuesto
    FROM modular_reservations mr
    LEFT JOIN reservations r ON mr.reservation_id = r.id
    WHERE mr.id = 89 OR mr.reservation_id = 89
) AS comparacion
ORDER BY caso; 