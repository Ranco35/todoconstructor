-- Script para actualizar ventas POS que no tienen nombre de cliente
-- Ejecutar este script en la base de datos para corregir ventas existentes

UPDATE "POSSale" 
SET "customerName" = 'Cliente sin nombre' 
WHERE "customerName" IS NULL OR "customerName" = '';

-- Verificar el resultado
SELECT 
    id,
    "saleNumber",
    "customerName",
    "createdAt"
FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 10; 