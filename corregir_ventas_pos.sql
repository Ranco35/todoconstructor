-- Script para corregir ventas POS sin nombre de cliente
-- Ejecutar este script directamente en la base de datos

-- 1. Verificar ventas con problemas
SELECT 
    COUNT(*) as total_ventas,
    COUNT(CASE WHEN "customerName" IS NULL THEN 1 END) as sin_nombre_null,
    COUNT(CASE WHEN "customerName" = '' THEN 1 END) as sin_nombre_vacio,
    COUNT(CASE WHEN "customerName" = 'Cliente sin nombre' THEN 1 END) as cliente_sin_nombre
FROM "POSSale";

-- 2. Actualizar ventas con cliente asociado pero sin nombre
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

-- 3. Actualizar ventas sin cliente asociado
UPDATE "POSSale" 
SET "customerName" = 'Cliente sin nombre'
WHERE "clientId" IS NULL 
  AND ("customerName" IS NULL OR "customerName" = '');

-- 4. Verificar resultado
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt"
FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 10; 