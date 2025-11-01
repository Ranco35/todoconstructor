-- ============================================
-- CORREGIR NOMBRE DE VENTAS2 → FERRETERIA2
-- ============================================

-- Actualizar el nombre del segundo POS
UPDATE "CashRegisterType" 
SET 
    "displayName" = 'Ferreteria2',
    "description" = 'Punto de ventas secundario',
    "updatedAt" = NOW()
WHERE "id" = 2;

-- Verificar cambio
SELECT 
    "id",
    "name" as nombre_interno,
    "displayName" as nombre_mostrado,
    "isActive" as activo
FROM "CashRegisterType"
ORDER BY "id";

