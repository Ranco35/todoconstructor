-- Script para insertar categorías POS iniciales básicas
-- Ejecutar después de aplicar la migración del campo posCategoryId

-- Insertar categorías básicas para el restaurante (cashRegisterTypeId = 2)
INSERT INTO "POSProductCategory" (
    "name",
    "displayName", 
    "icon",
    "color",
    "cashRegisterTypeId",
    "isActive",
    "sortOrder"
) VALUES 
    ('comida', 'Comida', '🍽️', '#FF6B6B', 2, true, 1),
    ('bebidas', 'Bebidas', '🥤', '#4ECDC4', 2, true, 2),
    ('postres', 'Postres', '🍰', '#FFD93D', 2, true, 3),
    ('entradas', 'Entradas', '🥗', '#6BCF7F', 2, true, 4),
    ('especiales', 'Especiales', '⭐', '#A8E6CF', 2, true, 5)
ON CONFLICT DO NOTHING; -- Evita duplicados si ya existen

-- Insertar categorías básicas para recepción (cashRegisterTypeId = 1) 
INSERT INTO "POSProductCategory" (
    "name",
    "displayName", 
    "icon",
    "color",
    "cashRegisterTypeId",
    "isActive",
    "sortOrder"
) VALUES 
    ('servicios', 'Servicios', '🛎️', '#FF9FF3', 1, true, 1),
    ('productos', 'Productos', '🛍️', '#54A0FF', 1, true, 2),
    ('amenidades', 'Amenidades', '🧴', '#5F27CD', 1, true, 3)
ON CONFLICT DO NOTHING; -- Evita duplicados si ya existen

-- Verificar inserción
SELECT 
    id,
    "name",
    "displayName",
    "icon",
    "color",
    "cashRegisterTypeId",
    CASE "cashRegisterTypeId" 
        WHEN 1 THEN 'Recepción'
        WHEN 2 THEN 'Restaurante'
        ELSE 'Otro'
    END as tipo_caja,
    "isActive",
    "sortOrder"
FROM "POSProductCategory"
ORDER BY "cashRegisterTypeId", "sortOrder"; 