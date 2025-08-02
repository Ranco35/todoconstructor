-- Script para verificar facturas de compras disponibles para pago
-- Fecha: 17 enero 2025

-- 1. Verificar cuántas facturas de compras hay en total
SELECT 
  'Total facturas de compras' as descripcion,
  COUNT(*) as cantidad
FROM purchase_invoices;

-- 2. Verificar facturas por estado de pago
SELECT 
  payment_status,
  COUNT(*) as cantidad
FROM purchase_invoices
GROUP BY payment_status
ORDER BY payment_status;

-- 3. Facturas que deberían estar disponibles para pago
SELECT 
  pi.id,
  pi.invoice_number,
  pi.total_amount,
  pi.payment_status,
  pi.status,
  s.name as supplier_name,
  COALESCE(SUM(pip.amount), 0) as total_paid,
  (pi.total_amount - COALESCE(SUM(pip.amount), 0)) as remaining_balance
FROM purchase_invoices pi
LEFT JOIN suppliers s ON pi.supplier_id = s.id
LEFT JOIN purchase_invoice_payments pip ON pi.id = pip.purchase_invoice_id AND pip.status = 'completed'
WHERE pi.payment_status IN ('pending', 'partial')
GROUP BY pi.id, pi.invoice_number, pi.total_amount, pi.payment_status, pi.status, s.name
HAVING (pi.total_amount - COALESCE(SUM(pip.amount), 0)) > 0.01
ORDER BY pi.created_at DESC;

-- 4. Si no hay facturas, mostrar una muestra de las que existen
SELECT 
  'Muestra de facturas existentes' as descripcion,
  pi.id,
  pi.invoice_number,
  pi.total_amount,
  pi.payment_status,
  pi.status,
  s.name as supplier_name
FROM purchase_invoices pi
LEFT JOIN suppliers s ON pi.supplier_id = s.id
ORDER BY pi.created_at DESC
LIMIT 5;

-- 5. Verificar si la tabla purchase_invoice_payments existe y tiene datos
SELECT 
  'Pagos de facturas de compras' as descripcion,
  COUNT(*) as cantidad
FROM purchase_invoice_payments; 
-- Fecha: 17 enero 2025

-- 1. Verificar cuántas facturas de compras hay en total
SELECT 
  'Total facturas de compras' as descripcion,
  COUNT(*) as cantidad
FROM purchase_invoices;

-- 2. Verificar facturas por estado de pago
SELECT 
  payment_status,
  COUNT(*) as cantidad
FROM purchase_invoices
GROUP BY payment_status
ORDER BY payment_status;

-- 3. Facturas que deberían estar disponibles para pago
SELECT 
  pi.id,
  pi.invoice_number,
  pi.total_amount,
  pi.payment_status,
  pi.status,
  s.name as supplier_name,
  COALESCE(SUM(pip.amount), 0) as total_paid,
  (pi.total_amount - COALESCE(SUM(pip.amount), 0)) as remaining_balance
FROM purchase_invoices pi
LEFT JOIN suppliers s ON pi.supplier_id = s.id
LEFT JOIN purchase_invoice_payments pip ON pi.id = pip.purchase_invoice_id AND pip.status = 'completed'
WHERE pi.payment_status IN ('pending', 'partial')
GROUP BY pi.id, pi.invoice_number, pi.total_amount, pi.payment_status, pi.status, s.name
HAVING (pi.total_amount - COALESCE(SUM(pip.amount), 0)) > 0.01
ORDER BY pi.created_at DESC;

-- 4. Si no hay facturas, mostrar una muestra de las que existen
SELECT 
  'Muestra de facturas existentes' as descripcion,
  pi.id,
  pi.invoice_number,
  pi.total_amount,
  pi.payment_status,
  pi.status,
  s.name as supplier_name
FROM purchase_invoices pi
LEFT JOIN suppliers s ON pi.supplier_id = s.id
ORDER BY pi.created_at DESC
LIMIT 5;

-- 5. Verificar si la tabla purchase_invoice_payments existe y tiene datos
SELECT 
  'Pagos de facturas de compras' as descripcion,
  COUNT(*) as cantidad
FROM purchase_invoice_payments; 
 
 