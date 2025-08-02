-- ARREGLO CORRECTO DE AUTENTICACIÓN CON ESTRUCTURA REAL

-- 1. Crear roles básicos usando la estructura correcta
INSERT INTO public."Role" ("roleName", "description", "createdAt", "updatedAt") VALUES 
('SUPER_USER', 'Super usuario con acceso completo', NOW(), NOW()),
('ADMINISTRADOR', 'Administrador del sistema', NOW(), NOW()), 
('JEFE_SECCION', 'Jefe de sección', NOW(), NOW()),
('USUARIO_FINAL', 'Usuario final básico', NOW(), NOW())
ON CONFLICT ("roleName") DO NOTHING;

-- 2. Verificar que se crearon
SELECT 'ROLES CREADOS:' as info;
SELECT id, "roleName", description FROM public."Role" ORDER BY "roleName";

-- 3. Arreglar el usuario existente eduardo1@termasllifen.cl
DO $$
DECLARE
    user_id UUID := 'd1cda752-36f7-4a91-aafa-c6e41472a466';
    role_id INTEGER;
BEGIN
    -- Obtener ID del rol SUPER_USER o ADMINISTRADOR
    SELECT id INTO role_id FROM public."Role" WHERE "roleName" = 'SUPER_USER' LIMIT 1;
    IF role_id IS NULL THEN
        SELECT id INTO role_id FROM public."Role" WHERE "roleName" = 'ADMINISTRADOR' LIMIT 1;
    END IF;
    IF role_id IS NULL THEN
        role_id := 1; -- Fallback al primer rol
    END IF;
    
    -- Crear perfil en public.User
    INSERT INTO public."User" (
        id, 
        name,
        email, 
        "roleId", 
        "isActive", 
        "lastLogin",
        "createdAt",
        "updatedAt"
    ) VALUES (
        user_id,
        'Eduardo Usuario',
        'eduardo1@termasllifen.cl',
        role_id,
        true,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        "roleId" = role_id,
        "isActive" = true,
        "lastLogin" = NOW(),
        "updatedAt" = NOW();
        
    RAISE NOTICE 'Usuario eduardo1@termasllifen.cl configurado con rol ID: %', role_id;
END $$;

-- 4. Verificar resultado
SELECT 'USUARIO ARREGLADO:' as info;
SELECT u.id, u.name, u.email, r."roleName" as role_name
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u.email = 'eduardo1@termasllifen.cl'; 