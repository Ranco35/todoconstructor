-- RESTAURAR CATEGORÍAS POS DE FORMA SEGURA (SIN ELIMINAR DATOS EXISTENTES)

-- 1. Insertar tipos de caja registradora solo si no existen
INSERT INTO public."CashRegisterType" (id, "name", "description", "isActive", "createdAt", "updatedAt") VALUES
(1, 'Reception', 'Caja de recepción para servicios del hotel', true, NOW(), NOW()),
(2, 'Restaurant', 'Caja del restaurante para alimentos y bebidas', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 2. Insertar categorías POS para Recepción
INSERT INTO public."POSProductCategory" (id, "name", "description", "cashRegisterTypeId", "color", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
(1, 'Servicios', 'Servicios del hotel y spa', 1, '#3B82F6', 1, true, NOW(), NOW()),
(2, 'Productos', 'Productos de venta en recepción', 1, '#10B981', 2, true, NOW(), NOW()),
(3, 'Amenidades', 'Amenidades y artículos para huéspedes', 1, '#8B5CF6', 3, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "cashRegisterTypeId" = EXCLUDED."cashRegisterTypeId",
    "color" = EXCLUDED."color",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 3. Insertar categorías POS para Restaurante
INSERT INTO public."POSProductCategory" (id, "name", "description", "cashRegisterTypeId", "color", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
(4, 'Comidas', 'Platos principales y comidas', 2, '#EF4444', 1, true, NOW(), NOW()),
(5, 'Bebidas', 'Bebidas frías y calientes', 2, '#06B6D4', 2, true, NOW(), NOW()),
(6, 'Postres', 'Postres y dulces', 2, '#F59E0B', 3, true, NOW(), NOW()),
(7, 'Entradas', 'Aperitivos y entradas', 2, '#84CC16', 4, true, NOW(), NOW()),
(8, 'Especiales', 'Platos especiales y promociones', 2, '#EC4899', 5, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "cashRegisterTypeId" = EXCLUDED."cashRegisterTypeId",
    "color" = EXCLUDED."color",
    "sortOrder" = EXCLUDED."sortOrder",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = NOW();

-- 4. Verificar que se insertaron correctamente
SELECT 'TIPOS DE CAJA REGISTRADORA:' as info;
SELECT * FROM public."CashRegisterType" ORDER BY id;

SELECT 'CATEGORÍAS POS INSERTADAS:' as info;
SELECT pc.id, pc.name, pc.description, crt.name as cash_register_name, pc.color, pc."sortOrder"
FROM public."POSProductCategory" pc
LEFT JOIN public."CashRegisterType" crt ON pc."cashRegisterTypeId" = crt.id
ORDER BY pc."cashRegisterTypeId", pc."sortOrder";

-- 5. Verificar sesiones de caja que están usando los tipos
SELECT 'SESIONES DE CAJA ACTIVAS:' as info;
SELECT cs.id, cs."cashRegisterTypeId", crt.name as cash_register_name, cs.status
FROM public."CashSession" cs
LEFT JOIN public."CashRegisterType" crt ON cs."cashRegisterTypeId" = crt.id
ORDER BY cs.id; 