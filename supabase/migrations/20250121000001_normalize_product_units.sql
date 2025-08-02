-- Migración: Normalizar unidades de medida de productos existentes
-- Fecha: 2025-01-21
-- Descripción: Normaliza las unidades de medida de productos existentes al sistema estandarizado

-- ═══════════════════════════════════════════════════════════════
-- 1. CREAR TABLA DE MAPPING DE UNIDADES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS unit_mapping (
  id SERIAL PRIMARY KEY,
  old_unit TEXT NOT NULL,
  new_unit TEXT NOT NULL,
  conversion_factor DECIMAL(10,2) DEFAULT 1.0,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 2. INSERTAR MAPPINGS COMUNES
-- ═══════════════════════════════════════════════════════════════

INSERT INTO unit_mapping (old_unit, new_unit, conversion_factor, description) VALUES
-- Unidades básicas
('Pieza', 'UND', 1.0, 'Unidad individual'),
('Unidad', 'UND', 1.0, 'Unidad individual'),
('UND', 'UND', 1.0, 'Unidad individual'),
('PZA', 'UND', 1.0, 'Pieza -> Unidad'),
('PCS', 'UND', 1.0, 'Pieces -> Unidad'),

-- Unidades de peso
('Kg', 'KG', 1.0, 'Kilogramo'),
('KG', 'KG', 1.0, 'Kilogramo'),
('Kilogramo', 'KG', 1.0, 'Kilogramo'),
('Kilos', 'KG', 1.0, 'Kilos -> Kilogramo'),
('Gramo', 'GR', 1.0, 'Gramo'),
('GR', 'GR', 1.0, 'Gramo'),
('G', 'GR', 1.0, 'Gramo'),
('Onza', 'OZ', 1.0, 'Onza'),
('OZ', 'OZ', 1.0, 'Onza'),

-- Unidades de volumen
('Litro', 'LT', 1.0, 'Litro'),
('LT', 'LT', 1.0, 'Litro'),
('L', 'LT', 1.0, 'Litro'),
('Mililitro', 'ML', 1.0, 'Mililitro'),
('ML', 'ML', 1.0, 'Mililitro'),

-- Unidades de longitud
('Metro', 'MT', 1.0, 'Metro'),
('MT', 'MT', 1.0, 'Metro'),
('M', 'MT', 1.0, 'Metro'),
('Centímetro', 'CM', 1.0, 'Centímetro'),
('CM', 'CM', 1.0, 'Centímetro'),
('Milímetro', 'MM', 1.0, 'Milímetro'),
('MM', 'MM', 1.0, 'Milímetro'),

-- Unidades de empaque
('Caja', 'CAJ', 1.0, 'Caja'),
('CAJ', 'CAJ', 1.0, 'Caja'),
('Paquete', 'PAQ', 1.0, 'Paquete'),
('PAQ', 'PAQ', 1.0, 'Paquete'),
('Pack', 'PAQ', 1.0, 'Pack -> Paquete'),
('Bolsa', 'BOL', 1.0, 'Bolsa'),
('BOL', 'BOL', 1.0, 'Bolsa'),

-- Unidades de cantidad
('Docena', 'DOC', 1.0, 'Docena (12 unidades)'),
('DOC', 'DOC', 1.0, 'Docena'),
('Par', 'PAR', 1.0, 'Par (2 unidades)'),
('PAR', 'PAR', 1.0, 'Par'),
('Media Docena', 'MED', 1.0, 'Media Docena (6 unidades)'),
('MED', 'MED', 1.0, 'Media Docena'),
('Centena', 'CEN', 1.0, 'Centena (100 unidades)'),
('CEN', 'CEN', 1.0, 'Centena'),
('Millar', 'MIL', 1.0, 'Millar (1000 unidades)'),
('MIL', 'MIL', 1.0, 'Millar'),

-- Unidades de tiempo
('Hora', 'HRA', 1.0, 'Hora'),
('HRA', 'HRA', 1.0, 'Hora'),
('Día', 'DIA', 1.0, 'Día'),
('DIA', 'DIA', 1.0, 'Día'),
('Noche', 'NOC', 1.0, 'Noche'),
('NOC', 'NOC', 1.0, 'Noche'),

-- Unidades de servicio
('Servicio', 'SER', 1.0, 'Servicio'),
('SER', 'SER', 1.0, 'Servicio'),
('Sesión', 'SES', 1.0, 'Sesión'),
('SES', 'SES', 1.0, 'Sesión'),

-- Casos especiales
('', 'UND', 1.0, 'Campo vacío -> Unidad'),
(NULL, 'UND', 1.0, 'Campo nulo -> Unidad');

-- ═══════════════════════════════════════════════════════════════
-- 3. FUNCIÓN PARA NORMALIZAR UNIDADES
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION normalize_product_unit(old_unit TEXT)
RETURNS TEXT AS $$
DECLARE
  normalized_unit TEXT;
BEGIN
  -- Buscar en el mapping
  SELECT new_unit INTO normalized_unit
  FROM unit_mapping
  WHERE LOWER(TRIM(old_unit)) = LOWER(TRIM(um.old_unit))
  LIMIT 1;
  
  -- Si no se encuentra, usar UND por defecto
  IF normalized_unit IS NULL THEN
    normalized_unit := 'UND';
  END IF;
  
  RETURN normalized_unit;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- 4. ACTUALIZAR PRODUCTOS EXISTENTES
-- ═══════════════════════════════════════════════════════════════

-- Crear tabla temporal para el proceso de normalización
CREATE TEMP TABLE temp_product_units AS
SELECT 
  id,
  unit as old_unit,
  normalize_product_unit(unit) as new_unit
FROM "Product"
WHERE unit IS NOT NULL AND unit != '';

-- Mostrar resumen de cambios
SELECT 
  'Productos a normalizar' as accion,
  COUNT(*) as cantidad
FROM temp_product_units
WHERE old_unit != new_unit;

-- Actualizar productos con unidades normalizadas
UPDATE "Product" p
SET unit = tp.new_unit
FROM temp_product_units tp
WHERE p.id = tp.id AND tp.old_unit != tp.new_unit;

-- ═══════════════════════════════════════════════════════════════
-- 5. CREAR FUNCIÓN DE REPORTE
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION report_unit_normalization()
RETURNS TABLE(
  old_unit TEXT,
  new_unit TEXT,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.old_unit,
    tp.new_unit,
    COUNT(*) as product_count
  FROM temp_product_units tp
  WHERE tp.old_unit != tp.new_unit
  GROUP BY tp.old_unit, tp.new_unit
  ORDER BY product_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- 6. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_unit_mapping_old_unit ON unit_mapping(LOWER(old_unit));
CREATE INDEX IF NOT EXISTS idx_unit_mapping_new_unit ON unit_mapping(new_unit);

-- ═══════════════════════════════════════════════════════════════
-- 7. COMENTARIOS PARA DOCUMENTACIÓN
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE unit_mapping IS 'Tabla de mapeo para normalizar unidades de medida de productos';
COMMENT ON COLUMN unit_mapping.old_unit IS 'Unidad original del producto';
COMMENT ON COLUMN unit_mapping.new_unit IS 'Unidad normalizada estandarizada';
COMMENT ON COLUMN unit_mapping.conversion_factor IS 'Factor de conversión entre unidades';
COMMENT ON FUNCTION normalize_product_unit(TEXT) IS 'Función para normalizar unidades de medida de productos';
COMMENT ON FUNCTION report_unit_normalization() IS 'Función para generar reporte de normalización de unidades'; 