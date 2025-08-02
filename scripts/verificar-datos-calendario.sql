-- ================================================
-- VERIFICACIÓN DE DATOS PARA EL CALENDARIO
-- ================================================

-- 1. VERIFICAR SI HAY DATOS EN MODULAR_RESERVATIONS
-- ================================================
SELECT 
    COUNT(*) as total_modular_reservations,
    COUNT(CASE WHEN reservation_id IS NOT NULL THEN 1 END) as con_reservation_id,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as con_client_id,
    COUNT(CASE WHEN package_modular_id IS NOT NULL THEN 1 END) as con_package_id
FROM modular_reservations;

-- 2. VERIFICAR DATOS ESPECÍFICOS DE MODULAR_RESERVATIONS
-- ================================================
SELECT 
    id,
    reservation_id,
    client_id,
    room_code,
    package_modular_id,
    status,
    grand_total,
    created_at
FROM modular_reservations
ORDER BY created_at DESC
LIMIT 10;

-- 3. VERIFICAR RELACIÓN CON RESERVATIONS
-- ================================================
SELECT 
    mr.id as modular_id,
    mr.reservation_id,
    mr.room_code,
    mr.status as modular_status,
    r.id as reservation_id,
    r.check_in,
    r.check_out,
    r.status as reservation_status,
    r.payment_status,
    r.paid_amount
FROM modular_reservations mr
LEFT JOIN reservations r ON mr.reservation_id = r.id
ORDER BY mr.created_at DESC
LIMIT 10;

-- 4. VERIFICAR RELACIÓN CON CLIENT
-- ================================================
SELECT 
    mr.id as modular_id,
    mr.client_id,
    mr.room_code,
    c."id" as client_table_id,
    c."nombrePrincipal",
    c."apellido",
    c."email"
FROM modular_reservations mr
LEFT JOIN "Client" c ON mr.client_id = c."id"
ORDER BY mr.created_at DESC
LIMIT 10;

-- 5. VERIFICAR RELACIÓN CON PACKAGES_MODULAR
-- ================================================
SELECT 
    mr.id as modular_id,
    mr.package_modular_id,
    mr.package_code,
    pm.id as package_table_id,
    pm.name as package_name,
    pm.code as package_code
FROM modular_reservations mr
LEFT JOIN packages_modular pm ON mr.package_modular_id = pm.id
ORDER BY mr.created_at DESC
LIMIT 10;

-- 6. CONSULTA COMPLETA SIMULANDO LA DEL BACKEND
-- ================================================
SELECT 
    mr.id,
    mr.client_id,
    mr.room_code,
    mr.status,
    mr.grand_total as total_amount,
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

-- 7. VERIFICAR SI HAY RESERVATIONS SIN MODULAR_RESERVATIONS
-- ================================================
SELECT 
    COUNT(*) as total_reservations,
    COUNT(mr.id) as con_modular_reservation,
    COUNT(*) - COUNT(mr.id) as sin_modular_reservation
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id;

-- 8. VERIFICAR ESTRUCTURA DE TABLAS
-- ================================================
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('modular_reservations', 'reservations', 'Client', 'packages_modular')
ORDER BY table_name, ordinal_position; 