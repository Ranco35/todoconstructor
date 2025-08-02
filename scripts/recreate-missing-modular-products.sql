-- Script para recrear productos modulares faltantes
-- Basado en los datos que obtuvimos de reservation_products

-- Producto modular ID 237: Almuerzo Programa
INSERT INTO products_modular (
    id,
    code,
    name,
    description,
    price,
    category,
    per_person,
    is_active,
    sort_order,
    created_at,
    updated_at,
    original_id,
    sku
) VALUES (
    237,
    'almuerzo_programa_255',
    'Almuerzo Programa',
    '',
    '15000.00',
    'comida',
    true,
    true,
    0,
    NOW(),
    NOW(),
    255,
    'REST-ALMU-001-7138'
) ON CONFLICT (id) DO NOTHING;

-- Producto modular ID 240: Piscina Termal Adulto
INSERT INTO products_modular (
    id,
    code,
    name,
    description,
    price,
    category,
    per_person,
    is_active,
    sort_order,
    created_at,
    updated_at,
    original_id,
    sku
) VALUES (
    240,
    'piscina_termal_adult_257',
    'Piscina Termal Adulto',
    '',
    '22000.00',
    'spa',
    true,
    true,
    0,
    NOW(),
    NOW(),
    257,
    'SPA-PISC-001-2280'
) ON CONFLICT (id) DO NOTHING;

-- Verificar que se crearon correctamente
SELECT id, code, name, price, category, is_active 
FROM products_modular 
WHERE id IN (237, 240)
ORDER BY id; 