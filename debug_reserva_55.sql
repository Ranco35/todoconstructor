-- ================================================
-- ANÁLISIS COMPLETO DE LA RESERVA 55
-- ================================================

-- 1. INFORMACIÓN PRINCIPAL DE LA RESERVA
SELECT 
    '=== RESERVA PRINCIPAL ===' as seccion,
    r.id as reservation_id,
    r.guest_name,
    r.guest_email,
    r.guest_phone,
    r.check_in,
    r.check_out,
    r.guests,
    r.room_id,
    r.client_type,
    r.contact_id,
    r.company_id,
    r.billing_name,
    r.billing_rut,
    r.billing_address,
    r.authorized_by,
    r.status,
    r.total_amount,
    r.deposit_amount,
    r.paid_amount,
    r.pending_amount,
    r.payment_status,
    r.payment_method,
    r.created_at,
    r.updated_at,
    -- Información de la habitación
    rm.number as room_number,
    rm.type as room_type,
    rm.capacity as room_capacity,
    rm.price_per_night as room_price,
    -- Información del cliente
    c.name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    c.document_number as client_document
FROM reservations r
LEFT JOIN rooms rm ON r.room_id = rm.id
LEFT JOIN "Client" c ON r.client_id = c.id
WHERE r.id = 55;

-- 2. INFORMACIÓN MODULAR DE LA RESERVA
SELECT 
    '=== RESERVA MODULAR ===' as seccion,
    mr.id as modular_reservation_id,
    mr.reservation_id,
    mr.adults,
    mr.children,
    mr.children_ages,
    mr.package_modular_id,
    mr.room_code,
    mr.package_code,
    mr.additional_products,
    mr.pricing_breakdown,
    mr.room_total,
    mr.package_total,
    mr.additional_total,
    mr.grand_total,
    mr.nights,
    mr.daily_average,
    mr.client_id,
    mr.comments,
    mr.status,
    mr.season_name,
    mr.season_type,
    mr.seasonal_multiplier,
    mr.base_price,
    mr.final_price,
    mr.created_at,
    mr.updated_at,
    -- Información del paquete
    pm.name as package_name,
    pm.description as package_description,
    pm.color as package_color
FROM modular_reservations mr
LEFT JOIN packages_modular pm ON mr.package_modular_id = pm.id
WHERE mr.reservation_id = 55;

-- 3. PRODUCTOS ASOCIADOS (SISTEMA TRADICIONAL)
SELECT 
    '=== PRODUCTOS TRADICIONALES ===' as seccion,
    rp.id as reservation_product_id,
    rp.reservation_id,
    rp.product_id,
    rp.quantity,
    rp.unit_price,
    rp.total_price,
    rp.product_type,
    rp.modular_product_id,
    rp.created_at,
    -- Información del producto SPA
    sp.name as spa_product_name,
    sp.description as spa_product_description,
    sp.category as spa_product_category,
    sp.type as spa_product_type,
    sp.price as spa_product_price,
    sp.duration as spa_product_duration,
    sp.sku as spa_product_sku,
    -- Información del producto modular
    pm.name as modular_product_name,
    pm.description as modular_product_description,
    pm.category as modular_product_category,
    pm.price as modular_product_price,
    pm.per_person as modular_product_per_person
FROM reservation_products rp
LEFT JOIN spa_products sp ON rp.product_id = sp.id AND rp.product_type = 'spa_product'
LEFT JOIN products_modular pm ON rp.modular_product_id = pm.id
WHERE rp.reservation_id = 55;

-- 4. PRODUCTOS DEL PAQUETE MODULAR
SELECT 
    '=== PRODUCTOS DEL PAQUETE MODULAR ===' as seccion,
    ppm.id as package_product_id,
    ppm.package_id,
    ppm.product_id,
    ppm.is_included,
    ppm.sort_order,
    -- Información del producto
    pm.name as product_name,
    pm.description as product_description,
    pm.category as product_category,
    pm.price as product_price,
    pm.per_person as product_per_person,
    pm.is_active as product_is_active,
    -- Información del paquete
    pkg.name as package_name,
    pkg.code as package_code,
    pkg.color as package_color
FROM package_products_modular ppm
JOIN products_modular pm ON ppm.product_id = pm.id
JOIN packages_modular pkg ON ppm.package_id = pkg.id
WHERE ppm.package_id = (
    SELECT package_modular_id 
    FROM modular_reservations 
    WHERE reservation_id = 55
);

-- 5. PAGOS REALIZADOS
SELECT 
    '=== PAGOS ===' as seccion,
    rp.id as payment_id,
    rp.reservation_id,
    rp.amount,
    rp.payment_type,
    rp.payment_method,
    rp.previous_paid_amount,
    rp.new_total_paid,
    rp.remaining_balance,
    rp.total_reservation_amount,
    rp.reference_number,
    rp.notes,
    rp.processed_by,
    rp.created_at,
    rp.updated_at
FROM reservation_payments rp
WHERE rp.reservation_id = 55
ORDER BY rp.created_at;

-- 6. COMENTARIOS
SELECT 
    '=== COMENTARIOS ===' as seccion,
    rc.id as comment_id,
    rc.reservation_id,
    rc.text,
    rc.author,
    rc.comment_type,
    rc.created_at
FROM reservation_comments rc
WHERE rc.reservation_id = 55
ORDER BY rc.created_at;

-- 7. TRACKING DE VENTAS DE PRODUCTOS
SELECT 
    '=== TRACKING VENTAS ===' as seccion,
    pst.id as tracking_id,
    pst.product_id,
    pst.sale_date,
    pst.sale_type,
    pst.package_id,
    pst.quantity,
    pst.unit_price,
    pst.total_amount,
    pst.customer_info,
    pst.reservation_id,
    pst.notes,
    pst.created_at,
    -- Información del producto
    pm.name as product_name,
    pm.category as product_category
FROM product_sales_tracking pst
LEFT JOIN products_modular pm ON pst.product_id = pm.id
WHERE pst.reservation_id = 55;

-- 8. RESUMEN DE TOTALES
SELECT 
    '=== RESUMEN TOTALES ===' as seccion,
    r.id as reservation_id,
    r.total_amount as reservation_total,
    r.paid_amount as reservation_paid,
    r.pending_amount as reservation_pending,
    COALESCE(mr.grand_total, 0) as modular_total,
    COALESCE(SUM(rp.total_price), 0) as products_total,
    COALESCE(SUM(pay.amount), 0) as payments_total,
    -- Verificación de consistencia
    CASE 
        WHEN r.total_amount = COALESCE(mr.grand_total, 0) + COALESCE(SUM(rp.total_price), 0) 
        THEN 'CONSISTENTE' 
        ELSE 'INCONSISTENTE' 
    END as consistency_check
FROM reservations r
LEFT JOIN modular_reservations mr ON r.id = mr.reservation_id
LEFT JOIN reservation_products rp ON r.id = rp.reservation_id
LEFT JOIN reservation_payments pay ON r.id = pay.reservation_id
WHERE r.id = 55
GROUP BY r.id, r.total_amount, r.paid_amount, r.pending_amount, mr.grand_total;

-- 9. VERIFICACIÓN DE EDAD Y PRECIOS
SELECT 
    '=== VERIFICACIÓN PRECIOS POR EDAD ===' as seccion,
    apm.id as age_pricing_id,
    apm.age_category,
    apm.min_age,
    apm.max_age,
    apm.multiplier,
    apm.description,
    apm.is_active
FROM age_pricing_modular apm
WHERE apm.is_active = true
ORDER BY apm.min_age;

-- 10. PRODUCTOS DISPONIBLES EN EL SISTEMA
SELECT 
    '=== PRODUCTOS DISPONIBLES ===' as seccion,
    pm.id as product_id,
    pm.name,
    pm.category,
    pm.price,
    pm.per_person,
    pm.is_active,
    pm.sort_order,
    -- Contar en cuántos paquetes está
    COUNT(ppm.id) as package_count
FROM products_modular pm
LEFT JOIN package_products_modular ppm ON pm.id = ppm.product_id
WHERE pm.is_active = true
GROUP BY pm.id, pm.name, pm.category, pm.price, pm.per_person, pm.is_active, pm.sort_order
ORDER BY pm.category, pm.sort_order; 