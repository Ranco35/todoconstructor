-- VERIFICACIÓN COMPLETA DEL SISTEMA DE AUTENTICACIÓN

-- 1. Verificar todos los roles creados
SELECT 'TODOS LOS ROLES:' as info;
SELECT id, "roleName", description FROM public."Role" ORDER BY id;

-- 2. Verificar todos los usuarios en public.User
SELECT 'USUARIOS EN PUBLIC.USER:' as info;
SELECT u.id, u.name, u.email, r."roleName" as role_name, u."isActive"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
ORDER BY u.email;

-- 3. Verificar usuarios en auth.users
SELECT 'USUARIOS EN AUTH.USERS:' as info;
SELECT id, email, email_confirmed_at, created_at FROM auth.users ORDER BY email;

-- 4. Verificar si hay usuarios huérfanos (en auth.users pero no en public.User)
SELECT 'USUARIOS HUÉRFANOS (SI LOS HAY):' as info;
SELECT au.id, au.email, 'NECESITA PERFIL EN PUBLIC.USER' as status
FROM auth.users au 
LEFT JOIN public."User" pu ON au.id = pu.id 
WHERE pu.id IS NULL; 