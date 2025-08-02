-- VERIFICAR CATEGORÍAS POS EXISTENTES

-- 1. Verificar estructura de POSProductCategory
SELECT 'ESTRUCTURA DE POSProductCategory:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'POSProductCategory' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar categorías POS existentes
SELECT 'CATEGORÍAS POS EXISTENTES:' as info;
SELECT * FROM public."POSProductCategory" ORDER BY "name";

-- 3. Verificar registros CashRegisterType
SELECT 'TIPOS DE CAJA REGISTRADORA:' as info;
SELECT * FROM public."CashRegisterType" ORDER BY "name";

-- 4. Verificar si hay productos con categoría POS asignada
SELECT 'PRODUCTOS CON CATEGORÍA POS:' as info;
SELECT id, name, "posCategoryId" 
FROM public."Product" 
WHERE "posCategoryId" IS NOT NULL 
LIMIT 5; 