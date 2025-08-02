-- ================================================
-- VERIFICAR DATOS DE DESCUENTO/RECARGO - RESERVA 101
-- ================================================

-- ================================================
-- 1. DATOS COMPLETOS DE DESCUENTO/RECARGO EN RESERVATIONS
-- ================================================
SELECT 
    id,
    guest_name,
    total_amount,
    -- CAMPOS DE DESCUENTO
    discount_type,
    discount_value, 
    discount_amount,
    discount_reason,
    -- CAMPOS DE RECARGO
    surcharge_type,
    surcharge_value,
    surcharge_amount,
    surcharge_reason,
    -- DATOS ADICIONALES
    status,
    created_at
FROM reservations
WHERE id = 101;

-- ================================================
-- 2. DATOS COMPLETOS EN MODULAR_RESERVATIONS
-- ================================================
SELECT 
    id,
    reservation_id,
    client_id,
    guest_name,
    room_code,
    package_code,
    grand_total,
    -- CAMPOS DE DESCUENTO
    discount_type,
    discount_value,
    discount_amount,
    discount_reason,
    -- CAMPOS DE RECARGO 
    surcharge_type,
    surcharge_value,
    surcharge_amount,
    surcharge_reason,
    status,
    created_at
FROM modular_reservations
WHERE reservation_id = 101;

-- ================================================
-- 3. COMPARACIÓN DE TOTALES
-- ================================================
SELECT 
    'RESERVATIONS' as tabla,
    id,
    total_amount as monto_total,
    discount_type,
    discount_value,
    discount_amount,
    surcharge_type,
    surcharge_value, 
    surcharge_amount
FROM reservations
WHERE id = 101

UNION ALL

SELECT 
    'MODULAR_RESERVATIONS' as tabla,
    reservation_id as id,
    grand_total as monto_total,
    discount_type,
    discount_value,
    discount_amount,
    surcharge_type,
    surcharge_value,
    surcharge_amount
FROM modular_reservations
WHERE reservation_id = 101;

-- ================================================
-- 4. CÁLCULO MANUAL PARA VERIFICAR
-- ================================================
SELECT 
    id,
    guest_name,
    total_amount as total_guardado,
    discount_type,
    discount_value,
    discount_amount,
    surcharge_type,
    surcharge_value,
    surcharge_amount,
    -- CÁLCULO MANUAL
    CASE 
        WHEN discount_type = 'none' AND surcharge_type = 'none' THEN total_amount
        WHEN discount_type = 'fixed_amount' THEN total_amount + discount_value
        WHEN surcharge_type = 'fixed_amount' THEN total_amount + surcharge_value
        ELSE total_amount
    END as total_calculado_manual,
    -- DIFERENCIA
    CASE 
        WHEN discount_type = 'fixed_amount' THEN total_amount + discount_value - total_amount
        WHEN surcharge_type = 'fixed_amount' THEN total_amount + surcharge_value - total_amount
        ELSE 0
    END as diferencia
FROM reservations
WHERE id = 101; 