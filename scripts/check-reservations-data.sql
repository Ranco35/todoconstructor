-- ================================================
-- VERIFICAR DATOS BÁSICOS EN MODULAR_RESERVATIONS
-- ================================================

-- 1. Contar total de reservas
SELECT COUNT(*) as total_reservations FROM modular_reservations;

-- 2. Ver las primeras 5 reservas
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
LIMIT 5;

-- 3. Verificar si hay fechas válidas
SELECT 
    id,
    check_in,
    check_out,
    CASE 
        WHEN check_in IS NOT NULL AND check_out IS NOT NULL 
        THEN 'Fechas válidas'
        ELSE 'Fechas inválidas'
    END as fecha_status
FROM modular_reservations 
ORDER BY created_at DESC 
LIMIT 10; 