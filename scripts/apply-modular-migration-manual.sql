-- ═══════════════════════════════════════════════════════════════
-- 🚀 APLICAR MIGRACIÓN DEL SISTEMA MODULAR - MANUAL
-- ═══════════════════════════════════════════════════════════════
-- Instrucciones: Copiar y pegar en Supabase Dashboard > SQL Editor

-- VERIFICAR PRIMERO SI YA EXISTEN LAS TABLAS
SELECT COUNT(*) as tablas_existentes 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products_modular', 'packages_modular', 'package_products_modular', 'age_pricing_modular');

-- ═══════════════════════════════════════════════════════════════
-- 1. CREAR TABLAS DEL SISTEMA MODULAR
-- ═══════════════════════════════════════════════════════════════

-- TABLA DE PRODUCTOS INDIVIDUALES
CREATE TABLE IF NOT EXISTS products_modular (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category VARCHAR(50) NOT NULL,
  per_person BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA DE PAQUETES
CREATE TABLE IF NOT EXISTS packages_modular (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA DE COMPOSICIÓN DE PAQUETES
CREATE TABLE IF NOT EXISTS package_products_modular (
  id BIGSERIAL PRIMARY KEY,
  package_id BIGINT REFERENCES packages_modular(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products_modular(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(package_id, product_id)
);

-- TABLA DE MULTIPLICADORES POR EDAD
CREATE TABLE IF NOT EXISTS age_pricing_modular (
  id BIGSERIAL PRIMARY KEY,
  age_category VARCHAR(20) NOT NULL,
  min_age INTEGER NOT NULL,
  max_age INTEGER,
  multiplier DECIMAL(3,2) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 2. INSERTAR DATOS INICIALES (SOLO SI NO EXISTEN)
-- ═══════════════════════════════════════════════════════════════

-- PRODUCTOS
INSERT INTO products_modular (code, name, description, price, category, per_person, sort_order) 
SELECT * FROM (VALUES
  ('habitacion_estandar', 'Habitación Estándar', 'Habitación cómoda con baño privado', 85000, 'alojamiento', false, 1),
  ('habitacion_superior', 'Habitación Superior', 'Habitación superior con vista', 110000, 'alojamiento', false, 2),
  ('suite_junior', 'Suite Junior', 'Suite espaciosa con sala de estar', 140000, 'alojamiento', false, 3),
  ('desayuno', 'Desayuno Buffet', 'Desayuno buffet continental', 15000, 'comida', true, 10),
  ('almuerzo', 'Almuerzo', 'Almuerzo en restaurante principal', 25000, 'comida', true, 11),
  ('cena', 'Cena', 'Cena en restaurante principal', 30000, 'comida', true, 12),
  ('piscina_termal', 'Piscina Termal', 'Acceso ilimitado a piscinas termales', 12000, 'spa', true, 20),
  ('spa_basico', 'Spa Básico', 'Sesiones básicas de spa', 18000, 'spa', true, 21),
  ('actividades_basicas', 'Actividades Básicas', 'Actividades recreativas básicas', 5000, 'entretenimiento', true, 30),
  ('wifi', 'WiFi Premium', 'Internet de alta velocidad', 0, 'servicios', false, 40)
) AS v(code, name, description, price, category, per_person, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM products_modular WHERE code = v.code);

-- PAQUETES
INSERT INTO packages_modular (code, name, description, color, sort_order)
SELECT * FROM (VALUES
  ('SOLO_ALOJAMIENTO', 'Solo Alojamiento', 'Solo la habitación + servicios básicos', 'gray', 1),
  ('DESAYUNO', 'Solo Desayuno', 'Alojamiento + desayuno + servicios básicos', 'blue', 2),
  ('MEDIA_PENSION', 'Media Pensión', 'Desayuno + almuerzo + piscina termal', 'green', 3),
  ('PENSION_COMPLETA', 'Pensión Completa', 'Todas las comidas + servicios spa', 'purple', 4),
  ('TODO_INCLUIDO', 'Todo Incluido', 'Todo incluido + entretenimiento premium', 'red', 5)
) AS v(code, name, description, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM packages_modular WHERE code = v.code);

-- MULTIPLICADORES POR EDAD
INSERT INTO age_pricing_modular (age_category, min_age, max_age, multiplier, description)
SELECT * FROM (VALUES
  ('baby', 0, 3, 0.0, 'Bebés hasta 3 años - Gratis'),
  ('child', 4, 12, 0.5, 'Niños de 4 a 12 años - 50% descuento'),
  ('adult', 13, NULL, 1.0, 'Adultos 13+ años - Precio completo')
) AS v(age_category, min_age, max_age, multiplier, description)
WHERE NOT EXISTS (SELECT 1 FROM age_pricing_modular WHERE age_category = v.age_category);

-- ═══════════════════════════════════════════════════════════════
-- 3. CONFIGURAR COMPOSICIÓN DE PAQUETES
-- ═══════════════════════════════════════════════════════════════

-- SOLO DESAYUNO
INSERT INTO package_products_modular (package_id, product_id, sort_order)
SELECT p.id, pr.id, 1 
FROM packages_modular p, products_modular pr 
WHERE p.code = 'DESAYUNO' AND pr.code = 'desayuno'
AND NOT EXISTS (
  SELECT 1 FROM package_products_modular ppm
  WHERE ppm.package_id = p.id AND ppm.product_id = pr.id
);

-- MEDIA PENSIÓN
INSERT INTO package_products_modular (package_id, product_id, sort_order)
SELECT p.id, pr.id, 
  CASE pr.code 
    WHEN 'desayuno' THEN 1
    WHEN 'almuerzo' THEN 2
    WHEN 'piscina_termal' THEN 3
  END
FROM packages_modular p, products_modular pr 
WHERE p.code = 'MEDIA_PENSION' AND pr.code IN ('desayuno', 'almuerzo', 'piscina_termal')
AND NOT EXISTS (
  SELECT 1 FROM package_products_modular ppm
  WHERE ppm.package_id = p.id AND ppm.product_id = pr.id
);

-- ═══════════════════════════════════════════════════════════════
-- 4. FUNCIÓN SIMPLIFICADA DE CÁLCULO
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_package_price_modular(
  p_package_code VARCHAR(50),
  p_room_code VARCHAR(50),
  p_adults INTEGER,
  p_children_ages INTEGER[],
  p_nights INTEGER
) RETURNS JSONB AS $$
DECLARE
  room_price DECIMAL(10,2) := 0;
  package_total DECIMAL(10,2) := 0;
  product_breakdown JSONB := '[]'::jsonb;
BEGIN
  -- Obtener precio de habitación
  SELECT price INTO room_price
  FROM products_modular 
  WHERE code = p_room_code AND category = 'alojamiento';
  
  room_price := COALESCE(room_price, 0) * p_nights;
  
  -- Calcular productos del paquete
  SELECT COALESCE(SUM(
    CASE 
      WHEN pr.per_person THEN 
        (p_adults * pr.price + (array_length(p_children_ages, 1) * pr.price * 0.5)) * p_nights
      ELSE 
        pr.price * p_nights
    END
  ), 0) INTO package_total
  FROM products_modular pr
  JOIN package_products_modular pp ON pr.id = pp.product_id
  JOIN packages_modular pk ON pp.package_id = pk.id
  WHERE pk.code = p_package_code AND pr.is_active = true;
  
  RETURN jsonb_build_object(
    'room_total', room_price,
    'package_total', package_total,
    'grand_total', room_price + package_total,
    'nights', p_nights
  );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- 5. VERIFICAR RESULTADO
-- ═══════════════════════════════════════════════════════════════

SELECT 'VERIFICACIÓN FINAL:' as status;

SELECT 
  'products_modular' as tabla,
  COUNT(*) as registros
FROM products_modular
UNION ALL
SELECT 
  'packages_modular' as tabla,
  COUNT(*) as registros
FROM packages_modular
UNION ALL
SELECT 
  'package_products_modular' as tabla,
  COUNT(*) as registros
FROM package_products_modular
UNION ALL
SELECT 
  'age_pricing_modular' as tabla,
  COUNT(*) as registros
FROM age_pricing_modular;

-- PROBAR LA FUNCIÓN
SELECT 'PRUEBA DE FUNCIÓN:' as info;
SELECT calculate_package_price_modular('MEDIA_PENSION', 'habitacion_estandar', 2, ARRAY[8], 3) as resultado_prueba; 