-- Script para verificar datos del cliente 47 y sus contactos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar datos del cliente 47
SELECT 
    id,
    "tipoCliente",
    "nombrePrincipal",
    apellido,
    "razonSocial",
    email,
    telefono,
    "telefonoMovil",
    estado,
    "fechaCreacion"
FROM "Client" 
WHERE id = 47;

-- 2. Verificar contactos del cliente 47
SELECT 
    id,
    "clienteId",
    nombre,
    apellido,
    email,
    telefono,
    "telefonoMovil",
    cargo,
    departamento,
    "esContactoPrincipal",
    relacion,
    notas,
    "fechaCreacion"
FROM "ClientContact" 
WHERE "clienteId" = 47
ORDER BY "esContactoPrincipal" DESC, id ASC;

-- 3. Verificar si hay contactos marcados como principales para cliente 47
SELECT 
    COUNT(*) as total_contactos,
    COUNT(CASE WHEN "esContactoPrincipal" = true THEN 1 END) as contactos_principales,
    COUNT(CASE WHEN "esContactoPrincipal" = false THEN 1 END) as contactos_secundarios
FROM "ClientContact" 
WHERE "clienteId" = 47;

-- 4. Verificar todos los clientes empresa con contactos principales
SELECT 
    c.id,
    c."tipoCliente",
    c."nombrePrincipal",
    c."razonSocial",
    cc.nombre as contacto_nombre,
    cc.apellido as contacto_apellido,
    cc.email as contacto_email,
    cc.telefono as contacto_telefono,
    cc.cargo as contacto_cargo,
    cc.departamento as contacto_departamento,
    cc."esContactoPrincipal"
FROM "Client" c
LEFT JOIN "ClientContact" cc ON c.id = cc."clienteId"
WHERE c."tipoCliente" = 'EMPRESA'
ORDER BY c.id, cc."esContactoPrincipal" DESC;

-- 5. Verificar la consulta que usa la exportación
SELECT 
    c.id,
    c."tipoCliente",
    c."nombrePrincipal",
    c."razonSocial",
    c.apellido,
    cc.nombre as contacto_principal_nombre,
    cc.apellido as contacto_principal_apellido,
    cc.email as contacto_principal_email,
    cc.telefono as contacto_principal_telefono,
    cc."telefonoMovil" as contacto_principal_movil,
    cc.cargo as contacto_principal_cargo,
    cc.departamento as contacto_principal_departamento,
    cc."esContactoPrincipal"
FROM "Client" c
LEFT JOIN "ClientContact" cc ON c.id = cc."clienteId" AND cc."esContactoPrincipal" = true
WHERE c.id = 47; 