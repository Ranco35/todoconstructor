-- ================================================
-- ANÁLISIS COMPLETO DE LA RESERVA 26
-- ================================================

-- ================================================
-- 1. VERIFICAR SI LA RESERVA 26 TIENE CLIENTE ASOCIADO
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
        WHEN r.client_id IS NOT NULL THEN 'SÍ - Asociado en Reserva'
        WHEN c."id" IS NOT NULL THEN 'SÍ - Existe en Tabla Client'
        ELSE 'NO - No Registrado'
    END as estado_cliente
FROM reservations r
LEFT JOIN "Client" c ON r.guest_email = c."email"
WHERE r.id = 26;

-- ================================================
-- 2. VERIFICAR SI EXISTE CLIENTE CON EL EMAIL
-- ================================================
SELECT 
    "id",
    "nombrePrincipal",
    "apellido",
    "email",
    "telefono",
    "tipoCliente",
    "fechaCreacion"
FROM "Client"
WHERE "email" = 'eduardo@termasllifen.cl';

-- ================================================
-- 3. VERIFICAR DATOS COMPLETOS DE LA RESERVA 26
-- ================================================
SELECT 
    id,
    guest_name,
    guest_email,
    guest_phone,
    client_id,
    client_type,
    billing_name,
    billing_rut,
    billing_address,
    authorized_by,
    check_in,
    check_out,
    guests,
    status,
    total_amount,
    paid_amount,
    pending_amount,
    payment_status,
    created_at,
    updated_at
FROM reservations
WHERE id = 26;

-- ================================================
-- 4. VERIFICAR RESERVA MODULAR
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
-- 5. VERIFICAR PAGOS
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
-- 6. COMPARAR DATOS DE FACTURACIÓN VS HUÉSPED
-- ================================================
SELECT 
    id,
    guest_name as "Nombre Huésped",
    billing_name as "Nombre Facturación",
    guest_email as "Email Huésped",
    billing_rut as "RUT Facturación",
    CASE 
        WHEN guest_name = billing_name THEN 'IGUAL'
        ELSE 'DIFERENTE'
    END as "Comparación Nombre",
    client_type as "Tipo Cliente",
    authorized_by as "Autorizado por"
FROM reservations
WHERE id = 26;

-- ================================================
-- 7. VERIFICAR SI HAY OTRAS RESERVAS DEL MISMO USUARIO
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
-- 8. RESUMEN DE LA SITUACIÓN
-- ================================================
SELECT 
    'RESERVA 26 - ANÁLISIS COMPLETO' as informacion,
    'Eduardo pp' as nombre_huésped,
    'eduardo@termasllifen.cl' as email,
    'SÍ - Es Usuario del Sistema' as estado_usuario,
    'authenticated' as rol_usuario,
    'Pendiente verificar cliente' as estado_cliente,
    'Pendiente verificar facturación' as estado_facturacion; 