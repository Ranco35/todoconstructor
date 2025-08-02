-- ================================================
-- ANÁLISIS RESERVA ID 64 - CONSULTAS CORREGIDAS
-- ================================================

-- 🔍 CONSULTA 2 CORREGIDA: Ver datos desde tabla modular_reservations (sin guest_name)
SELECT 
    'TABLA_MODULAR_RESERVATIONS' as fuente,
    mr.id as modular_reserva_id,
    mr.reservation_id as reserva_id_referencia,
    mr.client_id as cliente_id_en_modular,
    mr.room_code as habitacion,
    mr.package_code as paquete,
    mr.status as estado_modular,
    mr.grand_total as total_modular,
    mr.adults,
    mr.children,
    mr.check_in,
    mr.check_out,
    mr.created_at as creado_modular
FROM modular_reservations mr 
WHERE mr.id = 64 OR mr.reservation_id = 64;

-- 🔍 CONSULTA 3: Ver datos del cliente ID 1872
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
WHERE c.id = 1872;

-- 🔍 CONSULTA 4 CORREGIDA: JOIN COMPLETO (sin guest_name en modular)
SELECT 
    'JOIN_COMPLETO' as fuente,
    r.id as reserva_principal_id,
    mr.id as modular_id,
    r.guest_name as nombre_huesped_tabla_reservations,
    c."nombrePrincipal" as nombre_cliente_tabla_client,
    r.client_id as client_id_en_reservations,
    mr.client_id as client_id_en_modular,
    c.id as client_id_en_tabla_client,
    r.status as estado_reservations,
    mr.status as estado_modular,
    r.total_amount as total_reservations,
    mr.grand_total as total_modular,
    r.check_in as check_in_reservations,
    mr.check_in as check_in_modular,
    -- Verificar si los IDs coinciden
    CASE 
        WHEN r.client_id = mr.client_id THEN '✅ COINCIDEN'
        WHEN r.client_id IS NULL OR mr.client_id IS NULL THEN '⚠️ DATOS INCOMPLETOS'
        ELSE '❌ NO COINCIDEN'
    END as ids_cliente_coinciden,
    CASE 
        WHEN r.client_id = c.id THEN '✅ COINCIDE'
        ELSE '❌ NO COINCIDE'
    END as client_id_reservations_vs_client,
    CASE 
        WHEN mr.client_id = c.id THEN '✅ COINCIDE'
        ELSE '❌ NO COINCIDE'
    END as client_id_modular_vs_client,
    -- Verificar consistencia de fechas
    CASE 
        WHEN r.check_in = mr.check_in AND r.check_out = mr.check_out THEN '✅ FECHAS CONSISTENTES'
        ELSE '❌ FECHAS INCONSISTENTES'
    END as consistencia_fechas
FROM reservations r
FULL OUTER JOIN modular_reservations mr ON mr.reservation_id = r.id
FULL OUTER JOIN "Client" c ON c.id = COALESCE(r.client_id, mr.client_id)
WHERE r.id = 64 OR mr.id = 64 OR mr.reservation_id = 64;

-- 🔍 CONSULTA 5: Verificar estructura de modular_reservations
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'modular_reservations' 
ORDER BY ordinal_position;

-- 🔍 CONSULTA 6: Buscar TODAS las reservas relacionadas con Karen Alejandra o cliente 1872
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
   OR r.client_id = 1872
   OR r.guest_name ILIKE '%Karen%'
   OR r.guest_name ILIKE '%Alejandra%'

UNION ALL

SELECT 
    'BUSQUEDA_MULTIPLE' as fuente,
    'modular_reservations' as tabla,
    mr.id as id_encontrado,
    mr.client_id::text as nombre,  -- Convierte a texto para la unión
    mr.client_id,
    mr.check_in,
    mr.status
FROM modular_reservations mr 
WHERE mr.id = 64 
   OR mr.reservation_id = 64
   OR mr.client_id = 1872;

-- 🔍 CONSULTA 7: Ver cómo ven los datos las diferentes partes del sistema
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
WHERE mr.id = 64 OR mr.reservation_id = 64;

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

-- 🔍 CONSULTA 8: VERIFICAR PROBLEMA DE ESTADO (fechas futuras con estado "en_curso")
SELECT 
    'PROBLEMA_ESTADO' as fuente,
    r.id,
    r.guest_name,
    r.check_in,
    r.check_out,
    r.status,
    CURRENT_DATE as fecha_actual,
    CASE 
        WHEN r.check_in > CURRENT_DATE AND r.status = 'en_curso' THEN '❌ PROBLEMA: Fechas futuras con estado en_curso'
        WHEN r.check_in > CURRENT_DATE AND r.status = 'confirmada' THEN '✅ CORRECTO: Fechas futuras con estado confirmada'
        WHEN r.check_in <= CURRENT_DATE AND r.status = 'en_curso' THEN '✅ CORRECTO: Check-in realizado'
        ELSE '⚠️ REVISAR: Estado no típico'
    END as diagnostico_estado
FROM reservations r 
WHERE r.id = 64; 