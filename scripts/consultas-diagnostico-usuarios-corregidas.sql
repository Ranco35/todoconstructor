-- CONSULTAS CORREGIDAS PARA DIAGNÓSTICO DE USUARIOS

-- 1. Ver todos los roles disponibles
SELECT id, "roleName", description 
FROM public."Role" 
ORDER BY id;

-- 2. Ver todos los usuarios con sus roles (como hace getAllUsers)
SELECT 
    u.id,
    u.name,
    u.email,
    u."roleId",
    r."roleName" as role_name,
    u."isActive",
    u."lastLogin"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
ORDER BY u.name;

-- 3. Buscar específicamente eduardo@termasllifen.cl
SELECT 
    u.id,
    u.name,
    u.email,
    u."roleId",
    r."roleName" as role_name,
    u."isActive",
    u."isCashier"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u.email = 'eduardo@termasllifen.cl';

-- 4. Simulación exacta de getAllUsers() - VERSION SIMPLE
SELECT 
    u.id,
    u.name as username,
    u.email,
    CASE 
        WHEN r."roleName" IS NOT NULL THEN r."roleName"
        ELSE 'user'
    END as role,
    u."isActive"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
ORDER BY u.name;

-- 5. Ver usuarios sin rol asignado
SELECT 
    id,
    name,
    email,
    "roleId",
    "isActive"
FROM public."User"
WHERE "roleId" IS NULL AND "isActive" = true;

-- 6. Contar usuarios por rol
SELECT 
    COALESCE(r."roleName", 'SIN_ROL') as role_name,
    COUNT(*) as cantidad
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
GROUP BY r."roleName"
ORDER BY cantidad DESC;