-- ================================================
-- CONSULTAS SIMPLES SIN ALIAS (PARA EVITAR ERRORES)
-- ================================================

-- ================================================
-- 1. CONSULTA BÁSICA DE LA RESERVA 26
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
-- 2. VERIFICAR SI LA RESERVA 26 TIENE CLIENTE
-- ================================================
SELECT 
    r.id,
    r.guest_name,
    r.guest_email,
    r.client_id,
    c.id as client_table_id,
    c.nombrePrincipal,
    c.apellido,
    c.email as client_email,
    c.telefono,
    c.tipoCliente
FROM reservations r
LEFT JOIN "Client" c ON r.guest_email = c.email
WHERE r.id = 26;

-- ================================================
-- 3. VERIFICAR SI LA RESERVA 26 TIENE USUARIO
-- ================================================
SELECT 
    r.id,
    r.guest_name,
    r.guest_email,
    u.id as user_id,
    u.email as user_email,
    u.role,
    u.created_at as user_created_at
FROM reservations r
LEFT JOIN auth.users u ON r.guest_email = u.email
WHERE r.id = 26;

-- ================================================
-- 4. CONSULTA GENERAL DE RESERVAS
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
    check_in,
    check_out,
    guests,
    status,
    total_amount,
    paid_amount,
    pending_amount,
    payment_status,
    created_at
FROM reservations
ORDER BY created_at DESC
LIMIT 10;

-- ================================================
-- 5. CONTAR RESERVAS CON Y SIN CLIENTE
-- ================================================
SELECT 
    COUNT(*) as total_reservas,
    COUNT(client_id) as reservas_con_cliente,
    COUNT(*) - COUNT(client_id) as reservas_sin_cliente
FROM reservations;

-- ================================================
-- 6. VERIFICAR RESERVA MODULAR PARA ID 26
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
-- 7. VERIFICAR PAGOS DE LA RESERVA 26
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
-- 8. BUSCAR CLIENTE POR EMAIL DE LA RESERVA 26
-- ================================================
SELECT 
    id,
    nombrePrincipal,
    apellido,
    email,
    telefono,
    tipoCliente,
    fechaCreacion
FROM "Client"
WHERE email = (
    SELECT guest_email 
    FROM reservations 
    WHERE id = 26
);

-- ================================================
-- 9. BUSCAR USUARIO POR EMAIL DE LA RESERVA 26
-- ================================================
SELECT 
    id,
    email,
    role,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email = (
    SELECT guest_email 
    FROM reservations 
    WHERE id = 26
);

-- ================================================
-- 10. RESUMEN ESTADÍSTICO
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
    'Reservas Individuales',
    COUNT(*)
FROM reservations
WHERE client_type = 'individual'
UNION ALL
SELECT 
    'Reservas Corporativas',
    COUNT(*)
FROM reservations
WHERE client_type = 'corporate'
UNION ALL
SELECT 
    'Total Facturado',
    SUM(total_amount)
FROM reservations
UNION ALL
SELECT 
    'Total Pagado',
    SUM(paid_amount)
FROM reservations
UNION ALL
SELECT 
    'Total Pendiente',
    SUM(pending_amount)
FROM reservations; 