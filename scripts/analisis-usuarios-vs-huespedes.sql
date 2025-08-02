-- ================================================
-- ANÁLISIS: USUARIOS DEL SISTEMA VS HUÉSPEDES
-- ================================================
-- Este archivo contiene consultas específicas para analizar
-- la diferencia entre usuarios del sistema y huéspedes de reservas

-- ================================================
-- 1. VERIFICAR USUARIOS DEL SISTEMA (auth.users)
-- ================================================
SELECT 
    u.id AS 'ID Usuario',
    u.email AS 'Email Usuario',
    u.raw_user_meta_data AS 'Metadatos Usuario',
    u.created_at AS 'Fecha Creación Usuario',
    u.last_sign_in_at AS 'Último Login',
    u.confirmed_at AS 'Fecha Confirmación',
    u.role AS 'Rol del Usuario'
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 20;

-- ================================================
-- 2. COMPARAR EMAILS DE USUARIOS VS HUÉSPEDES
-- ================================================
SELECT 
    'USUARIOS DEL SISTEMA' AS 'Tipo',
    COUNT(*) AS 'Cantidad',
    COUNT(DISTINCT email) AS 'Emails Únicos'
FROM auth.users
UNION ALL
SELECT 
    'HUÉSPEDES EN RESERVAS',
    COUNT(*) AS 'Cantidad',
    COUNT(DISTINCT guest_email) AS 'Emails Únicos'
FROM reservations;

-- ================================================
-- 3. ENCONTRAR COINCIDENCIAS ENTRE USUARIOS Y HUÉSPEDES
-- ================================================
SELECT 
    u.id AS 'ID Usuario Sistema',
    u.email AS 'Email Usuario Sistema',
    r.id AS 'ID Reserva',
    r.guest_name AS 'Nombre Huésped',
    r.guest_email AS 'Email Huésped',
    r.client_id AS 'ID Cliente',
    r.created_at AS 'Fecha Reserva',
    'COINCIDENCIA EXACTA' AS 'Tipo Coincidencia'
FROM auth.users u
INNER JOIN reservations r ON u.email = r.guest_email
ORDER BY r.created_at DESC
LIMIT 20;

-- ================================================
-- 4. VERIFICAR SI LOS HUÉSPEDES SON CLIENTES REGISTRADOS
-- ================================================
SELECT 
    r.id AS 'ID Reserva',
    r.guest_name AS 'Nombre Huésped',
    r.guest_email AS 'Email Huésped',
    r.client_id AS 'ID Cliente en Reserva',
    c."id" AS 'ID Cliente en Tabla Client',
    c."nombrePrincipal" AS 'Nombre Cliente',
    c."email" AS 'Email Cliente',
    CASE 
        WHEN r.client_id IS NOT NULL THEN 'SÍ - Asociado en Reserva'
        WHEN c."id" IS NOT NULL THEN 'SÍ - Existe en Tabla Client'
        ELSE 'NO - No Registrado'
    END AS 'Estado Cliente',
    r.created_at AS 'Fecha Reserva'
FROM reservations r
LEFT JOIN "Client" c ON r.guest_email = c."email"
ORDER BY r.created_at DESC
LIMIT 20;

-- ================================================
-- 5. ANÁLISIS DE CLIENTES QUE TAMBIÉN SON USUARIOS
-- ================================================
SELECT 
    c."id" AS 'ID Cliente',
    c."nombrePrincipal" AS 'Nombre Cliente',
    c."email" AS 'Email Cliente',
    c."tipoCliente" AS 'Tipo Cliente',
    u.id AS 'ID Usuario Sistema',
    u.email AS 'Email Usuario Sistema',
    u.role AS 'Rol Usuario',
    u.created_at AS 'Fecha Creación Usuario',
    c."fechaCreacion" AS 'Fecha Creación Cliente',
    CASE 
        WHEN u.id IS NOT NULL THEN 'SÍ - Es Usuario del Sistema'
        ELSE 'NO - Solo Cliente'
    END AS 'Estado Usuario'
FROM "Client" c
LEFT JOIN auth.users u ON c."email" = u.email
WHERE c."email" IS NOT NULL
ORDER BY c."fechaCreacion" DESC
LIMIT 20;

-- ================================================
-- 6. VERIFICAR RESERVAS DE USUARIOS DEL SISTEMA
-- ================================================
SELECT 
    u.id AS 'ID Usuario Sistema',
    u.email AS 'Email Usuario Sistema',
    u.role AS 'Rol Usuario',
    COUNT(r.id) AS 'Cantidad de Reservas',
    SUM(r.total_amount) AS 'Total Facturado',
    MAX(r.created_at) AS 'Última Reserva',
    MIN(r.created_at) AS 'Primera Reserva'
FROM auth.users u
LEFT JOIN reservations r ON u.email = r.guest_email
GROUP BY u.id, u.email, u.role
HAVING COUNT(r.id) > 0
ORDER BY COUNT(r.id) DESC
LIMIT 20;

-- ================================================
-- 7. ANÁLISIS DE CLIENTES FRECUENTES
-- ================================================
SELECT 
    c."id" AS 'ID Cliente',
    c."nombrePrincipal" AS 'Nombre Cliente',
    c."email" AS 'Email Cliente',
    c."esClienteFrecuente" AS 'Es Cliente Frecuente',
    c."totalCompras" AS 'Total Compras Cliente',
    c."rankingCliente" AS 'Ranking Cliente',
    COUNT(r.id) AS 'Cantidad de Reservas',
    SUM(r.total_amount) AS 'Total Facturado en Reservas',
    MAX(r.created_at) AS 'Última Reserva',
    u.id AS 'ID Usuario Sistema',
    CASE 
        WHEN u.id IS NOT NULL THEN 'SÍ - Es Usuario'
        ELSE 'NO - Solo Cliente'
    END AS 'Estado Usuario'
FROM "Client" c
LEFT JOIN reservations r ON c."id" = r.client_id
LEFT JOIN auth.users u ON c."email" = u.email
WHERE c."esClienteFrecuente" = true
GROUP BY c."id", c."nombrePrincipal", c."email", c."esClienteFrecuente", 
         c."totalCompras", c."rankingCliente", u.id
ORDER BY COUNT(r.id) DESC
LIMIT 20;

-- ================================================
-- 8. VERIFICAR RESERVAS SIN USUARIO NI CLIENTE
-- ================================================
SELECT 
    r.id AS 'ID Reserva',
    r.guest_name AS 'Nombre Huésped',
    r.guest_email AS 'Email Huésped',
    r.guest_phone AS 'Teléfono Huésped',
    r.client_id AS 'ID Cliente',
    r.client_type AS 'Tipo Cliente',
    r.total_amount AS 'Monto Total',
    r.status AS 'Estado',
    r.created_at AS 'Fecha Creación',
    CASE 
        WHEN u.id IS NOT NULL THEN 'SÍ - Es Usuario del Sistema'
        WHEN c."id" IS NOT NULL THEN 'SÍ - Es Cliente Registrado'
        ELSE 'NO - Solo Huésped'
    END AS 'Estado Registro'
FROM reservations r
LEFT JOIN auth.users u ON r.guest_email = u.email
LEFT JOIN "Client" c ON r.guest_email = c."email"
WHERE u.id IS NULL AND c."id" IS NULL
ORDER BY r.created_at DESC
LIMIT 20;

-- ================================================
-- 9. RESUMEN DE TIPOS DE USUARIOS
-- ================================================
SELECT 
    'TOTAL USUARIOS DEL SISTEMA' AS 'Categoría',
    COUNT(*) AS 'Cantidad'
FROM auth.users
UNION ALL
SELECT 
    'USUARIOS QUE HAN HECHO RESERVAS',
    COUNT(DISTINCT u.id)
FROM auth.users u
INNER JOIN reservations r ON u.email = r.guest_email
UNION ALL
SELECT 
    'TOTAL CLIENTES REGISTRADOS',
    COUNT(*)
FROM "Client"
UNION ALL
SELECT 
    'CLIENTES QUE SON USUARIOS',
    COUNT(DISTINCT c."id")
FROM "Client" c
INNER JOIN auth.users u ON c."email" = u.email
UNION ALL
SELECT 
    'TOTAL RESERVAS',
    COUNT(*)
FROM reservations
UNION ALL
SELECT 
    'RESERVAS DE USUARIOS DEL SISTEMA',
    COUNT(*)
FROM reservations r
INNER JOIN auth.users u ON r.guest_email = u.email
UNION ALL
SELECT 
    'RESERVAS DE CLIENTES REGISTRADOS',
    COUNT(*)
FROM reservations r
INNER JOIN "Client" c ON r.guest_email = c."email"
UNION ALL
SELECT 
    'RESERVAS SIN USUARIO NI CLIENTE',
    COUNT(*)
FROM reservations r
LEFT JOIN auth.users u ON r.guest_email = u.email
LEFT JOIN "Client" c ON r.guest_email = c."email"
WHERE u.id IS NULL AND c."id" IS NULL;

-- ================================================
-- 10. ANÁLISIS TEMPORAL DE REGISTROS
-- ================================================
SELECT 
    DATE_TRUNC('month', r.created_at) AS 'Mes',
    COUNT(*) AS 'Total Reservas',
    COUNT(DISTINCT r.guest_email) AS 'Huéspedes Únicos',
    COUNT(DISTINCT u.id) AS 'Usuarios del Sistema',
    COUNT(DISTINCT c."id") AS 'Clientes Registrados',
    ROUND((COUNT(DISTINCT u.id) * 100.0 / COUNT(*)), 2) AS '% Usuarios Sistema',
    ROUND((COUNT(DISTINCT c."id") * 100.0 / COUNT(*)), 2) AS '% Clientes Registrados'
FROM reservations r
LEFT JOIN auth.users u ON r.guest_email = u.email
LEFT JOIN "Client" c ON r.guest_email = c."email"
GROUP BY DATE_TRUNC('month', r.created_at)
ORDER BY DATE_TRUNC('month', r.created_at) DESC
LIMIT 12; 