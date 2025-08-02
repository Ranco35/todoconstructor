-- Script simple para revisar registros sin nombre
-- Ejecutar estas consultas una por una

-- 1. Ver todas las ventas con problemas de nombre
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt",
    "total"
FROM "POSSale" 
WHERE "customerName" IS NULL 
   OR "customerName" = '' 
   OR "customerName" = 'Cliente sin nombre'
ORDER BY "createdAt" DESC;

-- 2. Contar cuántas ventas tienen problemas
SELECT 
    COUNT(*) as total_ventas,
    COUNT(CASE WHEN "customerName" IS NULL THEN 1 END) as sin_nombre_null,
    COUNT(CASE WHEN "customerName" = '' THEN 1 END) as sin_nombre_vacio,
    COUNT(CASE WHEN "customerName" = 'Cliente sin nombre' THEN 1 END) as cliente_sin_nombre
FROM "POSSale";

-- 3. Ver las últimas 10 ventas para comparar
SELECT 
    id,
    "saleNumber",
    "customerName",
    "clientId",
    "createdAt"
FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 10; 