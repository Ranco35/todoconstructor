-- ================================================
-- CONSULTAS PARA VERIFICAR DATOS DE RESERVAS
-- ================================================
-- Este archivo contiene consultas para revisar qué datos se están guardando
-- en la base de datos, especialmente para distinguir entre usuarios y huéspedes

-- ================================================
-- 1. CONSULTA GENERAL DE RESERVAS CON TODOS LOS DATOS
-- ================================================
SELECT 
    r.id,
    r.guest_name AS "Nombre del Huésped",
    r.guest_email AS "Email del Huésped",
    r.guest_phone AS "Teléfono del Huésped",
    r.client_id AS "ID del Cliente (si existe)",
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
ORDER BY r.created_at DESC
LIMIT 20;

-- ================================================
-- 2. VERIFICAR SI LAS RESERVAS TIENEN CLIENTE ASOCIADO
-- ================================================
SELECT 
    COUNT(*) AS "Total de Reservas",
    COUNT(client_id) AS "Reservas con Cliente Asociado",
    COUNT(*) - COUNT(client_id) AS "Reservas SIN Cliente Asociado",
    ROUND((COUNT(client_id) * 100.0 / COUNT(*)), 2) AS "Porcentaje con Cliente (%)"
FROM reservations;

-- ================================================
-- 3. COMPARAR DATOS DEL HUÉSPED VS DATOS DEL CLIENTE
-- ================================================
SELECT 
    r.id AS "ID Reserva",
    r.guest_name AS "Nombre del Huésped",
    r.guest_email AS "Email del Huésped",
    r.guest_phone AS "Teléfono del Huésped",
    c."nombrePrincipal" AS "Nombre del Cliente",
    c."apellido" AS "Apellido del Cliente",
    c."email" AS "Email del Cliente",
    c."telefono" AS "Teléfono del Cliente",
    c."telefonoMovil" AS "Teléfono Móvil del Cliente",
    CASE 
        WHEN r.guest_name = c."nombrePrincipal" THEN 'IGUAL'
        WHEN r.guest_name ILIKE '%' || c."nombrePrincipal" || '%' THEN 'SIMILAR'
        ELSE 'DIFERENTE'
    END AS "Comparación Nombre",
    CASE 
        WHEN r.guest_email = c."email" THEN 'IGUAL'
        WHEN r.guest_email ILIKE '%' || c."email" || '%' THEN 'SIMILAR'
        ELSE 'DIFERENTE'
    END AS "Comparación Email",
    r.created_at AS "Fecha Reserva"
FROM reservations r
LEFT JOIN "Client" c ON r.client_id = c."id"
WHERE r.client_id IS NOT NULL
ORDER BY r.created_at DESC
LIMIT 20;

-- ================================================
-- 4. VERIFICAR RESERVAS MODULARES
-- ================================================
SELECT 
    mr.id AS 'ID Reserva Modular',
    mr.reservation_id AS 'ID Reserva Principal',
    mr.client_id AS 'ID del Cliente',
    mr.adults AS 'Adultos',
    mr.children AS 'Niños',
    mr.children_ages AS 'Edades de Niños',
    mr.room_code AS 'Código Habitación',
    mr.package_code AS 'Código Paquete',
    mr.grand_total AS 'Total General',
    mr.nights AS 'Noches',
    mr.status AS 'Estado',
    mr.created_at AS 'Fecha Creación',
    -- Datos del cliente si existe
    c."nombrePrincipal" AS 'Nombre Cliente',
    c."tipoCliente" AS 'Tipo Cliente',
    -- Datos de la reserva principal
    r.guest_name AS 'Nombre Huésped',
    r.guest_email AS 'Email Huésped'
FROM modular_reservations mr
LEFT JOIN "Client" c ON mr.client_id = c."id"
LEFT JOIN reservations r ON mr.reservation_id = r.id
ORDER BY mr.created_at DESC
LIMIT 20;

-- ================================================
-- 5. ANÁLISIS DE TIPOS DE CLIENTE
-- ================================================
SELECT 
    r.client_type AS 'Tipo de Cliente',
    COUNT(*) AS 'Cantidad de Reservas',
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reservations)), 2) AS 'Porcentaje (%)',
    AVG(r.total_amount) AS 'Promedio Monto Total',
    SUM(r.total_amount) AS 'Total Facturado'
FROM reservations r
GROUP BY r.client_type
ORDER BY COUNT(*) DESC;

-- ================================================
-- 6. VERIFICAR RESERVAS CORPORATIVAS
-- ================================================
SELECT 
    r.id AS 'ID Reserva',
    r.guest_name AS 'Nombre del Huésped',
    r.client_type AS 'Tipo Cliente',
    r.contact_id AS 'ID Contacto',
    r.company_id AS 'ID Empresa',
    cc.name AS 'Nombre del Contacto',
    cc.email AS 'Email del Contacto',
    cc.phone AS 'Teléfono del Contacto',
    cc.position AS 'Cargo del Contacto',
    comp.name AS 'Nombre de la Empresa',
    comp.rut AS 'RUT de la Empresa',
    r.billing_name AS 'Nombre de Facturación',
    r.authorized_by AS 'Autorizado por',
    r.created_at AS 'Fecha de Creación'
FROM reservations r
LEFT JOIN company_contacts cc ON r.contact_id = cc.id
LEFT JOIN companies comp ON r.company_id = comp.id
WHERE r.client_type = 'corporate'
ORDER BY r.created_at DESC
LIMIT 20;

-- ================================================
-- 7. VERIFICAR HISTORIAL DE PAGOS
-- ================================================
SELECT 
    rp.id AS 'ID Pago',
    rp.reservation_id AS 'ID Reserva',
    r.guest_name AS 'Nombre del Huésped',
    rp.amount AS 'Monto del Pago',
    rp.payment_type AS 'Tipo de Pago',
    rp.payment_method AS 'Método de Pago',
    rp.previous_paid_amount AS 'Monto Pagado Anterior',
    rp.new_total_paid AS 'Nuevo Total Pagado',
    rp.remaining_balance AS 'Saldo Pendiente',
    rp.total_reservation_amount AS 'Total de la Reserva',
    rp.reference_number AS 'Número de Referencia',
    rp.processed_by AS 'Procesado por',
    rp.created_at AS 'Fecha del Pago'
FROM reservation_payments rp
LEFT JOIN reservations r ON rp.reservation_id = r.id
ORDER BY rp.created_at DESC
LIMIT 20;

-- ================================================
-- 8. RESUMEN ESTADÍSTICO GENERAL
-- ================================================
SELECT 
    'RESUMEN GENERAL' AS 'Métrica',
    COUNT(*) AS 'Valor'
FROM reservations
UNION ALL
SELECT 
    'Reservas con Cliente Asociado',
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
    'Reservas Modulares',
    COUNT(*)
FROM modular_reservations
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

-- ================================================
-- 9. VERIFICAR CLIENTES SIN RESERVAS
-- ================================================
SELECT 
    c."id" AS 'ID Cliente',
    c."nombrePrincipal" AS 'Nombre',
    c."apellido" AS 'Apellido',
    c."email" AS 'Email',
    c."telefono" AS 'Teléfono',
    c."tipoCliente" AS 'Tipo',
    c."fechaCreacion" AS 'Fecha de Creación',
    'SIN RESERVAS' AS 'Estado'
FROM "Client" c
WHERE NOT EXISTS (
    SELECT 1 FROM reservations r WHERE r.client_id = c."id"
)
ORDER BY c."fechaCreacion" DESC
LIMIT 20;

-- ================================================
-- 10. VERIFICAR RESERVAS SIN CLIENTE
-- ================================================
SELECT 
    r.id AS 'ID Reserva',
    r.guest_name AS 'Nombre del Huésped',
    r.guest_email AS 'Email del Huésped',
    r.guest_phone AS 'Teléfono del Huésped',
    r.client_type AS 'Tipo de Cliente',
    r.billing_name AS 'Nombre de Facturación',
    r.billing_rut AS 'RUT de Facturación',
    r.total_amount AS 'Monto Total',
    r.status AS 'Estado',
    r.created_at AS 'Fecha de Creación',
    'SIN CLIENTE ASOCIADO' AS 'Observación'
FROM reservations r
WHERE r.client_id IS NULL
ORDER BY r.created_at DESC
LIMIT 20; 