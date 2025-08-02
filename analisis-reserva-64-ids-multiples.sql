-- ================================================
-- ANÁLISIS COMPLETO RESERVA ID 64 - PROBLEMA IDS MÚLTIPLES
-- ================================================

-- 🔍 CONSULTA 1: Ver datos desde tabla reservations (principal)
SELECT 
    'TABLA_RESERVATIONS' as fuente,
    r.id as reserva_id,
    r.guest_name as nombre_huesped,
    r.guest_email as email_huesped,
    r.client_id as cliente_id_en_reservations,
    r.check_in,
    r.check_out,
    r.status as estado_reservations,
    r.total_amount as total_reservations,
    r.created_at as creado_reservations
FROM reservations r 
WHERE r.id = 64;

-- 🔍 CONSULTA 2: Ver datos desde tabla modular_reservations
SELECT 
    'TABLA_MODULAR_RESERVATIONS' as fuente,
    mr.id as modular_reserva_id,
    mr.reservation_id as reserva_id_referencia,
    mr.client_id as cliente_id_en_modular,
    mr.guest_name as nombre_huesped_modular,
    mr.room_code as habitacion,
    mr.package_code as paquete,
    mr.status as estado_modular,
    mr.grand_total as total_modular,
    mr.adults,
    mr.children,
    mr.created_at as creado_modular
FROM modular_reservations mr 
WHERE mr.id = 64 OR mr.reservation_id = 64;

-- 🔍 CONSULTA 3: Ver datos del cliente en tabla Client
SELECT 
    'TABLA_CLIENT' as fuente,
    c.id as cliente_id,
    c."nombrePrincipal" as nombre_cliente,
    c."apellido" as apellido_cliente,
    c."email" as email_cliente,
    c."telefono" as telefono_cliente,
    c."tipoCliente" as tipo_cliente,
    c."fechaCreacion" as creado_cliente
FROM "Client" c 
WHERE c.id IN (
    SELECT DISTINCT client_id FROM reservations WHERE id = 64
    UNION
    SELECT DISTINCT client_id FROM modular_reservations WHERE id = 64 OR reservation_id = 64
);

-- 🔍 CONSULTA 4: JOIN COMPLETO - Ver todas las relaciones
SELECT 
    'JOIN_COMPLETO' as fuente,
    r.id as reserva_principal_id,
    mr.id as modular_id,
    r.guest_name as nombre_huesped_tabla_reservations,
    mr.guest_name as nombre_huesped_tabla_modular,
    c."nombrePrincipal" as nombre_cliente_tabla_client,
    r.client_id as client_id_en_reservations,
    mr.client_id as client_id_en_modular,
    c.id as client_id_en_tabla_client,
    r.status as estado_reservations,
    mr.status as estado_modular,
    r.total_amount as total_reservations,
    mr.grand_total as total_modular,
    -- Verificar si los IDs coinciden
    CASE 
        WHEN r.client_id = mr.client_id THEN '✅ COINCIDEN'
        ELSE '❌ NO COINCIDEN'
    END as ids_cliente_coinciden,
    CASE 
        WHEN r.client_id = c.id THEN '✅ COINCIDE'
        ELSE '❌ NO COINCIDE'
    END as client_id_reservations_vs_client,
    CASE 
        WHEN mr.client_id = c.id THEN '✅ COINCIDE'
        ELSE '❌ NO COINCIDE'
    END as client_id_modular_vs_client
FROM reservations r
FULL OUTER JOIN modular_reservations mr ON mr.reservation_id = r.id
FULL OUTER JOIN "Client" c ON c.id = COALESCE(r.client_id, mr.client_id)
WHERE r.id = 64 OR mr.id = 64 OR mr.reservation_id = 64;

-- 🔍 CONSULTA 5: Identificar TODAS las reservas relacionadas (por si hay duplicados)
SELECT 
    'BUSQUEDA_MULTIPLE' as fuente,
    'reservations' as tabla,
    r.id as id_encontrado,
    r.guest_name as nombre,
    r.client_id,
    r.check_in,
    r.status
FROM reservations r 
WHERE r.id = 64 
   OR r.guest_name ILIKE '%Victor Vilo%' 
   OR r.guest_name ILIKE '%Karen Alejandra%'

UNION ALL

SELECT 
    'BUSQUEDA_MULTIPLE' as fuente,
    'modular_reservations' as tabla,
    mr.id as id_encontrado,
    mr.guest_name as nombre,
    mr.client_id,
    mr.check_in,
    mr.status
FROM modular_reservations mr 
WHERE mr.id = 64 
   OR mr.reservation_id = 64
   OR mr.guest_name ILIKE '%Victor Vilo%' 
   OR mr.guest_name ILIKE '%Karen Alejandra%';

-- 🔍 CONSULTA 6: Ver clientes que contengan ambos nombres
SELECT 
    'BUSQUEDA_CLIENTES' as fuente,
    c.id,
    c."nombrePrincipal",
    c."apellido",
    c."email",
    c."tipoCliente"
FROM "Client" c 
WHERE c."nombrePrincipal" ILIKE '%Victor%' 
   OR c."nombrePrincipal" ILIKE '%Karen%'
   OR c."apellido" ILIKE '%Vilo%'
   OR c."apellido" ILIKE '%Alejandra%';

-- 🔍 CONSULTA 7: Ver qué consulta usa cada parte del sistema
-- Simular consulta de list.ts (desde modular_reservations)
SELECT 
    'COMO_LO_VE_LIST_TS' as fuente,
    mr.id,
    mr.client_id,
    c."nombrePrincipal" as nombre_mostrado,
    c."rut",
    mr.check_in,
    mr.status
FROM modular_reservations mr
LEFT JOIN "Client" c ON c.id = mr.client_id
WHERE mr.id = 64;

-- Simular consulta de get.ts (desde reservations)
SELECT 
    'COMO_LO_VE_GET_TS' as fuente,
    r.id,
    r.guest_name as nombre_huesped,
    r.client_id,
    c."nombrePrincipal" as nombre_cliente,
    r.check_in,
    r.status
FROM reservations r
LEFT JOIN "Client" c ON c.id = r.client_id
WHERE r.id = 64; 