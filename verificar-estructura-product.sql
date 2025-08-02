-- =====================================================
-- 🔍 VERIFICAR ESTRUCTURA TABLA Product
-- =====================================================

-- 1️⃣ VER TODAS LAS COLUMNAS DE LA TABLA Product
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product'
ORDER BY ordinal_position;

-- 2️⃣ BUSCAR COLUMNAS RELACIONADAS CON ESTADO ACTIVO
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND (column_name ILIKE '%active%' OR column_name ILIKE '%enable%');

-- 3️⃣ VERIFICAR DATOS DE EJEMPLO CON COLUMNA CORRECTA
SELECT 
    id,
    name,
    active,  -- Esta es la columna correcta
    type
FROM "Product" 
LIMIT 5;