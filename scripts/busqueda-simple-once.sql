-- BUSQUEDA SIMPLE PRODUCTOS "ONCE"
SELECT 
    id,
    name,
    sku,
    saleprice,
    active
FROM "Product" 
WHERE LOWER(name) LIKE '%once%' 
  AND active = true; 