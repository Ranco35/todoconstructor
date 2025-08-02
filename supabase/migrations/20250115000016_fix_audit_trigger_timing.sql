-- ================================================
-- CORRECCIÓN DEL TIMING DEL TRIGGER DE AUDITORÍA
-- ================================================

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS trigger_audit_reservations ON public.reservations;

-- Función actualizada para auditar cambios en reservas
CREATE OR REPLACE FUNCTION audit_reservations_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    field_record RECORD;
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- Obtener el usuario actual
    current_user_id := auth.uid();
    
    -- Si no hay usuario autenticado, usar el primer usuario disponible
    IF current_user_id IS NULL THEN
        SELECT id INTO current_user_id 
        FROM auth.users 
        LIMIT 1;
    END IF;
    
    -- Manejo de INSERT (creación) - Ahora en AFTER INSERT
    IF TG_OP = 'INSERT' THEN
        -- Registrar creación en audit log
        INSERT INTO public.reservation_audit_log (
            reservation_id, action_type, user_id, field_name, old_value, new_value
        ) VALUES (
            NEW.id, 'CREATE', current_user_id, NULL, NULL, 
            'Reserva creada: ' || NEW.guest_name || ' - ' || NEW.guest_email
        );
        
        RETURN NEW;
    END IF;
    
    -- Manejo de UPDATE (modificación) - Sigue en BEFORE UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Asegurar que updated_by esté actualizado
        NEW.updated_by := current_user_id;
        
        -- Verificar cada campo y registrar cambios
        -- guest_name
        IF OLD.guest_name IS DISTINCT FROM NEW.guest_name THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'guest_name', OLD.guest_name, NEW.guest_name
            );
        END IF;
        
        -- guest_email
        IF OLD.guest_email IS DISTINCT FROM NEW.guest_email THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'guest_email', OLD.guest_email, NEW.guest_email
            );
        END IF;
        
        -- guest_phone
        IF OLD.guest_phone IS DISTINCT FROM NEW.guest_phone THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'guest_phone', OLD.guest_phone, NEW.guest_phone
            );
        END IF;
        
        -- check_in
        IF OLD.check_in IS DISTINCT FROM NEW.check_in THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'check_in', OLD.check_in::TEXT, NEW.check_in::TEXT
            );
        END IF;
        
        -- check_out
        IF OLD.check_out IS DISTINCT FROM NEW.check_out THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'check_out', OLD.check_out::TEXT, NEW.check_out::TEXT
            );
        END IF;
        
        -- room_id
        IF OLD.room_id IS DISTINCT FROM NEW.room_id THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'room_id', OLD.room_id::TEXT, NEW.room_id::TEXT
            );
        END IF;
        
        -- status
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'status', OLD.status, NEW.status
            );
        END IF;
        
        -- total_amount
        IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'total_amount', OLD.total_amount::TEXT, NEW.total_amount::TEXT
            );
        END IF;
        
        -- paid_amount
        IF OLD.paid_amount IS DISTINCT FROM NEW.paid_amount THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'paid_amount', OLD.paid_amount::TEXT, NEW.paid_amount::TEXT
            );
        END IF;
        
        -- payment_status
        IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'payment_status', OLD.payment_status, NEW.payment_status
            );
        END IF;
        
        -- billing_name
        IF OLD.billing_name IS DISTINCT FROM NEW.billing_name THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'billing_name', OLD.billing_name, NEW.billing_name
            );
        END IF;
        
        -- billing_rut
        IF OLD.billing_rut IS DISTINCT FROM NEW.billing_rut THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'billing_rut', OLD.billing_rut, NEW.billing_rut
            );
        END IF;
        
        -- authorized_by
        IF OLD.authorized_by IS DISTINCT FROM NEW.authorized_by THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'authorized_by', OLD.authorized_by, NEW.authorized_by
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Manejo de DELETE (eliminación) - Sigue en BEFORE DELETE
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.reservation_audit_log (
            reservation_id, action_type, user_id, field_name, old_value, new_value
        ) VALUES (
            OLD.id, 'DELETE', current_user_id, NULL, 
            'Reserva eliminada: ' || OLD.guest_name || ' - ' || OLD.guest_email, NULL
        );
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear triggers separados para cada operación
-- AFTER INSERT para las creaciones
CREATE TRIGGER trigger_audit_reservations_insert
    AFTER INSERT ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION audit_reservations_changes();

-- BEFORE UPDATE para las modificaciones (para actualizar updated_by)
CREATE TRIGGER trigger_audit_reservations_update
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION audit_reservations_changes();

-- BEFORE DELETE para las eliminaciones
CREATE TRIGGER trigger_audit_reservations_delete
    BEFORE DELETE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION audit_reservations_changes();

-- Comentario sobre el trigger
COMMENT ON FUNCTION audit_reservations_changes() IS 'Función que audita automáticamente los cambios en la tabla reservations con timing correcto'; 