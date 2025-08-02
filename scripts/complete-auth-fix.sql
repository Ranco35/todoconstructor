-- SCRIPT COMPLETO DE REPARACIÓN DE AUTENTICACIÓN
-- Este script soluciona los problemas de login identificados

-- 1. VERIFICAR Y CREAR ROLES FALTANTES
DO $$
BEGIN
    -- Insertar roles básicos si no existen
    INSERT INTO public."Role" (name) VALUES 
    ('SUPER_USER'),
    ('ADMINISTRADOR'), 
    ('JEFE_SECCION'),
    ('USUARIO_FINAL')
    ON CONFLICT (name) DO NOTHING;
    
    RAISE NOTICE 'Roles creados/verificados exitosamente';
END $$;

-- 2. CREAR USUARIO ADMIN SI NO EXISTE EN AUTH.USERS
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@admintermas.com',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
) ON CONFLICT (email) DO NOTHING;

-- 3. ARREGLAR USUARIOS EXISTENTES
DO $$
DECLARE
    user_auth_id UUID;
    admin_role_id INTEGER;
    super_user_role_id INTEGER;
BEGIN
    -- Obtener IDs de roles
    SELECT id INTO admin_role_id FROM public."Role" WHERE name = 'ADMINISTRADOR';
    SELECT id INTO super_user_role_id FROM public."Role" WHERE name = 'SUPER_USER';
    
    -- Buscar el usuario eduardo1@termasllifen.cl en auth.users
    SELECT id INTO user_auth_id FROM auth.users WHERE email = 'eduardo1@termasllifen.cl';
    
    IF user_auth_id IS NOT NULL THEN
        -- Crear/actualizar perfil en public.User
        INSERT INTO public."User" (
            id, 
            email, 
            "firstName", 
            "lastName", 
            "roleId", 
            "isActive", 
            "lastLogin"
        ) VALUES (
            user_auth_id,
            'eduardo1@termasllifen.cl',
            'Eduardo',
            'Usuario',
            COALESCE(super_user_role_id, admin_role_id, 1),
            true,
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            "roleId" = COALESCE(super_user_role_id, admin_role_id, 1),
            "isActive" = true,
            "lastLogin" = NOW();
        
        RAISE NOTICE 'Usuario eduardo1@termasllifen.cl reparado con ID: %', user_auth_id;
    END IF;
    
    -- Buscar el usuario admin@admintermas.com en auth.users
    SELECT id INTO user_auth_id FROM auth.users WHERE email = 'admin@admintermas.com';
    
    IF user_auth_id IS NOT NULL THEN
        -- Crear/actualizar perfil en public.User
        INSERT INTO public."User" (
            id, 
            email, 
            "firstName", 
            "lastName", 
            "roleId", 
            "isActive", 
            "lastLogin"
        ) VALUES (
            user_auth_id,
            'admin@admintermas.com',
            'Administrador',
            'Sistema',
            COALESCE(super_user_role_id, admin_role_id, 1),
            true,
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            "roleId" = COALESCE(super_user_role_id, admin_role_id, 1),
            "isActive" = true,
            "lastLogin" = NOW();
        
        RAISE NOTICE 'Usuario admin@admintermas.com reparado con ID: %', user_auth_id;
    END IF;
END $$;

-- 4. VERIFICAR RESULTADO FINAL
SELECT 'VERIFICACIÓN FINAL - ROLES:' as info;
SELECT id, name FROM public."Role" ORDER BY id;

SELECT 'VERIFICACIÓN FINAL - USUARIOS:' as info;
SELECT u.id, u.email, u."firstName", u."lastName", r.name as role_name
FROM public."User" u
JOIN public."Role" r ON u."roleId" = r.id
ORDER BY u.email;

SELECT 'VERIFICACIÓN FINAL - AUTH USERS:' as info;
SELECT id, email FROM auth.users ORDER BY email; 