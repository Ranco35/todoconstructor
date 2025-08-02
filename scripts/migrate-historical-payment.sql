-- ================================================
-- MIGRACIÓN DEL ABONO HISTÓRICO - RESERVA ID 26
-- ================================================
-- Este script migra el abono existente en la reserva 26 al sistema de historial

-- 1. Verificar los datos actuales de la reserva
SELECT 
    'DATOS ACTUALES DE LA RESERVA' as info,
    id,
    guest_name,
    total_amount,
    paid_amount,
    pending_amount,
    payment_status,
    created_at
FROM reservations 
WHERE id = 26;

-- 2. Verificar si ya existe algún pago en reservation_payments
SELECT 
    'PAGOS EXISTENTES EN RESERVATION_PAYMENTS' as info,
    COUNT(*) as total_pagos
FROM reservation_payments 
WHERE reservation_id = 26;

-- 3. Si no hay pagos en reservation_payments pero hay paid_amount > 0, crear el abono histórico
DO $$
DECLARE
    reservation_record RECORD;
    existing_payments_count INTEGER;
    historical_amount DECIMAL(12,2);
BEGIN
    -- Obtener datos de la reserva
    SELECT * INTO reservation_record
    FROM reservations 
    WHERE id = 26;
    
    -- Verificar si ya existen pagos
    SELECT COUNT(*) INTO existing_payments_count
    FROM reservation_payments 
    WHERE reservation_id = 26;
    
    -- Si no hay pagos registrados pero hay monto pagado, crear el abono histórico
    IF existing_payments_count = 0 AND reservation_record.paid_amount > 0 THEN
        historical_amount := reservation_record.paid_amount;
        
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
            26,
            historical_amount,
            CASE 
                WHEN historical_amount >= reservation_record.total_amount THEN 'pago_total'
                ELSE 'abono'
            END,
            'transferencia', -- método por defecto, ajustar si se conoce el real
            0, -- antes no había pagos
            historical_amount,
            GREATEST(0, reservation_record.total_amount - historical_amount),
            reservation_record.total_amount,
            'MIGRACION-HISTORICA',
            'Abono migrado desde sistema anterior - Migración automática del ' || CURRENT_DATE,
            'Sistema'
        );
        
        RAISE NOTICE '✅ Abono histórico creado: $% para la reserva %', 
            historical_amount, reservation_record.id;
    ELSE
        IF existing_payments_count > 0 THEN
            RAISE NOTICE '⚠️ Ya existen % pagos registrados para la reserva 26', existing_payments_count;
        ELSE
            RAISE NOTICE 'ℹ️ No hay monto pagado para migrar en la reserva 26';
        END IF;
    END IF;
END $$;

-- 4. Verificar el resultado después de la migración
SELECT 
    'RESULTADO DESPUÉS DE LA MIGRACIÓN' as info,
    id,
    guest_name,
    total_amount,
    paid_amount,
    pending_amount,
    payment_status
FROM reservations 
WHERE id = 26;

-- 5. Verificar el historial de pagos creado
SELECT 
    'HISTORIAL DE PAGOS CREADO' as info,
    id,
    amount,
    payment_type,
    payment_method,
    new_total_paid,
    remaining_balance,
    created_at,
    notes
FROM reservation_payments 
WHERE reservation_id = 26
ORDER BY created_at;

-- 6. Verificar que los montos coinciden
SELECT 
    'VERIFICACIÓN DE CONSISTENCIA' as info,
    r.id,
    r.paid_amount as paid_in_reservations,
    COALESCE(SUM(rp.amount), 0) as total_in_payments,
    CASE 
        WHEN r.paid_amount = COALESCE(SUM(rp.amount), 0) THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE'
    END as status
FROM reservations r
LEFT JOIN reservation_payments rp ON r.id = rp.reservation_id
WHERE r.id = 26
GROUP BY r.id, r.paid_amount; 