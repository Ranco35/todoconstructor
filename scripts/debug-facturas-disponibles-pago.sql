-- Debug: Verificar facturas disponibles para pago
-- Este script verifica exactamente lo que el endpoint debería retornar

-- 1. Verificar todas las facturas de compra
SELECT 
  'TODAS LAS FACTURAS' as tipo,
  COUNT(*) as cantidad
FROM purchase_invoices;

-- 2. Verificar facturas con payment_status = 'pending'
SELECT 
  'FACTURAS PENDIENTES' as tipo,
  COUNT(*) as cantidad
FROM purchase_invoices 
WHERE payment_status = 'pending';

-- 3. Verificar facturas con payment_status = 'partial'
SELECT 
  'FACTURAS PARCIALES' as tipo,
  COUNT(*) as cantidad
FROM purchase_invoices 
WHERE payment_status = 'partial';

-- 4. CONSULTA EXACTA que usa getPurchaseInvoicesForPayment
SELECT 
  pi.id,
  pi.number,
  pi.total,
  pi.payment_status,
  s.name as supplier_name
FROM purchase_invoices pi
LEFT JOIN "Supplier" s ON pi.supplier_id = s.id
WHERE pi.payment_status IN ('pending', 'partial')
ORDER BY pi.created_at DESC;

-- 5. Verificar si la tabla Supplier existe y tiene datos
SELECT 
  'PROVEEDORES' as tipo,
  COUNT(*) as cantidad
FROM "Supplier";

-- 6. Verificar relación supplier_id
SELECT 
  pi.id,
  pi.number,
  pi.supplier_id,
  s.id as supplier_real_id,
  s.name
FROM purchase_invoices pi
LEFT JOIN "Supplier" s ON pi.supplier_id = s.id
WHERE pi.payment_status = 'pending'
LIMIT 5; 