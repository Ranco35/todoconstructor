-- SCRIPT DE DIAGNÓSTICO - SOLO CONSULTAS, SIN CAMBIOS
-- Este script verifica el estado actual de usuarios y roles sin modificar nada

-- 1. Verificar estructura de tabla User
SELECT 'ESTRUCTURA DE TABLA USER:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'User'
ORDER BY ordinal_position;

-- 2. Verificar estructura de tabla Role
SELECT 'ESTRUCTURA DE TABLA ROLE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Role'
ORDER BY ordinal_position;

-- 3. Ver todos los roles disponibles
SELECT 'ROLES DISPONIBLES:' as info;
SELECT id, "roleName", description, "createdAt"
FROM public."Role" 
ORDER BY id;

-- 4. Ver el usuario eduardo@termasllifen.cl específicamente
SELECT 'USUARIO EDUARDO - ESTADO ACTUAL:' as info;
SELECT 
    u.id,
    u.name,
    u.username,
    u.email,
    u."roleId",
    r."roleName" as role_name,
    r.description as role_description,
    u.department,
    u."costCenterId",
    u."isActive",
    u."lastLogin",
    u."createdAt",
    u."updatedAt"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u.email ILIKE '%eduardo@termasllifen.cl%' OR u.email ILIKE '%eduardo%';

-- 5. Ver todos los usuarios activos con sus roles
SELECT 'TODOS LOS USUARIOS ACTIVOS:' as info;
SELECT 
    u.id,
    u.name,
    u.username,
    u.email,
    u."roleId",
    COALESCE(r."roleName", 'SIN_ROL_ASIGNADO') as role_name,
    u."isActive",
    u."lastLogin"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
ORDER BY u.name;

-- 6. Verificar si hay usuarios sin rol asignado
SELECT 'USUARIOS SIN ROL ASIGNADO:' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    u."roleId",
    u."isActive"
FROM public."User" u
WHERE u."roleId" IS NULL AND u."isActive" = true;

-- 7. Verificar relaciones rotas (roleId que no existen)
SELECT 'RELACIONES ROTAS (roleId inexistente):' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    u."roleId" as role_id_inexistente,
    u."isActive"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."roleId" IS NOT NULL AND r.id IS NULL;

-- 8. Contar usuarios por rol
SELECT 'CONTEO DE USUARIOS POR ROL:' as info;
SELECT 
    COALESCE(r."roleName", 'SIN_ROL') as role_name,
    COUNT(*) as cantidad_usuarios
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
GROUP BY r."roleName"
ORDER BY cantidad_usuarios DESC;

-- 9. Verificar configuración de auth.users (tabla de Supabase Auth)
SELECT 'USUARIOS EN AUTH.USERS:' as info;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users 
WHERE email ILIKE '%eduardo%' OR email ILIKE '%termas%'
ORDER BY created_at;

-- 10. Verificar conexión entre auth.users y public.User
SELECT 'CONEXIÓN AUTH.USERS <-> PUBLIC.USER:' as info;
SELECT 
    'En auth.users pero NO en public.User' as estado,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public."User" pu ON au.id = pu.id
WHERE pu.id IS NULL
UNION ALL
SELECT 
    'En public.User pero NO en auth.users' as estado,
    pu.id,
    pu.email,
    pu."createdAt"
FROM public."User" pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;