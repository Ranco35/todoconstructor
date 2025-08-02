-- Script muy simple para revisar las últimas ventas
-- Ejecutar estas consultas una por una en la base de datos

-- 1. Ver las últimas 5 ventas
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt",
    "total"
FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 5;

-- 2. Buscar el cliente específico
SELECT 
    id,
    "nombrePrincipal",
    "apellido",
    "razonSocial",
    "tipoCliente",
    "rut",
    "createdAt"
FROM "Client" 
WHERE "nombrePrincipal" LIKE '%119224357%' 
   OR "apellido" LIKE '%119224357%'
   OR "razonSocial" LIKE '%119224357%'
   OR "rut" LIKE '%119224357%'
ORDER BY "createdAt" DESC;

-- 3. Ver la última venta con detalles del cliente
SELECT 
    ps.id,
    ps."saleNumber",
    ps."customerName",
    ps."clientId",
    ps."createdAt",
    ps."total",
    c."nombrePrincipal",
    c."apellido",
    c."razonSocial",
    c."tipoCliente"
FROM "POSSale" ps
LEFT JOIN "Client" c ON ps."clientId" = c.id
ORDER BY ps."createdAt" DESC 
LIMIT 1; 