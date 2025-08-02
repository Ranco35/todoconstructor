-- ================================================
-- AGREGAR CAMPOS DE SURCHARGE A RESERVATIONS
-- ================================================

-- Agregar campos de surcharge a la tabla reservations
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS surcharge_type VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS surcharge_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge_reason TEXT;

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_reservations_surcharge_type ON reservations(surcharge_type);
CREATE INDEX IF NOT EXISTS idx_reservations_surcharge_amount ON reservations(surcharge_amount);

-- Comentarios para documentación
COMMENT ON COLUMN reservations.surcharge_type IS 'Tipo de recargo: none, percentage, fixed_amount';
COMMENT ON COLUMN reservations.surcharge_value IS 'Valor del recargo (porcentaje o monto fijo)';
COMMENT ON COLUMN reservations.surcharge_amount IS 'Monto calculado del recargo';
COMMENT ON COLUMN reservations.surcharge_reason IS 'Razón del recargo aplicado'; 