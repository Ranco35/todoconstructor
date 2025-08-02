-- CONSULTAS DE DIAGNÓSTICO PARA USUARIOS
-- Pega estas consultas una por una en el SQL Editor de Supabase

-- 1. Ver todos los roles disponibles
SELECT 'ROLES DISPONIBLES:' as tipo;
SELECT id, "roleName", description, "createdAt"
FROM public."Role" 
ORDER BY id;

-- 2. Ver todos los usuarios con sus roles (como hace getAllUsers)
SELECT 'USUARIOS CON ROLES (como getAllUsers):' as tipo;
SELECT 
    u.id,
    u.name,
    u.email,
    u."roleId",
    r."roleName" as role_name,
    u."isActive",
    u."lastLogin",
    u."createdAt"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
ORDER BY u.name;

-- 3. Buscar específicamente eduardo@termasllifen.cl
SELECT 'USUARIO EDUARDO ESPECÍFICO:' as tipo;
SELECT 
    u.id,
    u.name,
    u.username,
    u.email,
    u."roleId",
    r."roleName" as role_name,
    r.description as role_description,
    u.department,
    u."isActive",
    u."isCashier",
    u."lastLogin"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u.email = 'eduardo@termasllifen.cl';

-- 4. Ver usuarios sin rol asignado
SELECT 'USUARIOS SIN ROL:' as tipo;
SELECT 
    id,
    name,
    email,
    "roleId",
    "isActive"
FROM public."User"
WHERE "roleId" IS NULL AND "isActive" = true;

-- 5. Ver relaciones rotas (roleId que no existen)
SELECT 'RELACIONES ROTAS:' as tipo;
SELECT 
    u.id,
    u.name,
    u.email,
    u."roleId" as role_id_inexistente
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."roleId" IS NOT NULL AND r.id IS NULL;

-- 6. Contar usuarios por rol
SELECT 'CONTEO POR ROL:' as tipo;
SELECT 
    COALESCE(r."roleName", 'SIN_ROL') as role_name,
    COUNT(*) as cantidad
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
GROUP BY r."roleName"
ORDER BY cantidad DESC;

-- 7. Ver estructura de tabla User
SELECT 'ESTRUCTURA TABLA USER:' as tipo;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'User'
ORDER BY ordinal_position;

-- 8. Ver estructura de tabla Role
SELECT 'ESTRUCTURA TABLA ROLE:' as tipo;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Role'
ORDER BY ordinal_position;

-- 9. Simulación exacta de getAllUsers() con mapeo
SELECT 'SIMULACIÓN getAllUsers() - MAPEO COMPLETO:' as tipo;
SELECT 
    u.id,
    u.name as username,
    u.email,
    CASE 
        WHEN u.name IS NOT NULL THEN split_part(u.name, ' ', 1)
        ELSE u.name
    END as firstName,
    CASE 
        WHEN u.name IS NOT NULL AND array_length(string_to_array(u.name, ' '), 1) > 1 
        THEN array_to_string(string_to_array(u.name, ' ')[2:], ' ')
        ELSE ''
    END as lastName,
    CASE 
        WHEN r."roleName" IS NOT NULL THEN r."roleName"
        ELSE 'user'
    END as role,
    u.department,
    COALESCE(u."isCashier", false) as "isCashier",
    u."isActive",
    u."lastLogin"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
ORDER BY u.name;