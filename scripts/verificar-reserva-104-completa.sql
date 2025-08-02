-- ================================================
-- VERIFICACIÓN COMPLETA RESERVA ID 104
-- Eduardo Proboste Furet
-- ================================================

-- ================================================
-- 1. DATOS COMPLETOS EN TABLA RESERVATIONS
-- ================================================
SELECT 
    id,
    guest_name,
    guest_email,
    guest_phone,
    client_id,
    client_type,
    check_in,
    check_out,
    guests,
    status,
    -- MONTOS PRINCIPALES
    total_amount,
    paid_amount,
    pending_amount,
    payment_status,
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
    -- FECHAS
    created_at,
    updated_at
FROM reservations
WHERE id = 104;

-- ================================================
-- 2. DATOS COMPLETOS EN TABLA MODULAR_RESERVATIONS
-- ================================================
SELECT 
    id,
    reservation_id,
    client_id,
    guest_name,
    guest_email,
    adults,
    children,
    children_ages,
    room_code,
    package_code,
    nights,
    -- MONTOS PRINCIPALES
    grand_total,
    final_price,
    base_price,
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
    -- TEMPORADA
    season_name,
    season_type,
    seasonal_multiplier,
    status,
    created_at,
    updated_at
FROM modular_reservations
WHERE reservation_id = 104;

-- ================================================
-- 3. COMPARACIÓN DE TOTALES ENTRE TABLAS
-- ================================================
SELECT 
    'RESERVATIONS' as tabla,
    104 as id,
    total_amount as monto_total,
    discount_type,
    discount_value,
    discount_amount,
    surcharge_type,
    surcharge_value, 
    surcharge_amount
FROM reservations
WHERE id = 104

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
WHERE reservation_id = 104;

-- ================================================
-- 4. VERIFICAR PRODUCTOS DE LA RESERVA
-- ================================================
SELECT 
    rp.id,
    rp.reservation_id,
    rp.product_type,
    rp.product_id,
    rp.modular_product_id,
    rp.quantity,
    rp.unit_price,
    rp.total_price,
    pm.name as product_name,
    pm.category as product_category
FROM reservation_products rp
LEFT JOIN products_modular pm ON rp.modular_product_id = pm.id
WHERE rp.reservation_id = 104;

-- ================================================
-- 5. VERIFICAR PAGOS DE LA RESERVA
-- ================================================
SELECT 
    id,
    reservation_id,
    amount,
    payment_type,
    payment_method,
    previous_paid_amount,
    new_total_paid,
    remaining_balance,
    total_reservation_amount,
    reference_number,
    processed_by,
    created_at
FROM reservation_payments
WHERE reservation_id = 104
ORDER BY created_at DESC;

-- ================================================
-- 6. ANÁLISIS DE CÁLCULOS - DETECTAR PROBLEMA
-- ================================================
SELECT 
    id,
    guest_name,
    -- DATOS PRINCIPALES
    total_amount as total_guardado,
    guests as huespedes_total,
    -- DESCUENTOS
    discount_type,
    discount_value,
    discount_amount,
    discount_reason,
    -- RECARGOS
    surcharge_type,
    surcharge_value,
    surcharge_amount,
    surcharge_reason,
    -- CÁLCULOS MANUALES
    CASE 
        -- Si hay descuento de monto fijo
        WHEN discount_type = 'fixed_amount' AND discount_value > 0 THEN 
            total_amount + discount_value
        -- Si hay descuento porcentual
        WHEN discount_type = 'percentage' AND discount_value > 0 THEN 
            ROUND(total_amount / (1 - discount_value/100))
        -- Si hay recargo de monto fijo
        WHEN surcharge_type = 'fixed_amount' AND surcharge_value > 0 THEN 
            total_amount - surcharge_value
        -- Si hay recargo porcentual
        WHEN surcharge_type = 'percentage' AND surcharge_value > 0 THEN 
            ROUND(total_amount / (1 + surcharge_value/100))
        ELSE total_amount
    END as total_sin_descuento_recargo,
    -- VERIFICACIÓN DEL PROBLEMA
    CASE 
        WHEN discount_type != 'none' AND discount_value > 0 THEN '⚠️ DESCUENTO APLICADO'
        WHEN surcharge_type != 'none' AND surcharge_value > 0 THEN '⚠️ RECARGO APLICADO'
        ELSE '✅ SIN DESCUENTO/RECARGO'
    END as estado_descuento_recargo
FROM reservations
WHERE id = 104;

-- ================================================
-- 7. VERIFICAR CLIENTE ASOCIADO
-- ================================================
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.guest_email,
    r.client_id,
    c."id" as client_table_id,
    c."nombrePrincipal",
    c."apellido", 
    c."email" as client_email,
    c."telefono",
    c."tipoCliente",
    CASE 
        WHEN r.client_id IS NOT NULL THEN '✅ ASOCIADO EN RESERVA'
        WHEN c."id" IS NOT NULL THEN '⚠️ EXISTE EN TABLA CLIENT'
        ELSE '❌ NO REGISTRADO'
    END as estado_cliente
FROM reservations r
LEFT JOIN "Client" c ON r.guest_email = c."email"
WHERE r.id = 104;

-- ================================================
-- 8. RESUMEN FINAL - DATOS CLAVE
-- ================================================
SELECT 
    '=== RESUMEN RESERVA 104 ===' as info,
    r.guest_name as huésped,
    r.total_amount as total,
    CONCAT(r.discount_type, ' - ', r.discount_value, ' = ', r.discount_amount) as descuento,
    CONCAT(r.surcharge_type, ' - ', r.surcharge_value, ' = ', r.surcharge_amount) as recargo,
    mr.grand_total as total_modular,
    mr.adults as adultos,
    mr.children as niños,
    mr.package_code as paquete
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
WHERE r.id = 104; 