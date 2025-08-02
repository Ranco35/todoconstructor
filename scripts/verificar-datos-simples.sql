-- ================================================
-- VERIFICACIÓN SIMPLE DE DATOS
-- ================================================

-- 1. CONTAR RESERVAS MODULARES
SELECT COUNT(*) as total_modular_reservations FROM modular_reservations;

-- 2. CONTAR RESERVAS PRINCIPALES
SELECT COUNT(*) as total_reservations FROM reservations;

-- 3. CONTAR CLIENTES
SELECT COUNT(*) as total_clients FROM "Client";

-- 4. CONTAR PAQUETES
SELECT COUNT(*) as total_packages FROM packages_modular;

-- 5. VER PRIMERAS 5 RESERVAS MODULARES
SELECT 
    id,
    reservation_id,
    client_id,
    room_code,
    status,
    created_at
FROM modular_reservations 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. VER PRIMERAS 5 RESERVAS PRINCIPALES
SELECT 
    id,
    guest_name,
    check_in,
    check_out,
    status,
    created_at
FROM reservations 
ORDER BY created_at DESC 
LIMIT 5; 