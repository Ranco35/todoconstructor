-- Script para verificar el producto 1146 "ONCE BUFFET NIÑOS" y su configuración en POS
-- Objetivo: Identificar por qué aparece a $0 en POS pero $8,000 en listado

-- 1. Verificar datos del producto 1146
SELECT 
    id,
    name,
    sku,
    saleprice as precio_venta,
    cost as costo,
    vat,
    "finalPrice" as precio_final_congelado,
    categoryid,
    is_for_pos,
    is_active,
    created_at,
    updated_at
FROM "Product" 
WHERE id = 1146;

-- 2. Verificar si está configurado para POS
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p.is_for_pos,
    p.is_active,
    c.name as categoria,
    c.is_for_pos as categoria_pos
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE p.id = 1146;

-- 3. Verificar productos que aparecen en POS
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p.is_for_pos,
    p.is_active,
    c.name as categoria,
    c.is_for_pos as categoria_pos,
    CASE 
        WHEN p.is_for_pos = true THEN '✅ POS'
        WHEN c.is_for_pos = true THEN '✅ CATEGORIA POS'
        ELSE '❌ NO POS'
    END as disponible_en_pos
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE p.name ILIKE '%once%' OR p.name ILIKE '%buffet%'
ORDER BY p.id;

-- 4. Verificar configuración de categorías para POS
SELECT 
    id,
    name,
    is_for_pos,
    is_active,
    description
FROM "Category"
WHERE is_for_pos = true OR name ILIKE '%once%' OR name ILIKE '%buffet%'
ORDER BY id;

-- 5. Verificar productos con precio 0 en POS
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p.is_for_pos,
    p.is_active,
    c.name as categoria,
    c.is_for_pos as categoria_pos
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE p.saleprice = 0 AND (p.is_for_pos = true OR c.is_for_pos = true)
ORDER BY p.id;

-- 6. Corregir producto 1146 si es necesario
UPDATE "Product" 
SET 
    saleprice = 8000,
    is_for_pos = true,
    is_active = true
WHERE id = 1146;

-- 7. Verificar después de la corrección
SELECT 
    id,
    name,
    saleprice,
    is_for_pos,
    is_active,
    "finalPrice"
FROM "Product" 
WHERE id = 1146; 