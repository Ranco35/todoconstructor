-- Script para revisar los últimos registros y el cliente recién creado
-- Ejecutar estas consultas para diagnosticar el problema

-- 1. VER LOS ÚLTIMOS 10 REGISTROS DE VENTAS
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt",
    "total"
FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- 2. BUSCAR EL CLIENTE RECIÉN CREADO
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

-- 3. VER TODOS LOS CLIENTES CREADOS HOY
SELECT 
    id,
    "nombrePrincipal",
    "apellido",
    "razonSocial",
    "tipoCliente",
    "rut",
    "createdAt"
FROM "Client" 
WHERE DATE("createdAt") = CURRENT_DATE
ORDER BY "createdAt" DESC;

-- 4. VER VENTAS CON CLIENTE ASOCIADO PERO SIN NOMBRE
SELECT 
    ps.id,
    ps."saleNumber",
    ps."customerName",
    ps."clientId",
    c."nombrePrincipal",
    c."apellido",
    c."razonSocial",
    c."tipoCliente",
    ps."createdAt",
    ps."total"
FROM "POSSale" ps
LEFT JOIN "Client" c ON ps."clientId" = c.id
WHERE (ps."customerName" IS NULL OR ps."customerName" = '' OR ps."customerName" = 'Cliente sin nombre')
  AND ps."clientId" IS NOT NULL
ORDER BY ps."createdAt" DESC;

-- 5. VER VENTAS SIN CLIENTE ASOCIADO
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt",
    "total"
FROM "POSSale" 
WHERE "clientId" IS NULL
ORDER BY "createdAt" DESC;

-- 6. CONTAR VENTAS POR ESTADO DE NOMBRE
SELECT 
    COUNT(*) as total_ventas,
    COUNT(CASE WHEN "customerName" IS NULL THEN 1 END) as sin_nombre_null,
    COUNT(CASE WHEN "customerName" = '' THEN 1 END) as sin_nombre_vacio,
    COUNT(CASE WHEN "customerName" = 'Cliente sin nombre' THEN 1 END) as cliente_sin_nombre,
    COUNT(CASE WHEN "customerName" IS NOT NULL AND "customerName" != '' AND "customerName" != 'Cliente sin nombre' THEN 1 END) as con_nombre_valido
FROM "POSSale";

-- 7. VER LA ÚLTIMA VENTA CREADA CON DETALLES
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