-- Script para revisar y corregir ventas POS sin nombre de cliente
-- Ejecutar este script en la base de datos para diagnosticar y corregir el problema

-- 1. REVISAR VENTAS ACTUALES SIN NOMBRE DE CLIENTE
SELECT 
    id,
    "saleNumber",
    "customerName",
    "customerDocument",
    "clientId",
    "createdAt",
    "total"
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
    COUNT(CASE WHEN "customerName" = 'Cliente sin nombre' THEN 1 END) as cliente_sin_nombre
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
    ps."createdAt"
FROM "POSSale" ps
LEFT JOIN "Client" c ON ps."clientId" = c.id
WHERE (ps."customerName" IS NULL OR ps."customerName" = '' OR ps."customerName" = 'Cliente sin nombre')
  AND ps."clientId" IS NOT NULL
ORDER BY ps."createdAt" DESC;

-- 4. ACTUALIZAR VENTAS CON CLIENTE ASOCIADO (CORREGIR NOMBRES)
UPDATE "POSSale" 
SET "customerName" = CASE 
    WHEN c."tipoCliente" = 'EMPRESA' THEN 
        COALESCE(c."razonSocial", c."nombrePrincipal", 'Empresa sin nombre')
    ELSE 
        COALESCE(
            TRIM(CONCAT(COALESCE(c."nombrePrincipal", ''), ' ', COALESCE(c."apellido", ''))),
            'Cliente sin nombre'
        )
    END
FROM "Client" c
WHERE "POSSale"."clientId" = c.id
  AND ("POSSale"."customerName" IS NULL OR "POSSale"."customerName" = '' OR "POSSale"."customerName" = 'Cliente sin nombre');

-- 5. ACTUALIZAR VENTAS SIN CLIENTE ASOCIADO
UPDATE "POSSale" 
SET "customerName" = 'Cliente sin nombre'
WHERE "clientId" IS NULL 
  AND ("customerName" IS NULL OR "customerName" = '');

-- 6. VERIFICAR RESULTADO FINAL
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt"
FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- 7. ESTADÍSTICAS FINALES
SELECT 
    COUNT(*) as total_ventas,
    COUNT(CASE WHEN "customerName" != 'Cliente sin nombre' THEN 1 END) as con_nombre,
    COUNT(CASE WHEN "customerName" = 'Cliente sin nombre' THEN 1 END) as sin_nombre,
    COUNT(CASE WHEN "clientId" IS NOT NULL THEN 1 END) as con_cliente_asociado
FROM "POSSale"; 