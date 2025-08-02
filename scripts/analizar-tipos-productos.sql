-- ANALIZAR TIPOS DE PRODUCTOS Y FILTROS DE BÚSQUEDA
-- Determinar qué productos deben aparecer en la interfaz

-- 1. VER ESTRUCTURA DE PRODUCTOS
SELECT 
    DISTINCT type as tipo_producto,
    COUNT(*) as cantidad,
    COUNT(CASE WHEN saleprice IS NOT NULL THEN 1 END) as con_precio,
    COUNT(CASE WHEN saleprice IS NULL THEN 1 END) as sin_precio
FROM "Product" 
WHERE active = true
GROUP BY type
ORDER BY cantidad DESC;

-- 2. VER CAMPOS DE FILTRO DISPONIBLES
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name IN ('type', 'productType', 'isForSale', 'isPOSEnabled', 'isActive', 'active', 'category')
ORDER BY column_name;

-- 3. PRODUCTOS MASAJE - Ver tipos y precios
SELECT 
    id,
    name,
    type,
    saleprice,
    "isPOSEnabled",
    active
FROM "Product" 
WHERE LOWER(name) LIKE '%masaje%' 
ORDER BY id;

-- 4. PRODUCTOS PISCO - Ver tipos y precios  
SELECT 
    id,
    name,
    type,
    saleprice,
    "isPOSEnabled",
    active
FROM "Product" 
WHERE LOWER(name) LIKE '%pisco%' 
ORDER BY id;

-- 5. PRODUCTOS SIN PRECIO - Ver qué tipos son
SELECT 
    type,
    COUNT(*) as cantidad,
    string_agg(DISTINCT name, ', ' ORDER BY name) as ejemplos
FROM "Product" 
WHERE saleprice IS NULL 
  AND active = true
GROUP BY type
ORDER BY cantidad DESC
LIMIT 10; 