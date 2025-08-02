-- Script para revisar específicamente la venta REC-000026
-- Ejecutar estas consultas para diagnosticar el problema

-- 1. VER LA VENTA ESPECÍFICA REC-000026
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt",
    "total",
    "paymentMethod",
    "status"
FROM "POSSale" 
WHERE "saleNumber" = 'REC-000026'
   OR id = 33;

-- 2. VER EL CLIENTE ASOCIADO (ID: 37)
SELECT 
    id,
    "nombrePrincipal",
    "apellido",
    "razonSocial",
    "tipoCliente",
    "rut",
    "createdAt"
FROM "Client" 
WHERE id = 37;

-- 3. VER LA VENTA CON DETALLES DEL CLIENTE
SELECT 
    ps.id,
    ps."saleNumber",
    ps."customerName",
    ps."clientId",
    ps."createdAt",
    ps."total",
    ps."paymentMethod",
    ps."status",
    c."nombrePrincipal",
    c."apellido",
    c."razonSocial",
    c."tipoCliente",
    c."rut"
FROM "POSSale" ps
LEFT JOIN "Client" c ON ps."clientId" = c.id
WHERE ps."saleNumber" = 'REC-000026'
   OR ps.id = 33;

-- 4. VER TODAS LAS VENTAS DEL CLIENTE 37
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt",
    "total"
FROM "POSSale" 
WHERE "clientId" = 37
ORDER BY "createdAt" DESC;

-- 5. VER LAS ÚLTIMAS 3 VENTAS CREADAS
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt",
    "total"
FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 3; 