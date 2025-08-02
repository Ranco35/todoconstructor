-- Migración: Agrega campos de surcharge (recargo) a modular_reservations
-- Fecha: 2025-01-13
-- Descripción: Permite registrar recargos aplicados a las reservas modulares con tipo, valor y monto

ALTER TABLE modular_reservations
ADD COLUMN IF NOT EXISTS surcharge_type VARCHAR(20) DEFAULT 'none' CHECK (surcharge_type IN ('none', 'percentage', 'fixed_amount')),
ADD COLUMN IF NOT EXISTS surcharge_value NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS surcharge_reason TEXT;

-- Comentarios explicativos
COMMENT ON COLUMN modular_reservations.surcharge_type IS 'Tipo de recargo: none, percentage, fixed_amount';
COMMENT ON COLUMN modular_reservations.surcharge_value IS 'Valor del recargo (porcentaje o monto)';
COMMENT ON COLUMN modular_reservations.surcharge_amount IS 'Monto final del recargo calculado';
COMMENT ON COLUMN modular_reservations.surcharge_reason IS 'Razón o justificación del recargo';

-- Índice para consultas de recargos
CREATE INDEX IF NOT EXISTS idx_modular_reservations_surcharge_type ON modular_reservations(surcharge_type) WHERE surcharge_type != 'none';

-- Actualizar reservas existentes (opcional)
UPDATE modular_reservations 
SET surcharge_type = 'none', 
    surcharge_value = 0, 
    surcharge_amount = 0 
WHERE surcharge_type IS NULL; 