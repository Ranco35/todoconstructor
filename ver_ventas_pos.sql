-- ============================================
-- VER VENTAS POS CREADAS
-- ============================================

-- Ver todas las ventas
SELECT 
    "id",
    "saleNumber" as numero_venta,
    "customerName" as cliente,
    "total",
    "paymentMethod" as metodo_pago,
    "paymentStatus" as estado_pago,
    "createdAt" as fecha
FROM "POSSale"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Ver ventas con sus items
SELECT 
    s."saleNumber" as numero_venta,
    s."customerName" as cliente,
    s."total",
    i."productName" as producto,
    i."quantity" as cantidad,
    i."unitPrice" as precio_unitario,
    i."total" as total_item
FROM "POSSale" s
LEFT JOIN "POSSaleItem" i ON i."saleId" = s."id"
ORDER BY s."createdAt" DESC, i."id"
LIMIT 20;

-- Contar ventas por método de pago
SELECT 
    "paymentMethod" as metodo_pago,
    COUNT(*) as cantidad_ventas,
    SUM("total") as total_vendido
FROM "POSSale"
GROUP BY "paymentMethod"
ORDER BY cantidad_ventas DESC;

