-- ================================================
-- VERIFICACIÓN Y ASIGNACIÓN DE PAQUETES
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

-- 2. VERIFICAR RESERVAS SIN PAQUETE
-- ================================================
SELECT 
    id,
    reservation_id,
    client_id,
    room_code,
    package_modular_id,
    package_code,
    status,
    created_at
FROM modular_reservations
WHERE package_modular_id IS NULL
ORDER BY created_at DESC;

-- 3. CONTAR RESERVAS CON Y SIN PAQUETE
-- ================================================
SELECT 
    COUNT(*) as total_reservas,
    COUNT(package_modular_id) as con_paquete,
    COUNT(*) - COUNT(package_modular_id) as sin_paquete
FROM modular_reservations;

-- 4. ASIGNAR PAQUETE "SOLO ALOJAMIENTO" A RESERVAS SIN PAQUETE
-- ================================================
-- Primero verificar si existe el paquete "Solo Alojamiento"
SELECT id, name, code FROM packages_modular WHERE code = 'SOLO_ALOJAMIENTO';

-- Si existe, actualizar las reservas sin paquete
UPDATE modular_reservations 
SET 
    package_modular_id = (SELECT id FROM packages_modular WHERE code = 'SOLO_ALOJAMIENTO'),
    package_code = 'SOLO_ALOJAMIENTO'
WHERE package_modular_id IS NULL;

-- 5. VERIFICAR RESULTADO
-- ================================================
SELECT 
    id,
    reservation_id,
    client_id,
    room_code,
    package_modular_id,
    package_code,
    status,
    created_at
FROM modular_reservations
ORDER BY created_at DESC
LIMIT 10;

-- 6. CONSULTA COMPLETA CON NOMBRES DE PAQUETES
-- ================================================
SELECT 
    mr.id,
    mr.client_id,
    mr.room_code,
    mr.status,
    mr.grand_total,
    mr.created_at,
    c."nombrePrincipal",
    c."apellido",
    pm.name as package_name,
    r.check_in,
    r.check_out,
    r.payment_status,
    r.paid_amount
FROM modular_reservations mr
LEFT JOIN "Client" c ON mr.client_id = c."id"
LEFT JOIN packages_modular pm ON mr.package_modular_id = pm.id
LEFT JOIN reservations r ON mr.reservation_id = r.id
ORDER BY mr.created_at DESC
LIMIT 10; 