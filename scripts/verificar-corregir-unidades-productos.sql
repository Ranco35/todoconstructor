-- ═══════════════════════════════════════════════════════════════
-- 🧮 SCRIPT: Verificar y Corregir Unidades de Medida de Productos
-- ═══════════════════════════════════════════════════════════════
-- Instrucciones: Ejecutar en Supabase Dashboard > SQL Editor
-- Propósito: Verificar y corregir unidades de medida de productos existentes

-- ═══════════════════════════════════════════════════════════════
-- 1. VERIFICAR ESTADO ACTUAL DE UNIDADES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'Estado actual de unidades' as seccion,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN unit IS NULL OR unit = '' THEN 1 END) as sin_unidad,
  COUNT(CASE WHEN unit IS NOT NULL AND unit != '' THEN 1 END) as con_unidad
FROM "Product";

-- ═══════════════════════════════════════════════════════════════
-- 2. MOSTRAR UNIDADES ÚNICAS ACTUALES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'Unidades únicas encontradas' as seccion,
  unit as unidad_actual,
  COUNT(*) as cantidad_productos
FROM "Product"
WHERE unit IS NOT NULL AND unit != ''
GROUP BY unit
ORDER BY cantidad_productos DESC;

-- ═══════════════════════════════════════════════════════════════
-- 3. APLICAR NORMALIZACIÓN (SI NO SE HA HECHO)
-- ═══════════════════════════════════════════════════════════════

-- Verificar si existe la tabla unit_mapping
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unit_mapping') THEN
    RAISE NOTICE 'Creando tabla unit_mapping...';
    
    -- Crear tabla de mapping
    CREATE TABLE unit_mapping (
      id SERIAL PRIMARY KEY,
      old_unit TEXT NOT NULL,
      new_unit TEXT NOT NULL,
      conversion_factor DECIMAL(10,2) DEFAULT 1.0,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Insertar mappings comunes
    INSERT INTO unit_mapping (old_unit, new_unit, conversion_factor, description) VALUES
    ('Pieza', 'UND', 1.0, 'Unidad individual'),
    ('Unidad', 'UND', 1.0, 'Unidad individual'),
    ('UND', 'UND', 1.0, 'Unidad individual'),
    ('Kg', 'KG', 1.0, 'Kilogramo'),
    ('KG', 'KG', 1.0, 'Kilogramo'),
    ('Kilogramo', 'KG', 1.0, 'Kilogramo'),
    ('Litro', 'LT', 1.0, 'Litro'),
    ('LT', 'LT', 1.0, 'Litro'),
    ('Metro', 'MT', 1.0, 'Metro'),
    ('MT', 'MT', 1.0, 'Metro'),
    ('Caja', 'CAJ', 1.0, 'Caja'),
    ('CAJ', 'CAJ', 1.0, 'Caja'),
    ('Paquete', 'PAQ', 1.0, 'Paquete'),
    ('PAQ', 'PAQ', 1.0, 'Paquete'),
    ('Docena', 'DOC', 1.0, 'Docena (12 unidades)'),
    ('DOC', 'DOC', 1.0, 'Docena'),
    ('Par', 'PAR', 1.0, 'Par (2 unidades)'),
    ('PAR', 'PAR', 1.0, 'Par'),
    ('Hora', 'HRA', 1.0, 'Hora'),
    ('HRA', 'HRA', 1.0, 'Hora'),
    ('Día', 'DIA', 1.0, 'Día'),
    ('DIA', 'DIA', 1.0, 'Día'),
    ('Noche', 'NOC', 1.0, 'Noche'),
    ('NOC', 'NOC', 1.0, 'Noche'),
    ('Servicio', 'SER', 1.0, 'Servicio'),
    ('SER', 'SER', 1.0, 'Servicio'),
    ('', 'UND', 1.0, 'Campo vacío -> Unidad'),
    (NULL, 'UND', 1.0, 'Campo nulo -> Unidad');
    
    RAISE NOTICE 'Tabla unit_mapping creada y poblada';
  ELSE
    RAISE NOTICE 'Tabla unit_mapping ya existe';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 4. FUNCIÓN DE NORMALIZACIÓN
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
-- 5. MOSTRAR CAMBIOS PROPUESTOS
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'Cambios propuestos' as seccion,
  p.unit as unidad_actual,
  normalize_product_unit(p.unit) as unidad_normalizada,
  COUNT(*) as cantidad_productos
FROM "Product" p
WHERE p.unit IS NOT NULL AND p.unit != ''
GROUP BY p.unit, normalize_product_unit(p.unit)
HAVING p.unit != normalize_product_unit(p.unit)
ORDER BY cantidad_productos DESC;

-- ═══════════════════════════════════════════════════════════════
-- 6. APLICAR NORMALIZACIÓN (DESCOMENTAR PARA EJECUTAR)
-- ═══════════════════════════════════════════════════════════════

/*
-- Actualizar productos con unidades normalizadas
UPDATE "Product" p
SET unit = normalize_product_unit(p.unit)
WHERE p.unit IS NOT NULL 
  AND p.unit != '' 
  AND p.unit != normalize_product_unit(p.unit);

-- Establecer UND para productos sin unidad
UPDATE "Product" p
SET unit = 'UND'
WHERE p.unit IS NULL OR p.unit = '';

RAISE NOTICE 'Normalización completada';
*/

-- ═══════════════════════════════════════════════════════════════
-- 7. VERIFICAR RESULTADO FINAL
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'Resultado final' as seccion,
  unit as unidad_final,
  COUNT(*) as cantidad_productos
FROM "Product"
WHERE unit IS NOT NULL AND unit != ''
GROUP BY unit
ORDER BY cantidad_productos DESC;

-- ═══════════════════════════════════════════════════════════════
-- 8. REPORTE DE PRODUCTOS CON UNIDADES ESPECIALES
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'Productos con unidades especiales' as seccion,
  id,
  name as nombre_producto,
  unit as unidad_actual,
  normalize_product_unit(unit) as unidad_normalizada
FROM "Product"
WHERE unit IS NOT NULL 
  AND unit != '' 
  AND unit NOT IN ('UND', 'KG', 'LT', 'MT', 'CAJ', 'PAQ', 'DOC', 'PAR', 'HRA', 'DIA', 'NOC', 'SER')
ORDER BY unit, name; 