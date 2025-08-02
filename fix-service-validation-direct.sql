-- =====================================================
-- 🔥 SOLUCIÓN DIRECTA: APROBAR FACTURAS DE SERVICIOS
-- =====================================================

-- 🎯 APROBAR DIRECTAMENTE LA FACTURA FC250801-0001
-- (Solo ejecutar si estás seguro que es un servicio)

UPDATE purchase_invoices 
SET 
    status = 'approved',
    approved_at = NOW(),
    updated_at = NOW()
WHERE number = 'FC250801-0001' 
  AND status = 'draft';

-- ✅ VERIFICAR QUE SE APROBÓ
SELECT 
    number as factura,
    status as estado,
    approved_at as fecha_aprobacion
FROM purchase_invoices 
WHERE number = 'FC250801-0001';