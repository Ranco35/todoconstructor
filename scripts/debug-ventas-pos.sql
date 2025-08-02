-- Script para diagnosticar problema de ventas POS
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar cuántas ventas hay en total
SELECT COUNT(*) as total_ventas FROM "POSSale";

-- 2. Verificar ventas de los últimos 7 días
SELECT COUNT(*) as ventas_ultimos_7_dias 
FROM "POSSale" 
WHERE "createdAt" >= NOW() - INTERVAL '7 days';

-- 3. Verificar ventas de hoy
SELECT COUNT(*) as ventas_hoy 
FROM "POSSale" 
WHERE DATE("createdAt") = CURRENT_DATE;

-- 4. Verificar ventas de ayer
SELECT COUNT(*) as ventas_ayer 
FROM "POSSale" 
WHERE DATE("createdAt") = CURRENT_DATE - INTERVAL '1 day';

-- 5. Ver las 10 ventas más recientes con detalles
SELECT 
    id,
    "saleNumber",
    "createdAt",
    total,
    "paymentMethod",
    "customerName",
    "sessionId"
FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- 6. Verificar rango de fechas de todas las ventas
SELECT 
    MIN("createdAt") as primera_venta,
    MAX("createdAt") as ultima_venta,
    COUNT(*) as total_ventas
FROM "POSSale";

-- 7. Verificar ventas por día (últimos 7 días)
SELECT 
    DATE("createdAt") as fecha,
    COUNT(*) as cantidad_ventas,
    SUM(total) as total_vendido
FROM "POSSale" 
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY fecha DESC;

-- 8. Verificar si hay sesiones de caja activas
SELECT 
    cs.id,
    cs."sessionNumber",
    cs.status,
    cs."openedAt",
    cs."closedAt",
    crt."typeName" as tipo_caja
FROM "CashSession" cs
JOIN "CashRegisterType" crt ON cs."cashRegisterTypeId" = crt.id
ORDER BY cs."openedAt" DESC
LIMIT 5;

-- 9. Test específico del filtro de fecha problemático
-- Simular el filtro que está causando problemas
SELECT COUNT(*) as ventas_con_filtro_actual
FROM "POSSale" 
WHERE "createdAt" >= '2025-01-16'  -- Fecha desde (sin hora)
AND "createdAt" <= '2025-01-16';   -- Fecha hasta (sin hora) - PROBLEMÁTICO

-- 10. Test con el filtro corregido
SELECT COUNT(*) as ventas_con_filtro_corregido
FROM "POSSale" 
WHERE "createdAt" >= '2025-01-16T00:00:00.000Z'  -- Inicio del día
AND "createdAt" <= '2025-01-16T23:59:59.999Z';   -- Final del día

-- 11. Mostrar ejemplos de timestamps reales para entender el problema
SELECT 
    "createdAt",
    DATE("createdAt") as solo_fecha,
    TO_CHAR("createdAt", 'YYYY-MM-DD HH24:MI:SS') as fecha_hora_legible
FROM "POSSale" 
ORDER BY "createdAt" DESC 
LIMIT 5; 