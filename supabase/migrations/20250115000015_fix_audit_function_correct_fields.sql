-- ================================================
-- FIX FUNCIÓN DE AUDITORÍA - CAMPOS CORRECTOS
-- ================================================

-- Actualizar función con los nombres de campos correctos
CREATE OR REPLACE FUNCTION audit_reservations_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    system_user_id UUID;
BEGIN
    -- Obtener el usuario actual
    current_user_id := auth.uid();
    
    -- Si no hay usuario autenticado, intentar obtener el primer usuario del sistema
    IF current_user_id IS NULL THEN
        SELECT id INTO system_user_id 
        FROM auth.users 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        current_user_id := system_user_id;
    END IF;
    
    -- Si aún no hay usuario, crear un UUID fijo (esto no debería pasar en producción)
    IF current_user_id IS NULL THEN
        current_user_id := '00000000-0000-0000-0000-000000000000';
    END IF;
    
    -- Manejo de INSERT (creación)
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.reservation_audit_log (
            reservation_id, action_type, user_id, field_name, old_value, new_value
        ) VALUES (
            NEW.id, 'CREATE', current_user_id, NULL, NULL, 'Nueva reserva creada'
        );
        RETURN NEW;
    END IF;
    
    -- Manejo de DELETE (eliminación)
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.reservation_audit_log (
            reservation_id, action_type, user_id, field_name, old_value, new_value
        ) VALUES (
            OLD.id, 'DELETE', current_user_id, NULL, 'Reserva eliminada', NULL
        );
        RETURN OLD;
    END IF;
    
    -- Manejo de UPDATE (actualización)
    IF TG_OP = 'UPDATE' THEN
        -- Verificar cada campo para cambios
        
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
        
        -- guests
        IF OLD.guests IS DISTINCT FROM NEW.guests THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'guests', OLD.guests::TEXT, NEW.guests::TEXT
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
        
        -- client_type
        IF OLD.client_type IS DISTINCT FROM NEW.client_type THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'client_type', OLD.client_type, NEW.client_type
            );
        END IF;
        
        -- contact_id
        IF OLD.contact_id IS DISTINCT FROM NEW.contact_id THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'contact_id', OLD.contact_id::TEXT, NEW.contact_id::TEXT
            );
        END IF;
        
        -- company_id
        IF OLD.company_id IS DISTINCT FROM NEW.company_id THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'company_id', OLD.company_id::TEXT, NEW.company_id::TEXT
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
        
        -- billing_address
        IF OLD.billing_address IS DISTINCT FROM NEW.billing_address THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'billing_address', OLD.billing_address, NEW.billing_address
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
        
        -- deposit_amount
        IF OLD.deposit_amount IS DISTINCT FROM NEW.deposit_amount THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'deposit_amount', OLD.deposit_amount::TEXT, NEW.deposit_amount::TEXT
            );
        END IF;
        
        -- payment_method
        IF OLD.payment_method IS DISTINCT FROM NEW.payment_method THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'payment_method', OLD.payment_method, NEW.payment_method
            );
        END IF;
        
        -- discount_type
        IF OLD.discount_type IS DISTINCT FROM NEW.discount_type THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'discount_type', OLD.discount_type, NEW.discount_type
            );
        END IF;
        
        -- discount_value
        IF OLD.discount_value IS DISTINCT FROM NEW.discount_value THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'discount_value', OLD.discount_value::TEXT, NEW.discount_value::TEXT
            );
        END IF;
        
        -- discount_amount
        IF OLD.discount_amount IS DISTINCT FROM NEW.discount_amount THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'discount_amount', OLD.discount_amount::TEXT, NEW.discount_amount::TEXT
            );
        END IF;
        
        -- discount_reason
        IF OLD.discount_reason IS DISTINCT FROM NEW.discount_reason THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'discount_reason', OLD.discount_reason, NEW.discount_reason
            );
        END IF;
        
        -- surcharge_type
        IF OLD.surcharge_type IS DISTINCT FROM NEW.surcharge_type THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'surcharge_type', OLD.surcharge_type, NEW.surcharge_type
            );
        END IF;
        
        -- surcharge_value
        IF OLD.surcharge_value IS DISTINCT FROM NEW.surcharge_value THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'surcharge_value', OLD.surcharge_value::TEXT, NEW.surcharge_value::TEXT
            );
        END IF;
        
        -- surcharge_amount
        IF OLD.surcharge_amount IS DISTINCT FROM NEW.surcharge_amount THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'surcharge_amount', OLD.surcharge_amount::TEXT, NEW.surcharge_amount::TEXT
            );
        END IF;
        
        -- surcharge_reason
        IF OLD.surcharge_reason IS DISTINCT FROM NEW.surcharge_reason THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'surcharge_reason', OLD.surcharge_reason, NEW.surcharge_reason
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que la función se actualizó correctamente
SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_name = 'audit_reservations_changes'; 