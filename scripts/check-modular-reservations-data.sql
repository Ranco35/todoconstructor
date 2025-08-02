-- ================================================
-- VERIFICAR DATOS EN MODULAR_RESERVATIONS
-- ================================================

-- 1. Verificar cuántas reservas hay
SELECT COUNT(*) as total_reservations FROM modular_reservations;

-- 2. Verificar las reservas con información básica
SELECT 
    id,
    client_id,
    room_code,
    check_in,
    check_out,
    status,
    package_modular_id,
    created_at
FROM modular_reservations 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Verificar si hay clientes asociados
SELECT 
    mr.id as reservation_id,
    mr.client_id,
    c."nombrePrincipal",
    c."apellido",
    mr.room_code,
    mr.check_in,
    mr.check_out
FROM modular_reservations mr
LEFT JOIN "Client" c ON mr.client_id = c.id
ORDER BY mr.created_at DESC 
LIMIT 10;

-- 4. Verificar si hay paquetes asociados
SELECT 
    mr.id as reservation_id,
    mr.package_modular_id,
    p.name as package_name,
    mr.room_code,
    mr.check_in,
    mr.check_out
FROM modular_reservations mr
LEFT JOIN packages_modular p ON mr.package_modular_id = p.id
ORDER BY mr.created_at DESC 
LIMIT 10;

-- 5. Verificar reservas para fechas específicas (últimos 30 días)
SELECT 
    mr.id,
    c."nombrePrincipal" || ' ' || COALESCE(c."apellido", '') as client_full_name,
    p.name as package_name,
    mr.room_code,
    mr.check_in,
    mr.check_out,
    mr.status
FROM modular_reservations mr
LEFT JOIN "Client" c ON mr.client_id = c.id
LEFT JOIN packages_modular p ON mr.package_modular_id = p.id
WHERE mr.check_in >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY mr.check_in DESC; 