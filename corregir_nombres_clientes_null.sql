-- Script para corregir ventas con customerName = NULL
-- Ejecutar estas consultas para diagnosticar y corregir el problema

-- 1. VER VENTAS CON CUSTOMERNAME = NULL
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt",
    "total"
FROM "POSSale" 
WHERE "customerName" IS NULL
ORDER BY "createdAt" DESC;

-- 2. VER VENTAS CON CUSTOMERNAME = NULL PERO CON CLIENTE ASOCIADO
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
WHERE ps."customerName" IS NULL AND ps."clientId" IS NOT NULL
ORDER BY ps."createdAt" DESC;

-- 3. CORREGIR VENTAS CON CLIENTE ASOCIADO PERO CUSTOMERNAME = NULL
UPDATE "POSSale" 
SET "customerName" = COALESCE(
    (SELECT 
        CASE 
            WHEN c."tipoCliente" = 'Empresa' THEN c."razonSocial"
            ELSE CONCAT(c."nombrePrincipal", ' ', COALESCE(c."apellido", ''))
        END
    FROM "Client" c 
    WHERE c.id = "POSSale"."clientId"
    LIMIT 1),
    'Cliente sin nombre'
)
WHERE "customerName" IS NULL 
  AND "clientId" IS NOT NULL;

-- 4. CORREGIR VENTAS SIN CLIENTE ASOCIADO
UPDATE "POSSale" 
SET "customerName" = 'Cliente sin nombre'
WHERE "customerName" IS NULL 
  AND "clientId" IS NULL;

-- 5. VERIFICAR RESULTADO DESPUÉS DE LA CORRECCIÓN
SELECT 
    COUNT(*) as total_ventas,
    COUNT(CASE WHEN "customerName" IS NULL THEN 1 END) as sin_nombre_null,
    COUNT(CASE WHEN "customerName" = '' THEN 1 END) as sin_nombre_vacio,
    COUNT(CASE WHEN "customerName" = 'Cliente sin nombre' THEN 1 END) as cliente_sin_nombre,
    COUNT(CASE WHEN "customerName" IS NOT NULL AND "customerName" != '' AND "customerName" != 'Cliente sin nombre' THEN 1 END) as con_nombre_valido
FROM "POSSale";

-- 6. VER LAS ÚLTIMAS 5 VENTAS DESPUÉS DE LA CORRECCIÓN
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