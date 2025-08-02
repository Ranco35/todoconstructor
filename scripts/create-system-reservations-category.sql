-- Script para crear categoría especial "Sistema Reservas"
-- Esta categoría será usada para productos de habitaciones del sistema de reservas

-- 1. Crear categoría "Sistema Reservas"
INSERT INTO "Category" (name, description, "parentId", "createdAt", "updatedAt")
VALUES (
    'Sistema Reservas',
    'Categoría especial para productos del sistema de reservas de habitaciones. No se puede eliminar desde gestión de productos.',
    NULL,
    NOW(),
    NOW()
) ON CONFLICT (name) DO NOTHING;

-- 2. Verificar que se creó correctamente
SELECT 
    id,
    name,
    description,
    "parentId",
    "createdAt",
    "updatedAt"
FROM "Category" 
WHERE name = 'Sistema Reservas';

-- 3. Mostrar todas las categorías para verificar
SELECT 
    id,
    name,
    description,
    "parentId",
    "createdAt"
FROM "Category" 
ORDER BY name; 