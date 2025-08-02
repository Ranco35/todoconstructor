-- Script para corregir facturas sin estado
-- Fecha: 17 de Enero 2025
-- Propósito: Establecer estado 'draft' para facturas que no tienen estado

-- Verificar facturas sin estado
SELECT 
  id,
  invoice_number,
  status,
  created_at
FROM purchase_invoices 
WHERE status IS NULL OR status = '' OR status = 'undefined'
ORDER BY created_at DESC;

-- Actualizar facturas sin estado a 'draft'
UPDATE purchase_invoices 
SET 
  status = 'draft',
  updated_at = now()
WHERE status IS NULL OR status = '' OR status = 'undefined';

-- Verificar la actualización
SELECT 
  COUNT(*) as total_facturas,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_facturas,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as sin_estado
FROM purchase_invoices;

-- Mostrar distribución de estados
SELECT 
  status,
  COUNT(*) as cantidad
FROM purchase_invoices 
GROUP BY status
ORDER BY status; 