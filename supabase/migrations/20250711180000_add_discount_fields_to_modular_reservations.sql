-- Migración: Agrega campos de descuento a modular_reservations
ALTER TABLE modular_reservations
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_reason TEXT; 