-- ================================================
-- FIX PARA FUNCIÓN DE AUDITORÍA - USUARIO NULL
-- ================================================

-- Crear usuario sistema si no existe
DO $$ 
BEGIN
    -- Intentar crear un usuario sistema para casos donde no hay usuario autenticado
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000001',
        'authenticated',
        'authenticated',
        'sistema@admintermas.com',
        '$2a$10$placeholder',
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"Sistema Auditoría"}',
        false,
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (email) DO NOTHING;
EXCEPTION
    WHEN others THEN
        -- Si no se puede crear en auth.users, continuar
        NULL;
END $$;

-- Actualizar función para manejar mejor los casos sin usuario
CREATE OR REPLACE FUNCTION audit_reservations_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    field_record RECORD;
    old_val TEXT;
    new_val TEXT;
    system_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Obtener el usuario actual
    current_user_id := auth.uid();
    
    -- Si no hay usuario autenticado, usar el usuario sistema
    IF current_user_id IS NULL THEN
        current_user_id := system_user_id;
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
        
        -- status
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'status', OLD.status, NEW.status
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
        
        -- check_in_date
        IF OLD.check_in_date IS DISTINCT FROM NEW.check_in_date THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'check_in_date', OLD.check_in_date::TEXT, NEW.check_in_date::TEXT
            );
        END IF;
        
        -- check_out_date
        IF OLD.check_out_date IS DISTINCT FROM NEW.check_out_date THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'check_out_date', OLD.check_out_date::TEXT, NEW.check_out_date::TEXT
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
        
        -- payment_method
        IF OLD.payment_method IS DISTINCT FROM NEW.payment_method THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'payment_method', OLD.payment_method, NEW.payment_method
            );
        END IF;
        
        -- comments
        IF OLD.comments IS DISTINCT FROM NEW.comments THEN
            INSERT INTO public.reservation_audit_log (
                reservation_id, action_type, user_id, field_name, old_value, new_value
            ) VALUES (
                NEW.id, 'UPDATE', current_user_id, 'comments', OLD.comments, NEW.comments
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que la función se actualizó correctamente
SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_name = 'audit_reservations_changes'; 