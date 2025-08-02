-- Script para identificar y corregir clientes empresa con problemas
-- Ejecutar en Supabase SQL Editor

-- 1. Identificar clientes empresa que tienen apellido (no deberían)
SELECT 
    id,
    "nombrePrincipal",
    "razonSocial",
    apellido,
    COUNT(cc.id) as total_contactos,
    COUNT(CASE WHEN cc."esContactoPrincipal" = true THEN 1 END) as contactos_principales
FROM "Client" c
LEFT JOIN "ClientContact" cc ON c.id = cc."clienteId"
WHERE c."tipoCliente" = 'EMPRESA' AND c.apellido IS NOT NULL
GROUP BY c.id, c."nombrePrincipal", c."razonSocial", c.apellido
ORDER BY c.id;

-- 2. Limpiar campo apellido de todos los clientes empresa
UPDATE "Client" 
SET apellido = null 
WHERE "tipoCliente" = 'EMPRESA' AND apellido IS NOT NULL;

-- 3. Verificar clientes empresa sin contactos principales
SELECT 
    c.id,
    c."nombrePrincipal",
    c."razonSocial",
    COUNT(cc.id) as total_contactos,
    COUNT(CASE WHEN cc."esContactoPrincipal" = true THEN 1 END) as contactos_principales
FROM "Client" c
LEFT JOIN "ClientContact" cc ON c.id = cc."clienteId"
WHERE c."tipoCliente" = 'EMPRESA'
GROUP BY c.id, c."nombrePrincipal", c."razonSocial"
HAVING COUNT(CASE WHEN cc."esContactoPrincipal" = true THEN 1 END) = 0
ORDER BY c.id;

-- 4. Verificar que la corrección funcionó
SELECT 
    id,
    "tipoCliente",
    "nombrePrincipal",
    "razonSocial",
    apellido
FROM "Client" 
WHERE "tipoCliente" = 'EMPRESA'
ORDER BY id; 