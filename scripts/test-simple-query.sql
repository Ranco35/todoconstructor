-- ================================================
-- CONSULTA SIMPLE PARA VERIFICAR DATOS
-- ================================================

-- 1. Verificar si la tabla existe y tiene datos
SELECT 
    'modular_reservations' as table_name,
    COUNT(*) as total_rows
FROM modular_reservations;

-- 2. Ver las primeras 3 reservas con información básica
SELECT 
    id,
    client_id,
    room_code,
    check_in,
    check_out,
    status,
    created_at
FROM modular_reservations 
ORDER BY created_at DESC 
LIMIT 3;

-- 3. Verificar si hay clientes asociados
SELECT 
    mr.id,
    mr.client_id,
    c."nombrePrincipal",
    c."apellido"
FROM modular_reservations mr
LEFT JOIN "Client" c ON mr.client_id = c.id
ORDER BY mr.created_at DESC 
LIMIT 3;

-- 4. Verificar si hay paquetes asociados
SELECT 
    mr.id,
    mr.package_modular_id,
    p.name as package_name
FROM modular_reservations mr
LEFT JOIN packages_modular p ON mr.package_modular_id = p.id
ORDER BY mr.created_at DESC 
LIMIT 3; 