-- =====================================================
-- SISTEMA DE CONFIGURACIÓN DE TEMPORADAS POR FECHAS
-- Hotel/Spa Admintermas
-- =====================================================

-- 1. TABLA DE CONFIGURACIÓN DE TEMPORADAS
CREATE TABLE IF NOT EXISTS season_configurations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,              -- Nombre de la temporada (ej: "Verano 2025", "Navidad", "Semana Santa")
  season_type VARCHAR(20) NOT NULL,        -- 'low', 'mid', 'high'
  start_date DATE NOT NULL,                -- Fecha de inicio
  end_date DATE NOT NULL,                  -- Fecha de fin
  discount_percentage DECIMAL(5,2) DEFAULT 0,  -- Porcentaje de descuento/aumento (ej: -20.00 para baja, 30.00 para alta)
  priority INTEGER DEFAULT 1,             -- Prioridad en caso de fechas superpuestas (mayor número = mayor prioridad)
  applies_to_rooms BOOLEAN DEFAULT true,   -- Si aplica a habitaciones
  applies_to_programs BOOLEAN DEFAULT true, -- Si aplica a programas de alojamiento
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by VARCHAR(255),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_season_type CHECK (season_type IN ('low', 'mid', 'high')),
  CONSTRAINT valid_percentage CHECK (discount_percentage >= -100 AND discount_percentage <= 200)
);

-- 2. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_season_configurations_dates 
ON season_configurations (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_season_configurations_active 
ON season_configurations (is_active);

CREATE INDEX IF NOT EXISTS idx_season_configurations_type 
ON season_configurations (season_type);

-- 3. FUNCIÓN PARA OBTENER LA TEMPORADA DE UNA FECHA
CREATE OR REPLACE FUNCTION get_season_for_date(check_date DATE)
RETURNS TABLE (
  id BIGINT,
  name VARCHAR(100),
  season_type VARCHAR(20),
  discount_percentage DECIMAL(5,2),
  applies_to_rooms BOOLEAN,
  applies_to_programs BOOLEAN
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.name,
    sc.season_type,
    sc.discount_percentage,
    sc.applies_to_rooms,
    sc.applies_to_programs
  FROM season_configurations sc
  WHERE check_date BETWEEN sc.start_date AND sc.end_date
    AND sc.is_active = true
  ORDER BY sc.priority DESC, sc.id DESC
  LIMIT 1;
END;
$$;

-- 4. FUNCIÓN PARA CALCULAR PRECIO CON TEMPORADA
CREATE OR REPLACE FUNCTION calculate_seasonal_price(
  base_price DECIMAL(10,2),
  check_date DATE,
  price_type VARCHAR(20) DEFAULT 'room' -- 'room' o 'program'
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  season_info RECORD;
  final_price DECIMAL(10,2);
BEGIN
  -- Obtener información de temporada para la fecha
  SELECT * INTO season_info FROM get_season_for_date(check_date);
  
  -- Si no hay configuración de temporada, retornar precio base
  IF season_info IS NULL THEN
    RETURN base_price;
  END IF;
  
  -- Verificar si la temporada aplica al tipo de precio
  IF price_type = 'room' AND NOT season_info.applies_to_rooms THEN
    RETURN base_price;
  END IF;
  
  IF price_type = 'program' AND NOT season_info.applies_to_programs THEN
    RETURN base_price;
  END IF;
  
  -- Calcular precio con descuento/aumento
  final_price := base_price * (1 + (season_info.discount_percentage / 100));
  
  -- Asegurar que el precio no sea negativo
  IF final_price < 0 THEN
    final_price := 0;
  END IF;
  
  RETURN final_price;
END;
$$;

-- 5. DATOS DE EJEMPLO PARA TEMPORADAS 2025
INSERT INTO season_configurations (name, season_type, start_date, end_date, discount_percentage, priority, created_by) VALUES
-- TEMPORADA ALTA (Verano)
('Verano 2025', 'high', '2025-01-01', '2025-03-31', 30.00, 3, 'sistema'),
('Semana Santa 2025', 'high', '2025-04-13', '2025-04-20', 35.00, 4, 'sistema'),
('Vacaciones de Invierno', 'high', '2025-07-15', '2025-08-15', 25.00, 3, 'sistema'),
('Fiestas Patrias', 'high', '2025-09-17', '2025-09-21', 40.00, 4, 'sistema'),
('Navidad y Año Nuevo', 'high', '2025-12-20', '2026-01-10', 45.00, 5, 'sistema'),

-- TEMPORADA MEDIA (Primavera/Otoño)
('Primavera 2025', 'mid', '2025-09-22', '2025-12-19', 0.00, 2, 'sistema'),
('Otoño 2025', 'mid', '2025-04-01', '2025-07-14', 0.00, 2, 'sistema'),

-- TEMPORADA BAJA (Invierno laboral)
('Invierno Laboral', 'low', '2025-04-21', '2025-07-14', -20.00, 1, 'sistema'),
('Post Verano', 'low', '2025-04-01', '2025-04-12', -15.00, 1, 'sistema');

-- 6. TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_season_configurations_updated_at
  BEFORE UPDATE ON season_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE season_configurations IS 'Configuración de temporadas hoteleras con fechas específicas y porcentajes de ajuste de precios';
COMMENT ON COLUMN season_configurations.season_type IS 'Tipo de temporada: low (baja), mid (media), high (alta)';
COMMENT ON COLUMN season_configurations.discount_percentage IS 'Porcentaje de ajuste: negativo para descuento, positivo para aumento';
COMMENT ON COLUMN season_configurations.priority IS 'Prioridad para resolver conflictos en fechas superpuestas';
COMMENT ON FUNCTION get_season_for_date(DATE) IS 'Obtiene la configuración de temporada activa para una fecha específica';
COMMENT ON FUNCTION calculate_seasonal_price(DECIMAL, DATE, VARCHAR) IS 'Calcula el precio con ajuste de temporada para una fecha dada';

-- 8. RLS POLICIES
ALTER TABLE season_configurations ENABLE ROW LEVEL SECURITY;

-- Política para lectura (todos los usuarios autenticados)
CREATE POLICY "season_configurations_select_policy" ON season_configurations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para insertar/actualizar/eliminar (todos los usuarios autenticados por ahora)
CREATE POLICY "season_configurations_write_policy" ON season_configurations
  FOR ALL USING (auth.role() = 'authenticated'); 