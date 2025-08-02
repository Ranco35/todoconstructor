-- Primero, obtener el ID del rol SUPER_USER
DO $$
DECLARE
    super_user_role_id INTEGER;
    admin_role_id INTEGER;
    admin_auth_id UUID;
BEGIN
    -- Obtener IDs de roles
    SELECT id INTO super_user_role_id FROM public."Role" WHERE name = 'SUPER_USER';
    SELECT id INTO admin_role_id FROM public."Role" WHERE name = 'ADMINISTRADOR';
    
    -- Buscar si existe el usuario admin en auth.users
    SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'admin@admintermas.com';
    
    -- Si existe en auth.users pero no en public.User, crear el perfil
    IF admin_auth_id IS NOT NULL THEN
        INSERT INTO public."User" (id, email, "firstName", "lastName", "roleId", "isActive", "lastLogin")
        VALUES (
            admin_auth_id, 
            'admin@admintermas.com', 
            'Administrador', 
            'Sistema', 
            COALESCE(super_user_role_id, admin_role_id, 1),
            true, 
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            "roleId" = COALESCE(super_user_role_id, admin_role_id, 1),
            "isActive" = true,
            "lastLogin" = NOW();
            
        RAISE NOTICE 'Usuario admin actualizado/creado con ID: %', admin_auth_id;
    ELSE
        RAISE NOTICE 'No se encontró usuario admin@admintermas.com en auth.users';
    END IF;
    
    -- Verificar el usuario eduardo1@termasllifen.cl
    SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'eduardo1@termasllifen.cl';
    
    IF admin_auth_id IS NOT NULL THEN
        INSERT INTO public."User" (id, email, "firstName", "lastName", "roleId", "isActive", "lastLogin")
        VALUES (
            admin_auth_id, 
            'eduardo1@termasllifen.cl', 
            'Eduardo', 
            'Usuario', 
            COALESCE(super_user_role_id, admin_role_id, 1),
            true, 
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            "roleId" = COALESCE(super_user_role_id, admin_role_id, 1),
            "isActive" = true,
            "lastLogin" = NOW();
            
        RAISE NOTICE 'Usuario eduardo1@termasllifen.cl actualizado/creado con ID: %', admin_auth_id;
    ELSE
        RAISE NOTICE 'No se encontró usuario eduardo1@termasllifen.cl en auth.users';
    END IF;
END $$;

-- Verificar resultado
SELECT 'VERIFICACIÓN DE USUARIOS:' as info;
SELECT u.id, u.email, u."firstName", u."lastName", r.name as role_name
FROM public."User" u
JOIN public."Role" r ON u."roleId" = r.id
ORDER BY u.email; 