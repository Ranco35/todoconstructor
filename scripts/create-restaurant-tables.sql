-- CREAR MESAS DEL RESTAURANTE PARA POS

-- 1. Verificar estructura de POSTable
SELECT 'ESTRUCTURA DE POSTABLE:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'POSTable' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Limpiar mesas existentes si las hay
DELETE FROM public."POSTable";

-- 3. Insertar mesas del restaurante
INSERT INTO public."POSTable" ("number", "name", "capacity", "status", "isActive", "createdAt", "updatedAt") VALUES
('1', 'Mesa 1', 4, 'available', true, NOW(), NOW()),
('2', 'Mesa 2', 2, 'available', true, NOW(), NOW()),
('3', 'Mesa 3', 6, 'available', true, NOW(), NOW()),
('4', 'Mesa 4', 4, 'available', true, NOW(), NOW()),
('5', 'Mesa 5', 8, 'available', true, NOW(), NOW()),
('6', 'Mesa 6', 2, 'available', true, NOW(), NOW()),
('7', 'Mesa 7', 4, 'available', true, NOW(), NOW()),
('8', 'Mesa 8', 6, 'available', true, NOW(), NOW()),
('9', 'Mesa 9', 4, 'available', true, NOW(), NOW()),
('10', 'Mesa 10', 10, 'available', true, NOW(), NOW()),
('11', 'Mesa 11', 4, 'available', true, NOW(), NOW()),
('12', 'Mesa 12', 2, 'available', true, NOW(), NOW()),
('13', 'Mesa Terraza 1', 6, 'available', true, NOW(), NOW()),
('14', 'Mesa Terraza 2', 4, 'available', true, NOW(), NOW()),
('15', 'Mesa VIP', 8, 'available', true, NOW(), NOW());

-- 4. Verificar que se insertaron
SELECT 'MESAS CREADAS:' as info;
SELECT id, "number", "name", "capacity", "status", "isActive" 
FROM public."POSTable" 
ORDER BY CAST("number" AS INTEGER);

-- 5. Contar total de mesas
SELECT 'TOTAL DE MESAS:' as info, COUNT(*) as total_mesas
FROM public."POSTable" 
WHERE "isActive" = true; 