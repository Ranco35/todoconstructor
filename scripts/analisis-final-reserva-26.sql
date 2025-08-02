-- ================================================
-- ANÁLISIS FINAL DE LA RESERVA 26
-- ================================================

-- ================================================
-- 1. VERIFICAR DATOS COMPLETOS DE FACTURACIÓN
-- ================================================
SELECT 
    id,
    guest_name as "Nombre Huésped",
    billing_name as "Nombre Facturación",
    guest_email as "Email Huésped",
    billing_rut as "RUT Facturación",
    billing_address as "Dirección Facturación",
    authorized_by as "Autorizado por",
    client_type as "Tipo Cliente",
    client_id as "ID Cliente",
    CASE 
        WHEN guest_name = billing_name THEN 'IGUAL'
        ELSE 'DIFERENTE'
    END as "Comparación Nombre",
    CASE 
        WHEN guest_email = billing_rut THEN 'IGUAL'
        ELSE 'DIFERENTE'
    END as "Comparación Email/RUT"
FROM reservations
WHERE id = 26;

-- ================================================
-- 2. VERIFICAR RESERVA MODULAR
-- ================================================
SELECT 
    id,
    reservation_id,
    client_id,
    adults,
    children,
    children_ages,
    room_code,
    package_code,
    grand_total,
    nights,
    status,
    created_at
FROM modular_reservations
WHERE reservation_id = 26;

-- ================================================
-- 3. VERIFICAR HISTORIAL DE PAGOS
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
WHERE reservation_id = 26
ORDER BY created_at DESC;

-- ================================================
-- 4. VERIFICAR OTRAS RESERVAS DEL MISMO USUARIO
-- ================================================
SELECT 
    id,
    guest_name,
    guest_email,
    client_id,
    client_type,
    check_in,
    check_out,
    status,
    total_amount,
    created_at
FROM reservations
WHERE guest_email = 'eduardo@termasllifen.cl'
ORDER BY created_at DESC;

-- ================================================
-- 5. RESUMEN FINAL DE LA SITUACIÓN
-- ================================================
SELECT 
    'RESERVA 26 - ANÁLISIS COMPLETO' as informacion,
    'Eduardo pp' as nombre_huésped,
    'eduardo@termasllifen.cl' as email,
    'SÍ - Es Usuario del Sistema' as estado_usuario,
    'authenticated' as rol_usuario,
    'SÍ - Asociado en Reserva' as estado_cliente,
    'empresa prueba' as nombre_cliente,
    'ID 37' as client_id_reserva,
    'ID 41' as client_id_tabla;

-- ================================================
-- 6. VERIFICAR SI HAY RESERVAS MODULARES
-- ================================================
SELECT 
    COUNT(*) as total_reservas_modulares
FROM modular_reservations
WHERE reservation_id = 26;

-- ================================================
-- 7. VERIFICAR SI HAY PAGOS
-- ================================================
SELECT 
    COUNT(*) as total_pagos
FROM reservation_payments
WHERE reservation_id = 26;

-- ================================================
-- 8. COMPARAR CON OTRAS RESERVAS
-- ================================================
SELECT 
    'Total Reservas' as metric,
    COUNT(*) as value
FROM reservations
UNION ALL
SELECT 
    'Reservas con Cliente',
    COUNT(client_id)
FROM reservations
UNION ALL
SELECT 
    'Reservas de Usuarios del Sistema',
    COUNT(*)
FROM reservations r
INNER JOIN auth.users u ON r.guest_email = u.email
UNION ALL
SELECT 
    'Reservas Modulares',
    COUNT(*)
FROM modular_reservations
UNION ALL
SELECT 
    'Reservas con Pagos',
    COUNT(DISTINCT reservation_id)
FROM reservation_payments; 