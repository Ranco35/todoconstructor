-- Verificar estructura de la tabla Role
SELECT 'ESTRUCTURA TABLA ROLE:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Role' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de la tabla User
SELECT 'ESTRUCTURA TABLA USER:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar si existen datos en Role
SELECT 'ROLES EXISTENTES:' as info;
SELECT * FROM public."Role" ORDER BY id;

-- Verificar si existen datos en User
SELECT 'USUARIOS EXISTENTES:' as info;
SELECT * FROM public."User" ORDER BY email;

-- Verificar auth.users
SELECT 'AUTH USERS:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY email; 