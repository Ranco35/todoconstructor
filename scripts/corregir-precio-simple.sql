-- Corregir precio FULL DAY ADULTO
UPDATE products 
SET 
  saleprice = 46218,
  final_price_with_vat = 55000
WHERE name = 'FULL DAY ADULTO';

-- Verificar el cambio
SELECT 
  id,
  name,
  saleprice as precio_neto,
  vat as iva_porcentaje,
  final_price_with_vat as precio_final_actual,
  ROUND(saleprice * (1 + vat/100)) as precio_final_calculado
FROM products 
WHERE name = 'FULL DAY ADULTO'; 