-- ================================================
-- AGREGAR CAMPOS DE TEMPORADA CONGELADA
-- A LA TABLA modular_reservations
-- ================================================

-- Agregar campos para almacenar información de temporada congelada
ALTER TABLE modular_reservations 
ADD COLUMN IF NOT EXISTS season_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS season_type VARCHAR(20), -- 'low', 'mid', 'high'
ADD COLUMN IF NOT EXISTS seasonal_multiplier DECIMAL(5,2) DEFAULT 0.00, -- Porcentaje aplicado
ADD COLUMN IF NOT EXISTS base_price DECIMAL(12,2) DEFAULT 0, -- Precio base antes de temporada
ADD COLUMN IF NOT EXISTS final_price DECIMAL(12,2) DEFAULT 0; -- Precio final con temporada aplicada

-- Índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_modular_reservations_season_type ON modular_reservations(season_type);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_season_name ON modular_reservations(season_name);

-- Comentarios para documentación
COMMENT ON COLUMN modular_reservations.season_name IS 'Nombre de la temporada al momento de crear la reserva (congelado)';
COMMENT ON COLUMN modular_reservations.season_type IS 'Tipo de temporada: low, mid, high (congelado)';
COMMENT ON COLUMN modular_reservations.seasonal_multiplier IS 'Porcentaje de ajuste de temporada aplicado (congelado)';
COMMENT ON COLUMN modular_reservations.base_price IS 'Precio base antes de aplicar temporada (congelado)';
COMMENT ON COLUMN modular_reservations.final_price IS 'Precio final con temporada aplicada (congelado)';

-- Verificar cambios
SELECT 'Campos de temporada agregados exitosamente a modular_reservations' as status; 