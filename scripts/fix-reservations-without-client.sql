-- Script para identificar y corregir reservas sin client_id
-- Ejecutar antes de aplicar la migración que hace client_id NOT NULL

-- 1. Identificar reservas sin client_id
SELECT 
    'reservations' as tabla,
    id,
    guest_name,
    guest_email,
    created_at
FROM reservations 
WHERE client_id IS NULL
ORDER BY created_at DESC;

-- 2. Identificar reservas modulares sin client_id
SELECT 
    'modular_reservations' as tabla,
    mr.id,
    r.guest_name,
    r.guest_email,
    mr.created_at
FROM modular_reservations mr
LEFT JOIN reservations r ON mr.reservation_id = r.id
WHERE mr.client_id IS NULL
ORDER BY mr.created_at DESC;

-- 3. Contar total de reservas sin client_id
SELECT 
    'reservations' as tabla,
    COUNT(*) as total_sin_client_id
FROM reservations 
WHERE client_id IS NULL

UNION ALL

SELECT 
    'modular_reservations' as tabla,
    COUNT(*) as total_sin_client_id
FROM modular_reservations 
WHERE client_id IS NULL;

-- 4. Opcional: Crear clientes temporales para reservas sin client_id
-- DESCOMENTAR SOLO SI ES NECESARIO

/*
-- Crear cliente temporal para reservas sin client_id
INSERT INTO "Client" (
    tipoCliente,
    nombrePrincipal,
    email,
    telefono,
    estado,
    fechaCreacion,
    fechaModificacion,
    idioma,
    totalCompras,
    rankingCliente,
    recibirNewsletter,
    aceptaMarketing
)
SELECT DISTINCT
    'PERSONA' as tipoCliente,
    COALESCE(guest_name, 'Cliente Temporal') as nombrePrincipal,
    COALESCE(guest_email, 'temporal@example.com') as email,
    COALESCE(guest_phone, 'N/A') as telefono,
    'activo' as estado,
    NOW() as fechaCreacion,
    NOW() as fechaModificacion,
    'es' as idioma,
    0 as totalCompras,
    0 as rankingCliente,
    false as recibirNewsletter,
    false as aceptaMarketing
FROM reservations 
WHERE client_id IS NULL
AND NOT EXISTS (
    SELECT 1 FROM "Client" 
    WHERE email = COALESCE(guest_email, 'temporal@example.com')
);

-- Actualizar reservas con los clientes temporales creados
UPDATE reservations 
SET client_id = (
    SELECT id FROM "Client" 
    WHERE email = COALESCE(guest_email, 'temporal@example.com')
    LIMIT 1
)
WHERE client_id IS NULL;

-- Actualizar reservas modulares con los clientes temporales
UPDATE modular_reservations 
SET client_id = (
    SELECT r.client_id 
    FROM reservations r 
    WHERE r.id = modular_reservations.reservation_id
)
WHERE client_id IS NULL;
*/ 