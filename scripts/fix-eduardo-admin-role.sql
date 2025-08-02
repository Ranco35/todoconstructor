-- Script para verificar y corregir el rol del usuario eduardo@termasllifen.cl
-- Este script garantiza que el usuario tenga el rol de ADMINISTRADOR

-- 1. Verificar estado actual del usuario
SELECT 'ESTADO ACTUAL DEL USUARIO:' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    u."roleId",
    r."roleName" as current_role,
    u."isActive",
    u."lastLogin"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u.email = 'eduardo@termasllifen.cl';

-- 2. Verificar roles disponibles
SELECT 'ROLES DISPONIBLES EN EL SISTEMA:' as info;
SELECT id, "roleName", description 
FROM public."Role" 
ORDER BY "roleName";

-- 3. Corregir el usuario eduardo@termasllifen.cl
DO $$
DECLARE
    admin_role_id INTEGER;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Verificar si el usuario existe
    SELECT EXISTS(
        SELECT 1 FROM public."User" 
        WHERE email = 'eduardo@termasllifen.cl'
    ) INTO user_exists;
    
    -- Obtener ID del rol ADMINISTRADOR
    SELECT id INTO admin_role_id 
    FROM public."Role" 
    WHERE "roleName" = 'ADMINISTRADOR' 
    LIMIT 1;
    
    -- Si no existe rol ADMINISTRADOR, crear uno
    IF admin_role_id IS NULL THEN
        INSERT INTO public."Role" ("roleName", "description", "createdAt", "updatedAt")
        VALUES ('ADMINISTRADOR', 'Administrador del sistema', NOW(), NOW())
        ON CONFLICT ("roleName") DO NOTHING
        RETURNING id INTO admin_role_id;
        
        -- Si aún es NULL, obtener el ID recién creado
        IF admin_role_id IS NULL THEN
            SELECT id INTO admin_role_id 
            FROM public."Role" 
            WHERE "roleName" = 'ADMINISTRADOR';
        END IF;
        
        RAISE NOTICE 'Rol ADMINISTRADOR creado con ID: %', admin_role_id;
    END IF;
    
    -- Actualizar el usuario si existe
    IF user_exists THEN
        UPDATE public."User" 
        SET 
            "roleId" = admin_role_id,
            "isActive" = true,
            "updatedAt" = NOW()
        WHERE email = 'eduardo@termasllifen.cl';
        
        RAISE NOTICE 'Usuario eduardo@termasllifen.cl actualizado con rol ADMINISTRADOR (ID: %)', admin_role_id;
    ELSE
        RAISE NOTICE 'ADVERTENCIA: Usuario eduardo@termasllifen.cl no encontrado en la tabla User';
    END IF;
END $$;

-- 4. Verificar resultado final
SELECT 'RESULTADO FINAL:' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    u."roleId",
    r."roleName" as role_name,
    u."isActive",
    u."lastLogin",
    u."updatedAt"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u.email = 'eduardo@termasllifen.cl';

-- 5. Verificar todos los usuarios activos con sus roles
SELECT 'TODOS LOS USUARIOS ACTIVOS:' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    COALESCE(r."roleName", 'SIN_ROL') as role_name,
    u."isActive"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
ORDER BY u.name;