-- ============================================
-- VERIFICAR QUE LAS VENTAS EXISTEN
-- ============================================

-- Ver ventas con todos los detalles
SELECT 
    s."id",
    s."saleNumber" as numero,
    s."customerName" as cliente,
    s."total",
    s."paymentMethod" as pago,
    s."paymentStatus" as estado,
    s."sessionId" as sesion_id,
    s."createdAt" as fecha,
    COUNT(i."id") as items
FROM "POSSale" s
LEFT JOIN "POSSaleItem" i ON i."saleId" = s."id"
GROUP BY s."id", s."saleNumber", s."customerName", s."total", s."paymentMethod", s."paymentStatus", s."sessionId", s."createdAt"
ORDER BY s."createdAt" DESC;

-- Ver items de cada venta
SELECT 
    s."saleNumber" as venta,
    i."productName" as producto,
    i."quantity" as cantidad,
    i."unitPrice" as precio,
    i."total"
FROM "POSSale" s
INNER JOIN "POSSaleItem" i ON i."saleId" = s."id"
ORDER BY s."createdAt" DESC, i."id";

-- Verificar si hay pagos registrados
SELECT 
    s."saleNumber" as venta,
    p."paymentMethod" as metodo,
    p."amount" as monto,
    p."changeAmount" as cambio
FROM "POSSale" s
LEFT JOIN "POSSalePayment" p ON p."saleId" = s."id"
ORDER BY s."createdAt" DESC;

