-- SCRIPT DE VERIFICACIÓN: Usuarios y Roles Funcionando
-- Usa este script para verificar que el sistema de usuarios esté funcionando correctamente

-- 1. Verificar que existen roles
SELECT 'VERIFICACIÓN 1: ROLES EXISTENTES' as check_name;
SELECT 
    COUNT(*) as total_roles,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ OK'
        ELSE '❌ FALTAN ROLES'
    END as status
FROM public."Role";

-- Mostrar roles disponibles
SELECT id, "roleName", description FROM public."Role" ORDER BY id;

-- 2. Verificar que existen usuarios activos
SELECT 'VERIFICACIÓN 2: USUARIOS ACTIVOS' as check_name;
SELECT 
    COUNT(*) as total_usuarios_activos,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK'
        ELSE '❌ NO HAY USUARIOS ACTIVOS'
    END as status
FROM public."User" 
WHERE "isActive" = true;

-- 3. Verificar que usuarios tienen roles asignados
SELECT 'VERIFICACIÓN 3: USUARIOS CON ROLES' as check_name;
SELECT 
    COUNT(*) as usuarios_con_rol,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK'
        ELSE '❌ USUARIOS SIN ROL'
    END as status
FROM public."User" u
JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true;

-- 4. Simulación de getAllUsers() - debe retornar usuarios con roles
SELECT 'VERIFICACIÓN 4: SIMULACIÓN getAllUsers()' as check_name;
SELECT 
    u.id,
    u.name as username,
    u.email,
    CASE 
        WHEN r."roleName" IS NOT NULL THEN r."roleName"
        ELSE 'user'
    END as role,
    u."isActive",
    CASE 
        WHEN r."roleName" IS NOT NULL THEN '✅ ROL OK'
        ELSE '❌ SIN ROL'
    END as role_status
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."isActive" = true
ORDER BY u.name;

-- 5. Verificar eduardo@termasllifen.cl específicamente
SELECT 'VERIFICACIÓN 5: EDUARDO ADMINISTRADOR' as check_name;
SELECT 
    u.name,
    u.email,
    r."roleName" as role,
    CASE 
        WHEN r."roleName" = 'ADMINISTRADOR' THEN '✅ CORRECTO'
        WHEN r."roleName" IS NULL THEN '❌ SIN ROL'
        ELSE '⚠️ ROL DIFERENTE: ' || r."roleName"
    END as status
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u.email = 'eduardo@termasllifen.cl';

-- 6. Detectar problemas comunes
SELECT 'VERIFICACIÓN 6: PROBLEMAS COMUNES' as check_name;

-- Usuarios sin rol
SELECT 'Usuarios sin rol asignado:' as problema;
SELECT u.name, u.email, 'SIN_ROL' as issue
FROM public."User" u
WHERE u."roleId" IS NULL AND u."isActive" = true;

-- Roles huérfanos (roleId que no existe)
SELECT 'Usuarios con roleId inválido:' as problema;
SELECT u.name, u.email, u."roleId", 'ROL_INEXISTENTE' as issue
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
WHERE u."roleId" IS NOT NULL AND r.id IS NULL AND u."isActive" = true;

-- 7. Resumen final
SELECT 'RESUMEN FINAL' as check_name;
SELECT 
    (SELECT COUNT(*) FROM public."Role") as total_roles,
    (SELECT COUNT(*) FROM public."User" WHERE "isActive" = true) as usuarios_activos,
    (SELECT COUNT(*) FROM public."User" u JOIN public."Role" r ON u."roleId" = r.id WHERE u."isActive" = true) as usuarios_con_rol,
    CASE 
        WHEN (SELECT COUNT(*) FROM public."User" WHERE "isActive" = true) = 
             (SELECT COUNT(*) FROM public."User" u JOIN public."Role" r ON u."roleId" = r.id WHERE u."isActive" = true)
        THEN '✅ TODOS LOS USUARIOS TIENEN ROL'
        ELSE '❌ HAY USUARIOS SIN ROL'
    END as estado_sistema;

-- Si todo está ✅, las funciones getAllUsers() y getCurrentUser() deberían funcionar correctamente