-- =====================================================
-- 🚀 APROBAR FACTURA DE SERVICIOS FC250801-0001
-- =====================================================

-- ✅ CONFIRMAR QUE ES LA FACTURA CORRECTA
SELECT 
    id,
    number as factura,
    status as estado_actual,
    total,
    warehouse_id as bodega
FROM purchase_invoices 
WHERE number = 'FC250801-0001';

-- 🎯 APROBAR LA FACTURA (Solo servicios - sin movimientos de inventario)
UPDATE purchase_invoices 
SET 
    status = 'approved',
    approved_at = NOW(),
    updated_at = NOW()
WHERE number = 'FC250801-0001' 
  AND status = 'draft';

-- ✅ VERIFICAR QUE SE APROBÓ CORRECTAMENTE
SELECT 
    '✅ RESULTADO FINAL' as resultado,
    number as factura,
    status as nuevo_estado,
    approved_at as fecha_aprobacion,
    total as monto
FROM purchase_invoices 
WHERE number = 'FC250801-0001';