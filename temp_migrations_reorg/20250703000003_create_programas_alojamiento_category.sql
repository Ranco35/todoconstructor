-- Migración para crear categoría "Programas Alojamiento" y productos asociados

-- 1. Crear la categoría "Programas Alojamiento"
INSERT INTO "Category" (name, description) 
SELECT 'Programas Alojamiento', 'Programas y paquetes de alojamiento del hotel'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE name = 'Programas Alojamiento');

-- 2. Obtener el ID de la categoría creada para usar en los productos
DO $$
DECLARE
    category_id INTEGER;
BEGIN
    -- Obtener el ID de la categoría "Programas Alojamiento"
    SELECT id INTO category_id FROM "Category" WHERE name = 'Programas Alojamiento';
    
    -- Insertar productos de ejemplo en la categoría (asegurar precios válidos)
    INSERT INTO "Product" (name, description, categoryid, saleprice, sku)
    VALUES 
    (
        'Paquete Romántico', 
        'Experiencia romántica completa para parejas con habitación suite decorada, cena romántica, masaje en pareja, desayuno en la habitación y champagne de bienvenida',
        category_id,
        250000,
        'PROG-ROM-001'
    ),
    (
        'Fin de Semana Relax', 
        'Escapada de relajación total con acceso completo al spa - 2 noches con habitación, 3 comidas diarias, acceso ilimitado a spa, masaje relajante y circuito termal',
        category_id,
        320000,
        'PROG-RELAX-001'
    ),
    (
        'Programa Luna de Miel', 
        'Paquete especial para recién casados - 3 noches en suite presidencial, cenas especiales, spa completo, excursiones, fotografía profesional y decoración especial',
        category_id,
        450000,
        'PROG-LUNA-001'
    ),
    (
        'Programa Ejecutivo', 
        'Paquete de negocios con servicios premium - habitación ejecutiva, desayuno premium, acceso a business center, wifi premium y late check-out',
        category_id,
        180000,
        'PROG-EJEC-001'
    ),
    (
        'Programa Familiar', 
        'Experiencia completa para toda la familia - 2 noches en habitación familiar, todas las comidas incluidas, actividades para niños, acceso a piscinas y entretenimiento nocturno',
        category_id,
        380000,
        'PROG-FAM-001'
    );
    
    -- Mostrar información de los productos creados
    RAISE NOTICE 'Categoría "Programas Alojamiento" creada con ID: %', category_id;
    RAISE NOTICE 'Se insertaron 5 productos de programas de alojamiento';
    
END $$;

-- 3. Verificar los productos creados
SELECT 
    p.id,
    p.name,
    p.saleprice,
    p.sku,
    c.name as category_name,
    c.id as category_id
FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
WHERE c.name = 'Programas Alojamiento'
ORDER BY p.saleprice; 