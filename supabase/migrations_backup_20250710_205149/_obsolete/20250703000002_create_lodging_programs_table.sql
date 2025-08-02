-- Migración para crear tabla de Programas de Alojamiento
-- Separada de spa_products para mejor organización

-- 1. Crear tabla específica para programas de alojamiento
CREATE TABLE lodging_programs (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id BIGINT REFERENCES "Category"(id),
  price DECIMAL(10,2) NOT NULL,
  duration VARCHAR(50), -- "1 noche", "2 noches", etc.
  nights INTEGER DEFAULT 1,
  includes TEXT, -- Lo que incluye el programa
  sku VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Crear la categoría "Programas Alojamiento" si no existe
INSERT INTO "Category" (name, description) 
SELECT 'Programas Alojamiento', 'Categoría para programas y paquetes de alojamiento del hotel'
WHERE NOT EXISTS (SELECT 1 FROM "Category" WHERE name = 'Programas Alojamiento');

-- 3. Insertar programas de alojamiento de ejemplo conectados con la categoría
INSERT INTO lodging_programs (name, description, category_id, price, duration, nights, includes, sku) 
VALUES 
(
  'Paquete Romántico',
  'Experiencia romántica completa para parejas',
  (SELECT id FROM "Category" WHERE name = 'Programas Alojamiento'),
  250000,
  '1 noche',
  1,
  'Habitación suite decorada, cena romántica, masaje en pareja, desayuno en la habitación, champagne de bienvenida',
  'PROG-ROM-001'
),
(
  'Fin de Semana Relax',
  'Escapada de relajación total con acceso completo al spa',
  (SELECT id FROM "Category" WHERE name = 'Programas Alojamiento'),
  320000,
  '2 noches',
  2,
  'Habitación, 3 comidas diarias, acceso ilimitado a spa, masaje relajante, circuito termal',
  'PROG-RELAX-001'
),
(
  'Programa Luna de Miel',
  'Paquete especial para recién casados',
  (SELECT id FROM "Category" WHERE name = 'Programas Alojamiento'),
  450000,
  '3 noches',
  3,
  'Suite presidencial, cenas especiales, spa completo, excursiones, fotografía profesional, decoración especial',
  'PROG-LUNA-001'
),
(
  'Programa Ejecutivo',
  'Paquete de negocios con servicios premium',
  (SELECT id FROM "Category" WHERE name = 'Programas Alojamiento'),
  180000,
  '1 noche',
  1,
  'Habitación ejecutiva, desayuno premium, acceso a business center, wifi premium, late check-out',
  'PROG-EJEC-001'
),
(
  'Programa Familiar',
  'Experiencia completa para toda la familia',
  (SELECT id FROM "Category" WHERE name = 'Programas Alojamiento'),
  380000,
  '2 noches',
  2,
  'Habitación familiar, todas las comidas, actividades para niños, acceso a piscinas, entretenimiento nocturno',
  'PROG-FAM-001'
);

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_lodging_programs_category_id ON lodging_programs(category_id);
CREATE INDEX IF NOT EXISTS idx_lodging_programs_active ON lodging_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_lodging_programs_price ON lodging_programs(price);

-- 5. Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_lodging_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lodging_programs_updated_at 
BEFORE UPDATE ON lodging_programs
FOR EACH ROW EXECUTE FUNCTION update_lodging_programs_updated_at();

-- 6. Agregar comentarios para documentación
COMMENT ON TABLE lodging_programs IS 'Programas y paquetes de alojamiento del hotel';
COMMENT ON COLUMN lodging_programs.category_id IS 'ID de la categoría (debe ser "Programas Alojamiento")';
COMMENT ON COLUMN lodging_programs.price IS 'Precio total del programa (reemplaza precio de habitación)';
COMMENT ON COLUMN lodging_programs.nights IS 'Número de noches incluidas en el programa';
COMMENT ON COLUMN lodging_programs.includes IS 'Descripción detallada de lo que incluye el programa';

-- 7. Verificar los programas creados
SELECT 
    lp.id,
    lp.name,
    lp.price,
    lp.nights,
    c.name as category_name,
    c.id as category_id
FROM lodging_programs lp
JOIN "Category" c ON lp.category_id = c.id
WHERE c.name = 'Programas Alojamiento'
ORDER BY lp.price; 