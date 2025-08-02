-- ================================================
-- VERIFICAR PAQUETES DISPONIBLES Y ASIGNADOS
-- ================================================

-- 1. VERIFICAR PAQUETES DISPONIBLES
-- ================================================
SELECT 
    id,
    name,
    code,
    is_active
FROM packages_modular
ORDER BY id;

-- 2. VERIFICAR QUÉ PAQUETES TIENEN LAS RESERVAS
-- ================================================
SELECT 
    mr.id as reservation_id,
    mr.package_modular_id,
    mr.package_code,
    pm.id as package_table_id,
    pm.name as package_name,
    pm.code as package_code
FROM modular_reservations mr
LEFT JOIN packages_modular pm ON mr.package_modular_id = pm.id
ORDER BY mr.created_at DESC;

-- 3. VERIFICAR SI HAY COINCIDENCIA ENTRE IDS
-- ================================================
SELECT 
    'Paquetes disponibles' as tipo,
    id,
    name,
    code
FROM packages_modular
UNION ALL
SELECT 
    'Paquetes en reservas' as tipo,
    package_modular_id,
    'N/A' as name,
    package_code
FROM modular_reservations
WHERE package_modular_id IS NOT NULL
ORDER BY id;

-- 4. VERIFICAR RESERVAS CON PAQUETES VÁLIDOS
-- ================================================
SELECT 
    mr.id,
    mr.package_modular_id,
    mr.package_code,
    CASE 
        WHEN pm.id IS NOT NULL THEN 'VÁLIDO'
        ELSE 'INVÁLIDO'
    END as estado_paquete,
    pm.name as nombre_paquete
FROM modular_reservations mr
LEFT JOIN packages_modular pm ON mr.package_modular_id = pm.id
ORDER BY mr.created_at DESC;

-- 5. CONTAR RESERVAS CON PAQUETES VÁLIDOS
-- ================================================
SELECT 
    COUNT(*) as total_reservas,
    COUNT(CASE WHEN pm.id IS NOT NULL THEN 1 END) as con_paquete_valido,
    COUNT(CASE WHEN pm.id IS NULL THEN 1 END) as con_paquete_invalido
FROM modular_reservations mr
LEFT JOIN packages_modular pm ON mr.package_modular_id = pm.id; 