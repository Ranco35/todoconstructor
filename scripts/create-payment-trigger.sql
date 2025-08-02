-- ================================================
-- TRIGGER PARA MANTENER SINCRONIZADOS LOS PAGOS
-- ================================================
-- Este trigger asegura que paid_amount, pending_amount y payment_status
-- en reservations siempre reflejen la suma real de los pagos en reservation_payments

-- Función que actualiza automáticamente los montos de la reserva
CREATE OR REPLACE FUNCTION update_reservation_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(12,2);
    reservation_total DECIMAL(12,2);
    new_pending_amount DECIMAL(12,2);
    new_payment_status VARCHAR(20);
BEGIN
    -- Obtener el total de la reserva
    SELECT total_amount INTO reservation_total
    FROM reservations
    WHERE id = COALESCE(NEW.reservation_id, OLD.reservation_id);
    
    -- Calcular el total pagado sumando todos los pagos de esta reserva
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM reservation_payments
    WHERE reservation_id = COALESCE(NEW.reservation_id, OLD.reservation_id);
    
    -- Calcular el saldo pendiente
    new_pending_amount := GREATEST(0, reservation_total - total_paid);
    
    -- Determinar el estado de pago
    IF total_paid >= reservation_total THEN
        new_payment_status := 'paid';
    ELSIF total_paid > 0 THEN
        new_payment_status := 'partial';
    ELSE
        new_payment_status := 'no_payment';
    END IF;
    
    -- Actualizar la reserva con los valores calculados
    UPDATE reservations
    SET 
        paid_amount = total_paid,
        pending_amount = new_pending_amount,
        payment_status = new_payment_status,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.reservation_id, OLD.reservation_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta después de INSERT, UPDATE o DELETE en reservation_payments
DROP TRIGGER IF EXISTS trigger_update_reservation_payment_totals ON reservation_payments;

CREATE TRIGGER trigger_update_reservation_payment_totals
    AFTER INSERT OR UPDATE OR DELETE ON reservation_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_reservation_payment_totals();

-- Comentarios para documentar el trigger
COMMENT ON FUNCTION update_reservation_payment_totals() IS 
'Función que mantiene automáticamente sincronizados los campos de pago en reservations basándose en la suma de reservation_payments';

COMMENT ON TRIGGER trigger_update_reservation_payment_totals ON reservation_payments IS 
'Trigger que ejecuta update_reservation_payment_totals() cada vez que se modifica reservation_payments para mantener la consistencia de datos';

-- ================================================
-- SCRIPT PARA MIGRAR EL ABONO HISTÓRICO
-- ================================================
-- Ejecutar este script para insertar el abono histórico de la reserva existente

-- Primero, verificar los datos actuales de la reserva
SELECT 
    id,
    guest_name,
    total_amount,
    paid_amount,
    pending_amount,
    payment_status
FROM reservations 
WHERE id = 26;

-- Insertar el abono histórico (ajustar los valores según los datos reales)
INSERT INTO reservation_payments (
    reservation_id,
    amount,
    payment_type,
    payment_method,
    previous_paid_amount,
    new_total_paid,
    remaining_balance,
    total_reservation_amount,
    reference_number,
    notes,
    processed_by
) VALUES (
    26, -- ID de la reserva
    100000, -- monto del abono (ajustar según paid_amount actual)
    'abono',
    'transferencia', -- método de pago
    0, -- antes no había pagos
    100000, -- total pagado después de este abono (ajustar según paid_amount actual)
    100000, -- saldo pendiente (ajustar según pending_amount actual)
    200000, -- total de la reserva (ajustar según total_amount actual)
    'TRX-ABONO-HISTORICO',
    'Abono migrado desde sistema anterior - Migración automática',
    'Sistema'
);

-- Verificar que el trigger actualizó correctamente la reserva
SELECT 
    id,
    guest_name,
    total_amount,
    paid_amount,
    pending_amount,
    payment_status
FROM reservations 
WHERE id = 26;

-- Verificar el historial de pagos
SELECT 
    id,
    amount,
    payment_type,
    payment_method,
    new_total_paid,
    remaining_balance,
    created_at
FROM reservation_payments 
WHERE reservation_id = 26
ORDER BY created_at; 