-- ================================================
-- CREAR TABLA DE PAGOS DE RESERVAS (EJECUTAR DIRECTO)
-- ================================================

-- Tabla para almacenar el historial de todos los pagos/abonos de cada reserva
CREATE TABLE IF NOT EXISTS reservation_payments (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  -- Información del pago
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('abono', 'pago_total')),
  payment_method VARCHAR(50) NOT NULL,
  
  -- Información contextual
  previous_paid_amount DECIMAL(12,2) DEFAULT 0, -- Cuánto se había pagado antes
  new_total_paid DECIMAL(12,2) NOT NULL,        -- Cuánto se ha pagado después de este pago
  remaining_balance DECIMAL(12,2) NOT NULL,      -- Saldo pendiente después de este pago
  total_reservation_amount DECIMAL(12,2) NOT NULL, -- Total de la reserva en el momento del pago
  
  -- Metadatos
  reference_number VARCHAR(100),  -- Número de referencia (transferencia, cheque, etc.)
  notes TEXT,                     -- Observaciones del pago
  processed_by VARCHAR(100),      -- Quién procesó el pago
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_reservation_payments_reservation_id ON reservation_payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_payment_type ON reservation_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_payment_method ON reservation_payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_reservation_payments_created_at ON reservation_payments(created_at);

-- Trigger para updated_at (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_reservation_payments_updated_at') THEN
        CREATE TRIGGER update_reservation_payments_updated_at 
          BEFORE UPDATE ON reservation_payments
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- RLS Policies (solo si no existen)
ALTER TABLE reservation_payments ENABLE ROW LEVEL SECURITY;

-- Política para administradores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reservation_payments' 
        AND policyname = 'Administradores pueden ver todos los pagos'
    ) THEN
        CREATE POLICY "Administradores pueden ver todos los pagos" ON reservation_payments
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM users u 
              WHERE u.id = auth.uid() 
              AND u.roleid = 'ADMINISTRADOR'
            )
          );
    END IF;
END
$$;

-- Política para jefes de sección
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reservation_payments' 
        AND policyname = 'Jefes de sección pueden ver pagos'
    ) THEN
        CREATE POLICY "Jefes de sección pueden ver pagos" ON reservation_payments
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users u 
              WHERE u.id = auth.uid() 
              AND u.roleid = 'JEFE_SECCION'
            )
          );
    END IF;
END
$$;

-- Política para usuarios finales
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'reservation_payments' 
        AND policyname = 'Usuarios pueden ver pagos de sus reservas'
    ) THEN
        CREATE POLICY "Usuarios pueden ver pagos de sus reservas" ON reservation_payments
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users u 
              WHERE u.id = auth.uid() 
              AND u.roleid = 'USUARIO_FINAL'
            )
          );
    END IF;
END
$$;

-- Comentarios de la tabla
COMMENT ON TABLE reservation_payments IS 'Historial de todos los pagos y abonos realizados a las reservas';
COMMENT ON COLUMN reservation_payments.amount IS 'Monto de este pago específico';
COMMENT ON COLUMN reservation_payments.payment_type IS 'Tipo de pago: abono (pago parcial) o pago_total (pago completo)';
COMMENT ON COLUMN reservation_payments.payment_method IS 'Método de pago utilizado';
COMMENT ON COLUMN reservation_payments.previous_paid_amount IS 'Cuánto se había pagado antes de este pago';
COMMENT ON COLUMN reservation_payments.new_total_paid IS 'Total pagado después de incluir este pago';
COMMENT ON COLUMN reservation_payments.remaining_balance IS 'Saldo pendiente después de este pago';
COMMENT ON COLUMN reservation_payments.processed_by IS 'Usuario que procesó el pago';

-- Verificación de que la tabla se creó correctamente
SELECT 'Tabla reservation_payments creada exitosamente!' as resultado; 