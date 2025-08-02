-- Crear tabla para registrar pagos múltiples
-- Esta tabla es opcional pero ayuda a mantener un registro de los pagos en lote

CREATE TABLE IF NOT EXISTS bulk_purchase_payments (
    id BIGSERIAL PRIMARY KEY,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    reference TEXT NOT NULL,
    notes TEXT,
    invoice_count INTEGER NOT NULL,
    invoice_ids INTEGER[] NOT NULL, -- Array de IDs de facturas
    processed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_bulk_purchase_payments_payment_date ON bulk_purchase_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_bulk_purchase_payments_payment_method ON bulk_purchase_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_bulk_purchase_payments_reference ON bulk_purchase_payments(reference);
CREATE INDEX IF NOT EXISTS idx_bulk_purchase_payments_processed_by ON bulk_purchase_payments(processed_by);

-- Comentarios para documentar la tabla
COMMENT ON TABLE bulk_purchase_payments IS 'Registro de pagos múltiples donde una sola transferencia cubre varias facturas';
COMMENT ON COLUMN bulk_purchase_payments.total_amount IS 'Monto total del pago que cubre todas las facturas';
COMMENT ON COLUMN bulk_purchase_payments.payment_method IS 'Método de pago utilizado (bank_transfer, etc.)';
COMMENT ON COLUMN bulk_purchase_payments.payment_date IS 'Fecha en que se realizó el pago';
COMMENT ON COLUMN bulk_purchase_payments.reference IS 'Referencia del pago (número de transferencia, etc.)';
COMMENT ON COLUMN bulk_purchase_payments.invoice_count IS 'Cantidad de facturas pagadas en este lote';
COMMENT ON COLUMN bulk_purchase_payments.invoice_ids IS 'Array de IDs de las facturas incluidas en este pago';
COMMENT ON COLUMN bulk_purchase_payments.processed_by IS 'Usuario que procesó el pago múltiple';