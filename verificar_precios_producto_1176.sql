-- Verificar precios del producto FULL DAY ADULTO (ID: 1176)
SELECT 
    id,
    name,
    costprice,
    saleprice,
    vat,
    "isForSale",
    type,
    sku,
    unit
FROM "Product" 
WHERE id = 1176;

-- Listar todas las tablas para verificar nombres exactos
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%product%'
ORDER BY table_name;

-- Listar todas las tablas que contengan "pos" o "category"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%pos%' OR table_name LIKE '%category%')
ORDER BY table_name;

-- Verificar si existe stock para el producto
SELECT 
    productid,
    quantity,
    minstock,
    maxstock,
    warehouseid
FROM "Warehouse_Product" 
WHERE productid = 1176; 