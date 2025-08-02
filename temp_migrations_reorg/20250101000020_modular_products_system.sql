-- 📦 MIGRACIÓN: Sistema Modular de Productos
-- Archivo: 20250101000020_modular_products_system.sql

-- ═══════════════════════════════════════════════════════════════
-- 1. TABLA DE PRODUCTOS INDIVIDUALES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE products_modular (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,        -- 'desayuno', 'almuerzo', 'piscina_termal'
  name VARCHAR(255) NOT NULL,              -- 'Desayuno Buffet', 'Almuerzo'
  description TEXT,                        -- Descripción detallada
  price DECIMAL(10,2) NOT NULL DEFAULT 0,  -- Precio base del producto
  category VARCHAR(50) NOT NULL,           -- 'alojamiento', 'comida', 'spa', 'entretenimiento'
  per_person BOOLEAN DEFAULT true,         -- ¿Se cobra por persona o es precio fijo?
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 2. TABLA DE PAQUETES (PROGRAMAS)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE packages_modular (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,        -- 'MEDIA_PENSION', 'TODO_INCLUIDO'
  name VARCHAR(255) NOT NULL,              -- 'Media Pensión', 'Todo Incluido'
  description TEXT,                        -- Descripción del paquete
  color VARCHAR(20) DEFAULT 'blue',        -- Color para UI
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 3. TABLA DE COMPOSICIÓN DE PAQUETES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE package_products_modular (
  id BIGSERIAL PRIMARY KEY,
  package_id BIGINT REFERENCES packages_modular(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products_modular(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,        -- ¿Está incluido o es opcional?
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(package_id, product_id)
);

-- ═══════════════════════════════════════════════════════════════
-- 4. TABLA DE MULTIPLICADORES POR EDAD
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE age_pricing_modular (
  id BIGSERIAL PRIMARY KEY,
  age_category VARCHAR(20) NOT NULL,      -- 'adult', 'child', 'baby'
  min_age INTEGER NOT NULL,               -- Edad mínima
  max_age INTEGER,                        -- Edad máxima (NULL = sin límite)
  multiplier DECIMAL(3,2) NOT NULL,       -- 1.0 = precio completo, 0.5 = 50%, 0.0 = gratis
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 5. ACTUALIZAR TABLA DE RESERVAS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS package_modular_id BIGINT REFERENCES packages_modular(id),
ADD COLUMN IF NOT EXISTS adults INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS children_ages INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS product_breakdown JSONB;

-- ═══════════════════════════════════════════════════════════════
-- 6. INSERTAR DATOS INICIALES - PRODUCTOS
-- ═══════════════════════════════════════════════════════════════

INSERT INTO products_modular (code, name, description, price, category, per_person, sort_order) VALUES

-- ALOJAMIENTO (precio fijo, no por persona)
('habitacion_estandar', 'Habitación Estándar', 'Habitación cómoda con baño privado', 85000, 'alojamiento', false, 1),
('habitacion_superior', 'Habitación Superior', 'Habitación superior con vista', 110000, 'alojamiento', false, 2),
('suite_junior', 'Suite Junior', 'Suite espaciosa con sala de estar', 140000, 'alojamiento', false, 3),
('suite_presidencial', 'Suite Presidencial', 'Suite de lujo premium', 200000, 'alojamiento', false, 4),

-- COMIDAS (precio por persona)
('desayuno', 'Desayuno Buffet', 'Desayuno buffet continental', 15000, 'comida', true, 10),
('almuerzo', 'Almuerzo', 'Almuerzo en restaurante principal', 25000, 'comida', true, 11),
('cena', 'Cena', 'Cena en restaurante principal', 30000, 'comida', true, 12),
('snacks', 'Snacks Todo el Día', 'Snacks y bebidas durante el día', 8000, 'comida', true, 13),

-- SPA Y BIENESTAR (precio por persona)
('piscina_termal', 'Piscina Termal', 'Acceso ilimitado a piscinas termales', 12000, 'spa', true, 20),
('spa_basico', 'Spa Básico', 'Sesiones básicas de spa', 18000, 'spa', true, 21),
('spa_premium', 'Spa Premium', 'Tratamientos premium de spa', 35000, 'spa', true, 22),

-- ENTRETENIMIENTO (precio por persona)
('actividades_basicas', 'Actividades Básicas', 'Actividades recreativas básicas', 5000, 'entretenimiento', true, 30),
('actividades_premium', 'Actividades Premium', 'Actividades premium', 15000, 'entretenimiento', true, 31),
('bar_incluido', 'Bar Incluido', 'Bebidas alcohólicas y no alcohólicas', 20000, 'entretenimiento', true, 32),

-- SERVICIOS ADICIONALES
('wifi', 'WiFi Premium', 'Internet de alta velocidad', 0, 'servicios', false, 40),
('parking', 'Estacionamiento', 'Estacionamiento privado', 5000, 'servicios', false, 41);

-- ═══════════════════════════════════════════════════════════════
-- 7. INSERTAR DATOS INICIALES - PAQUETES
-- ═══════════════════════════════════════════════════════════════

INSERT INTO packages_modular (code, name, description, color, sort_order) VALUES
('SOLO_ALOJAMIENTO', 'Solo Alojamiento', 'Solo la habitación + servicios básicos', 'gray', 1),
('DESAYUNO', 'Solo Desayuno', 'Alojamiento + desayuno + servicios básicos', 'blue', 2),
('MEDIA_PENSION', 'Media Pensión', 'Desayuno + almuerzo + piscina termal', 'green', 3),
('PENSION_COMPLETA', 'Pensión Completa', 'Todas las comidas + servicios spa', 'purple', 4),
('TODO_INCLUIDO', 'Todo Incluido', 'Todo incluido + entretenimiento premium', 'red', 5);

-- ═══════════════════════════════════════════════════════════════
-- 8. CONFIGURAR COMPOSICIÓN DE PAQUETES
-- ═══════════════════════════════════════════════════════════════

-- SOLO ALOJAMIENTO
INSERT INTO package_products_modular (package_id, product_id, sort_order)
SELECT p.id, pr.id, row_number() OVER () FROM packages_modular p, products_modular pr 
WHERE p.code = 'SOLO_ALOJAMIENTO' AND pr.code IN ('wifi');

-- SOLO DESAYUNO  
INSERT INTO package_products_modular (package_id, product_id, sort_order)
SELECT p.id, pr.id, row_number() OVER () FROM packages_modular p, products_modular pr 
WHERE p.code = 'DESAYUNO' AND pr.code IN ('desayuno', 'piscina_termal', 'wifi');

-- MEDIA PENSIÓN
INSERT INTO package_products_modular (package_id, product_id, sort_order)
SELECT p.id, pr.id, row_number() OVER () FROM packages_modular p, products_modular pr 
WHERE p.code = 'MEDIA_PENSION' AND pr.code IN ('desayuno', 'almuerzo', 'piscina_termal', 'actividades_basicas', 'wifi');

-- PENSIÓN COMPLETA
INSERT INTO package_products_modular (package_id, product_id, sort_order)
SELECT p.id, pr.id, row_number() OVER () FROM packages_modular p, products_modular pr 
WHERE p.code = 'PENSION_COMPLETA' AND pr.code IN ('desayuno', 'almuerzo', 'cena', 'piscina_termal', 'spa_basico', 'actividades_basicas', 'wifi');

-- TODO INCLUIDO
INSERT INTO package_products_modular (package_id, product_id, sort_order)
SELECT p.id, pr.id, row_number() OVER () FROM packages_modular p, products_modular pr 
WHERE p.code = 'TODO_INCLUIDO' AND pr.code IN ('desayuno', 'almuerzo', 'cena', 'snacks', 'piscina_termal', 'spa_premium', 'actividades_premium', 'bar_incluido', 'wifi', 'parking');

-- ═══════════════════════════════════════════════════════════════
-- 9. CONFIGURAR MULTIPLICADORES POR EDAD
-- ═══════════════════════════════════════════════════════════════

INSERT INTO age_pricing_modular (age_category, min_age, max_age, multiplier, description) VALUES
('baby', 0, 3, 0.0, 'Bebés hasta 3 años - Gratis'),
('child', 4, 12, 0.5, 'Niños de 4 a 12 años - 50% descuento'),
('adult', 13, NULL, 1.0, 'Adultos 13+ años - Precio completo');

-- ═══════════════════════════════════════════════════════════════
-- 10. FUNCIÓN PARA CALCULAR PRECIO DE RESERVA
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_package_price_modular(
  p_package_code VARCHAR(50),
  p_room_code VARCHAR(50),
  p_adults INTEGER,
  p_children_ages INTEGER[],
  p_nights INTEGER,
  p_additional_products VARCHAR(50)[] DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  room_price DECIMAL(10,2) := 0;
  package_total DECIMAL(10,2) := 0;
  additional_total DECIMAL(10,2) := 0;
  product_breakdown JSONB := '[]'::jsonb;
  product_record RECORD;
  age INTEGER;
  multiplier DECIMAL(3,2);
  product_total DECIMAL(10,2);
  adults_price DECIMAL(10,2);
  children_price DECIMAL(10,2);
BEGIN
  -- Obtener precio de habitación
  SELECT price INTO room_price
  FROM products_modular 
  WHERE code = p_room_code AND category = 'alojamiento';
  
  room_price := COALESCE(room_price, 0) * p_nights;
  
  -- Calcular productos incluidos en el paquete
  FOR product_record IN 
    SELECT pr.code, pr.name, pr.price, pr.per_person, pr.category
    FROM products_modular pr
    JOIN package_products_modular pp ON pr.id = pp.product_id
    JOIN packages_modular pk ON pp.package_id = pk.id
    WHERE pk.code = p_package_code AND pr.is_active = true
    ORDER BY pp.sort_order
  LOOP
    product_total := 0;
    adults_price := 0;
    children_price := 0;
    
    IF product_record.per_person THEN
      -- Precio por adultos
      adults_price := p_adults * product_record.price * 1.0;
      
      -- Precio por niños según edad
      FOREACH age IN ARRAY p_children_ages
      LOOP
        SELECT age_pricing_modular.multiplier INTO multiplier
        FROM age_pricing_modular
        WHERE age >= min_age AND (max_age IS NULL OR age <= max_age);
        
        children_price := children_price + (product_record.price * COALESCE(multiplier, 0));
      END LOOP;
      
      product_total := (adults_price + children_price) * p_nights;
    ELSE
      -- Precio fijo
      product_total := product_record.price * p_nights;
    END IF;
    
    package_total := package_total + product_total;
    
    -- Agregar al breakdown
    product_breakdown := product_breakdown || jsonb_build_object(
      'code', product_record.code,
      'name', product_record.name,
      'category', product_record.category,
      'total', product_total,
      'adults_price', adults_price * p_nights,
      'children_price', children_price * p_nights,
      'per_person', product_record.per_person,
      'is_included', true
    );
  END LOOP;
  
  -- Retornar resultado completo
  RETURN jsonb_build_object(
    'room_total', room_price,
    'package_total', package_total,
    'additional_total', additional_total,
    'grand_total', room_price + package_total + additional_total,
    'nights', p_nights,
    'daily_average', (room_price + package_total + additional_total) / p_nights,
    'breakdown', product_breakdown
  );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- 11. POLÍTICAS DE SEGURIDAD RLS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE products_modular ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages_modular ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_products_modular ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_pricing_modular ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para usuarios autenticados
CREATE POLICY "Users can read products" ON products_modular
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Users can read packages" ON packages_modular
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Users can read package composition" ON package_products_modular
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read age pricing" ON age_pricing_modular
  FOR SELECT TO authenticated USING (true); 