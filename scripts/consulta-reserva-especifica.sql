-- ================================================
-- CONSULTAS ESPECÍFICAS PARA RESERVA ID 26
-- ================================================

-- ================================================
-- 1. CONSULTA ESPECÍFICA DE LA RESERVA 26
-- ================================================
SELECT 
    r.id,
    r.guest_name AS "Nombre del Huésped",
    r.guest_email AS "Email del Huésped",
    r.guest_phone AS "Teléfono del Huésped",
    r.client_id AS "ID del Cliente",
    r.client_type AS "Tipo de Cliente",
    r.billing_name AS "Nombre de Facturación",
    r.billing_rut AS "RUT de Facturación",
    r.billing_address AS "Dirección de Facturación",
    r.authorized_by AS "Autorizado por",
    r.check_in AS "Check-in",
    r.check_out AS "Check-out",
    r.guests AS "Número de Huéspedes",
    r.status AS "Estado",
    r.total_amount AS "Monto Total",
    r.paid_amount AS "Monto Pagado",
    r.pending_amount AS "Monto Pendiente",
    r.payment_status AS "Estado de Pago",
    r.created_at AS "Fecha de Creación",
    r.updated_at AS "Fecha de Actualización"
FROM reservations r
WHERE r.id = 26;

-- ================================================
-- 2. VERIFICAR SI LA RESERVA 26 TIENE CLIENTE ASOCIADO
-- ================================================
SELECT 
    r.id AS "ID Reserva",
    r.guest_name AS "Nombre del Huésped",
    r.guest_email AS "Email del Huésped",
    c."id" AS "ID del Cliente en Reserva",
    c."nombrePrincipal" AS "Nombre del Cliente",
    c."apellido" AS "Apellido del Cliente",
    c."email" AS "Email del Cliente",
    c."telefono" AS "Teléfono del Cliente",
    c."tipoCliente" AS "Tipo de Cliente",
    CASE 
        WHEN r.client_id IS NOT NULL THEN 'SÍ - Asociado en Reserva'
        WHEN c."id" IS NOT NULL THEN 'SÍ - Existe en Tabla Client'
        ELSE 'NO - No Registrado'
    END AS "Estado Cliente"
FROM reservations r
LEFT JOIN "Client" c ON r.guest_email = c."email"
WHERE r.id = 26;

-- ================================================
-- 3. VERIFICAR SI LA RESERVA 26 TIENE USUARIO DEL SISTEMA
-- ================================================
SELECT 
    r.id AS "ID Reserva",
    r.guest_name AS "Nombre del Huésped",
    r.guest_email AS "Email del Huésped",
    u.id AS "ID Usuario Sistema",
    u.email AS "Email Usuario Sistema",
    u.role AS "Rol Usuario",
    u.created_at AS "Fecha Creación Usuario",
    CASE 
        WHEN u.id IS NOT NULL THEN 'SÍ - Es Usuario del Sistema'
        ELSE 'NO - No es Usuario del Sistema'
    END AS "Estado Usuario"
FROM reservations r
LEFT JOIN auth.users u ON r.guest_email = u.email
WHERE r.id = 26;

-- ================================================
-- 4. VERIFICAR RESERVA MODULAR SI EXISTE
-- ================================================
SELECT 
    mr.id AS "ID Reserva Modular",
    mr.reservation_id AS "ID Reserva Principal",
    mr.client_id AS "ID del Cliente",
    mr.adults AS "Adultos",
    mr.children AS "Niños",
    mr.children_ages AS "Edades de Niños",
    mr.room_code AS "Código Habitación",
    mr.package_code AS "Código Paquete",
    mr.grand_total AS "Total General",
    mr.nights AS "Noches",
    mr.status AS "Estado",
    mr.created_at AS "Fecha Creación"
FROM modular_reservations mr
WHERE mr.reservation_id = 26;

-- ================================================
-- 5. VERIFICAR PAGOS DE LA RESERVA 26
-- ================================================
SELECT 
    rp.id AS "ID Pago",
    rp.reservation_id AS "ID Reserva",
    rp.amount AS "Monto del Pago",
    rp.payment_type AS "Tipo de Pago",
    rp.payment_method AS "Método de Pago",
    rp.previous_paid_amount AS "Monto Pagado Anterior",
    rp.new_total_paid AS "Nuevo Total Pagado",
    rp.remaining_balance AS "Saldo Pendiente",
    rp.total_reservation_amount AS "Total de la Reserva",
    rp.reference_number AS "Número de Referencia",
    rp.processed_by AS "Procesado por",
    rp.created_at AS "Fecha del Pago"
FROM reservation_payments rp
WHERE rp.reservation_id = 26
ORDER BY rp.created_at DESC;

-- ================================================
-- 6. CONSULTA SIMPLE - SOLO DATOS BÁSICOS
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
    status,
    total_amount,
    created_at
FROM reservations
WHERE id = 26;

-- ================================================
-- 7. CONSULTA PARA VER TODAS LAS RESERVAS (SIN ALIAS)
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
    created_at,
    updated_at
FROM reservations
ORDER BY created_at DESC
LIMIT 10;

-- ================================================
-- 8. VERIFICAR SI EXISTE CLIENTE CON EL EMAIL DE LA RESERVA 26
-- ================================================
SELECT 
    c."id",
    c."nombrePrincipal",
    c."apellido",
    c."email",
    c."telefono",
    c."tipoCliente",
    c."fechaCreacion"
FROM "Client" c
WHERE c."email" = (
    SELECT guest_email 
    FROM reservations 
    WHERE id = 26
);

-- ================================================
-- 9. VERIFICAR SI EXISTE USUARIO CON EL EMAIL DE LA RESERVA 26
-- ================================================
SELECT 
    u.id,
    u.email,
    u.role,
    u.created_at,
    u.last_sign_in_at
FROM auth.users u
WHERE u.email = (
    SELECT guest_email 
    FROM reservations 
    WHERE id = 26
);

-- ================================================
-- 10. RESUMEN DE LA RESERVA 26
-- ================================================
SELECT 
    'RESERVA 26' AS "Información",
    r.guest_name AS "Huésped",
    r.guest_email AS "Email",
    r.client_type AS "Tipo",
    r.status AS "Estado",
    r.total_amount AS "Total",
    r.created_at AS "Fecha"
FROM reservations r
WHERE r.id = 26; 