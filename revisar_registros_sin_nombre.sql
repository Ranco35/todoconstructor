-- Script para revisar registros POS sin nombre de cliente
-- Ejecutar estas consultas para diagnosticar el problema

-- 1. VER TODAS LAS VENTAS CON PROBLEMAS DE NOMBRE
SELECT 
    id,
    "saleNumber",
    "customerName",
    "customerDocument",
    "clientId",
    "createdAt",
    "total",
    "paymentMethod"
FROM "POSSale" 
WHERE "customerName" IS NULL 
   OR "customerName" = '' 
   OR "customerName" = 'Cliente sin nombre'
ORDER BY "createdAt" DESC;

-- 2. CONTAR CUÁNTAS VENTAS TIENEN PROBLEMAS
SELECT 
    COUNT(*) as total_ventas,
    COUNT(CASE WHEN "customerName" IS NULL THEN 1 END) as sin_nombre_null,
    COUNT(CASE WHEN "customerName" = '' THEN 1 END) as sin_nombre_vacio,
    COUNT(CASE WHEN "customerName" = 'Cliente sin nombre' THEN 1 END) as cliente_sin_nombre,
    COUNT(CASE WHEN "clientId" IS NOT NULL THEN 1 END) as con_cliente_asociado,
    COUNT(CASE WHEN "clientId" IS NULL THEN 1 END) as sin_cliente_asociado
FROM "POSSale";

-- 3. REVISAR VENTAS CON CLIENTE ASOCIADO PERO SIN NOMBRE
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

-- 4. REVISAR VENTAS SIN CLIENTE ASOCIADO
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt",
    "total",
    "paymentMethod"
FROM "POSSale" 
WHERE "clientId" IS NULL
ORDER BY "createdAt" DESC;

-- 5. VER LOS ÚLTIMOS 10 REGISTROS PARA COMPARAR
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

-- 6. VERIFICAR SI HAY CLIENTES CON DATOS VACÍOS
SELECT 
    c.id,
    c."nombrePrincipal",
    c."apellido",
    c."razonSocial",
    c."tipoCliente",
    COUNT(ps.id) as ventas_asociadas
FROM "Client" c
LEFT JOIN "POSSale" ps ON c.id = ps."clientId"
WHERE (c."nombrePrincipal" IS NULL OR c."nombrePrincipal" = '')
   OR (c."apellido" IS NULL OR c."apellido" = '')
   OR (c."razonSocial" IS NULL OR c."razonSocial" = '')
GROUP BY c.id, c."nombrePrincipal", c."apellido", c."razonSocial", c."tipoCliente"
HAVING COUNT(ps.id) > 0
ORDER BY ventas_asociadas DESC;

-- 7. ESTADÍSTICAS POR FECHA (ÚLTIMOS 7 DÍAS)
SELECT 
    DATE("createdAt") as fecha,
    COUNT(*) as total_ventas,
    COUNT(CASE WHEN "customerName" = 'Cliente sin nombre' THEN 1 END) as sin_nombre,
    COUNT(CASE WHEN "customerName" != 'Cliente sin nombre' THEN 1 END) as con_nombre
FROM "POSSale" 
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY fecha DESC; 