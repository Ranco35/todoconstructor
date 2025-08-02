-- 🔍 BÚSQUEDA SÚPER SIMPLE DE RESERVA ID 89
-- Solo usa modular_reservations (sin problemas de nomenclatura)

-- ============================================
-- CONSULTA 1: ¿DÓNDE ESTÁ EL ID 89?
-- ============================================
SELECT 
    id,
    reservation_id,
    guest_name,
    package_name,
    room_code,
    check_in,
    check_out,
    CASE 
        WHEN id = 89 THEN '🎯 ID 89 es MODULAR'
        WHEN reservation_id = 89 THEN '🔗 ID 89 es PRINCIPAL'
        ELSE 'ERROR'
    END as tipo
FROM modular_reservations 
WHERE id = 89 OR reservation_id = 89;

-- ============================================
-- CONSULTA 2: COMPARAR CON VICTOR Y KAREN
-- ============================================
SELECT 
    guest_name,
    id as id_modular,
    reservation_id as id_principal,
    room_code,
    check_in,
    check_out,
    CASE 
        WHEN reservation_id = 83 AND id = 64 THEN '👨 VICTOR'
        WHEN reservation_id = 64 AND id = 46 THEN '👩 KAREN'
        WHEN id = 89 THEN '🎯 ID_89_MODULAR'
        WHEN reservation_id = 89 THEN '🎯 ID_89_PRINCIPAL'
        ELSE 'OTRO'
    END as identificacion
FROM modular_reservations 
WHERE 
    (reservation_id = 83 AND id = 64) OR  -- Victor
    (reservation_id = 64 AND id = 46) OR  -- Karen
    (id = 89) OR                          -- ID 89 como modular
    (reservation_id = 89)                 -- ID 89 como principal
ORDER BY 
    CASE 
        WHEN reservation_id = 83 AND id = 64 THEN 1  -- Victor primero
        WHEN reservation_id = 64 AND id = 46 THEN 2  -- Karen segundo
        WHEN id = 89 OR reservation_id = 89 THEN 3   -- ID 89 al final
        ELSE 4
    END;

-- ============================================
-- CONSULTA 3: PATRÓN ID COMPUESTO PARA ID 89
-- ============================================
SELECT 
    guest_name,
    id,
    reservation_id,
    room_code,
    CASE 
        WHEN id = 89 AND reservation_id IS NOT NULL THEN 
            'R' || reservation_id || '-M89'
        WHEN reservation_id = 89 THEN 
            'R89-M' || id
        ELSE 'Sin patrón'
    END as id_compuesto_seria
FROM modular_reservations 
WHERE id = 89 OR reservation_id = 89; 