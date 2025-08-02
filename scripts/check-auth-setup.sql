-- Verificar roles existentes
SELECT 'ROLES EXISTENTES:' as info;
SELECT id, name, permissions FROM public."Role" ORDER BY name;

-- Verificar usuarios existentes
SELECT 'USUARIOS EXISTENTES:' as info;
SELECT id, email, "firstName", "lastName", "roleId" FROM public."User" ORDER BY email;

-- Verificar usuarios de auth.users
SELECT 'AUTH.USERS:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY email;

-- Verificar si hay usuarios huérfanos en auth.users que no están en public.User
SELECT 'USUARIOS SIN PERFIL EN PUBLIC.USER:' as info;
SELECT au.id, au.email, au.created_at 
FROM auth.users au 
LEFT JOIN public."User" pu ON au.id = pu.id 
WHERE pu.id IS NULL; 