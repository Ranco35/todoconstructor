-- ARREGLO SIMPLE Y DIRECTO DE AUTENTICACIÓN

-- 1. Crear roles básicos
INSERT INTO public."Role" (name) VALUES 
('SUPER_USER'),
('ADMINISTRADOR'), 
('JEFE_SECCION'),
('USUARIO_FINAL')
ON CONFLICT (name) DO NOTHING;

-- 2. Verificar que se crearon
SELECT 'ROLES CREADOS:' as info;
SELECT id, name FROM public."Role" ORDER BY name;

-- 3. Arreglar el usuario existente eduardo1@termasllifen.cl
DO $$
DECLARE
    user_id UUID := 'd1cda752-36f7-4a91-aafa-c6e41472a466';
    role_id INTEGER;
BEGIN
    -- Obtener ID del rol SUPER_USER o ADMINISTRADOR
    SELECT id INTO role_id FROM public."Role" WHERE name = 'SUPER_USER' LIMIT 1;
    IF role_id IS NULL THEN
        SELECT id INTO role_id FROM public."Role" WHERE name = 'ADMINISTRADOR' LIMIT 1;
    END IF;
    IF role_id IS NULL THEN
        role_id := 1; -- Fallback al primer rol
    END IF;
    
    -- Crear perfil en public.User
    INSERT INTO public."User" (
        id, 
        email, 
        "firstName", 
        "lastName", 
        "roleId", 
        "isActive", 
        "lastLogin"
    ) VALUES (
        user_id,
        'eduardo1@termasllifen.cl',
        'Eduardo',
        'Usuario',
        role_id,
        true,
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        "roleId" = role_id,
        "isActive" = true,
        "lastLogin" = NOW();
        
    RAISE NOTICE 'Usuario eduardo1@termasllifen.cl configurado con rol ID: %', role_id;
END $$;

-- 4. Verificar resultado
SELECT 'USUARIO ARREGLADO:' as info;
SELECT u.id, u.email, u."firstName", r.name as role_name
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u.email = 'eduardo1@termasllifen.cl'; 