-- Script para actualizar facturas de compras para hacerlas disponibles para pago
-- Fecha: 17 enero 2025

-- 1. Verificar el estado actual de las facturas
SELECT 
  id,
  invoice_number,
  total_amount,
  status,
  payment_status,
  created_at
FROM purchase_invoices
ORDER BY created_at DESC
LIMIT 10;

-- 2. Actualizar facturas que no tienen payment_status definido
UPDATE purchase_invoices 
SET 
  payment_status = 'pending',
  updated_at = NOW()
WHERE payment_status IS NULL 
   OR payment_status = '';

-- 3. Actualizar facturas en estado 'draft' o 'received' para que sean pagables
UPDATE purchase_invoices 
SET 
  payment_status = 'pending',
  status = CASE 
    WHEN status = 'draft' THEN 'received'
    ELSE status 
  END,
  updated_at = NOW()
WHERE status IN ('draft', 'received', 'sent')
  AND payment_status != 'paid';

-- 4. Verificar cuántas facturas están ahora disponibles para pago
SELECT 
  'Facturas disponibles para pago' as descripcion,
  COUNT(*) as cantidad
FROM purchase_invoices
WHERE payment_status IN ('pending', 'partial');

-- 5. Mostrar las facturas que ahora deberían aparecer
SELECT 
  pi.id,
  pi.invoice_number,
  pi.total_amount,
  pi.payment_status,
  pi.status,
  s.name as supplier_name
FROM purchase_invoices pi
LEFT JOIN Supplier s ON pi.supplier_id = s.id
WHERE pi.payment_status IN ('pending', 'partial')
ORDER BY pi.created_at DESC
LIMIT 10; 
 