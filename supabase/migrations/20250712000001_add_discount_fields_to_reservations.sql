-- Agregar campos de descuento a tabla reservations
-- Fecha: 2025-01-12
-- Descripción: Permite registrar descuentos aplicados a las reservas con tipo, valor y monto

ALTER TABLE reservations 
ADD COLUMN discount_type VARCHAR(20) DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'fixed_amount')),
ADD COLUMN discount_value NUMERIC(10,2) DEFAULT 0,
ADD COLUMN discount_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN discount_reason TEXT;

-- Comentarios explicativos
COMMENT ON COLUMN reservations.discount_type IS 'Tipo de descuento: none, percentage, fixed_amount';
COMMENT ON COLUMN reservations.discount_value IS 'Valor del descuento (porcentaje o monto)';
COMMENT ON COLUMN reservations.discount_amount IS 'Monto final del descuento calculado';
COMMENT ON COLUMN reservations.discount_reason IS 'Razón o justificación del descuento';

-- Índice para consultas de descuentos
CREATE INDEX IF NOT EXISTS idx_reservations_discount_type ON reservations(discount_type) WHERE discount_type != 'none';

-- Actualizar reservas existentes (opcional)
UPDATE reservations 
SET discount_type = 'none', 
    discount_value = 0, 
    discount_amount = 0 
WHERE discount_type IS NULL; 