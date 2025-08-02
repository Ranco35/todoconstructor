-- BUSQUEDA PRODUCTOS "ONCE" - CORREGIDA
SELECT 
    id,
    name,
    sku,
    saleprice
FROM "Product" 
WHERE LOWER(name) LIKE '%once%'; 