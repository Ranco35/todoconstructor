-- Migración para conectar spa_products con la tabla Category
-- Agregar category_id a spa_products y mantener compatibilidad con category existente

-- 1. Agregar la columna category_id como foreign key a Category
ALTER TABLE spa_products 
ADD COLUMN category_id BIGINT REFERENCES "Category"(id);

-- 2. Crear la categoría "Programas Alojamiento" si no existe
INSERT INTO "Category" (name, description) 
SELECT 'Programas Alojamiento', 'Categoría para programas y paquetes de alojamiento del hotel'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE name = 'Programas Alojamiento');

-- 3. Obtener el ID de la categoría "Programas Alojamiento"
-- Y actualizar los productos existentes que deben pertenecer a esta categoría
UPDATE spa_products 
SET category_id = (SELECT id FROM "Category" WHERE name = 'Programas Alojamiento')
WHERE category = 'Programas Alojamiento' 
   OR category = 'Hospedaje'
   OR category = 'Paquetes Especiales'
   OR category = 'Paquetes de Alojamiento'
   OR category = 'Alojamiento'
   OR category = 'Hospedaje y Alimentación'
   OR type = 'HOSPEDAJE';

-- 4. Crear categorías adicionales para productos de spa si no existen
INSERT INTO "Category" (name, description) 
SELECT 'Tratamientos Spa', 'Tratamientos y servicios de spa'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE name = 'Tratamientos Spa');

INSERT INTO "Category" (name, description) 
SELECT 'Masajes', 'Servicios de masajes terapéuticos y relajantes'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE name = 'Masajes');

INSERT INTO "Category" (name, description) 
SELECT 'Tratamientos Faciales', 'Cuidado facial y estético'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE name = 'Tratamientos Faciales');

INSERT INTO "Category" (name, description) 
SELECT 'Circuitos Termales', 'Acceso a instalaciones termales y piscinas'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE name = 'Circuitos Termales');

INSERT INTO "Category" (name, description) 
SELECT 'Paquetes Spa', 'Combos y paquetes de servicios de spa'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE name = 'Paquetes Spa');

-- 5. Actualizar productos de spa con sus categorías correspondientes
UPDATE spa_products 
SET category_id = (SELECT id FROM "Category" WHERE name = 'Tratamientos Spa')
WHERE category = 'Tratamientos' AND category_id IS NULL;

UPDATE spa_products 
SET category_id = (SELECT id FROM "Category" WHERE name = 'Paquetes Spa')
WHERE category = 'Spa Packages' AND category_id IS NULL;

UPDATE spa_products 
SET category_id = (SELECT id FROM "Category" WHERE name = 'Masajes')
WHERE category = 'Masajes' AND category_id IS NULL;

-- 6. Para productos que aún no tienen category_id, crear una categoría genérica
INSERT INTO "Category" (name, description) 
SELECT 'Servicios Generales', 'Servicios y productos generales del hotel'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE name = 'Servicios Generales');

UPDATE spa_products 
SET category_id = (SELECT id FROM "Category" WHERE name = 'Servicios Generales')
WHERE category_id IS NULL;

-- 7. Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_spa_products_category_id ON spa_products(category_id);

-- 8. Agregar comentarios para documentación
COMMENT ON COLUMN spa_products.category_id IS 'ID de la categoría del producto (referencia a tabla Category)';
COMMENT ON COLUMN spa_products.category IS 'Categoría legacy (mantener por compatibilidad)';

-- 9. Verificar los datos actualizados
-- (Esta consulta es solo informativa, se ejecutará al aplicar la migración)
SELECT 
    c.id as category_id,
    c.name as category_name,
    COUNT(sp.id) as productos_count
FROM "Category" c
LEFT JOIN spa_products sp ON sp.category_id = c.id
WHERE c.name IN ('Programas Alojamiento', 'Tratamientos Spa', 'Paquetes Spa', 'Masajes', 'Servicios Generales')
GROUP BY c.id, c.name
ORDER BY c.name; 