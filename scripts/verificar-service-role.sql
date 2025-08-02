-- ========================================
-- VERIFICACIÓN DE SERVICE ROLE Y PERMISOS
-- ========================================

-- 1. VERIFICAR ROLES DEL SISTEMA
SELECT '=== ROLES DEL SISTEMA ===' as info;
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolconnlimit
FROM pg_roles 
WHERE rolname IN ('postgres', 'anon', 'authenticated', 'service_role')
ORDER BY rolname;

-- 2. VERIFICAR PERMISOS EN TABLAS
SELECT '=== PERMISOS EN TABLA USER ===' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'User' AND table_schema = 'public'
ORDER BY grantee, privilege_type;

SELECT '=== PERMISOS EN TABLA ROLE ===' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'Role' AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 3. VERIFICAR POLÍTICAS RLS DETALLADAS
SELECT '=== POLÍTICAS RLS DETALLADAS ===' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('User', 'Role')
ORDER BY tablename, policyname;

-- 4. VERIFICAR SI RLS ESTÁ HABILITADO
SELECT '=== ESTADO RLS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('User', 'Role') AND schemaname = 'public';

-- 5. VERIFICAR CONFIGURACIÓN DE AUTH
SELECT '=== CONFIGURACIÓN AUTH ===' as info;
SELECT 
    name,
    setting,
    context
FROM pg_settings 
WHERE name LIKE '%auth%' OR name LIKE '%security%'
ORDER BY name;

-- 6. VERIFICAR FUNCIONES DE AUTH DISPONIBLES
SELECT '=== FUNCIONES AUTH ===' as info;
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname LIKE '%auth%' OR prosrc LIKE '%auth%'
LIMIT 10;

-- 7. VERIFICAR CONEXIONES ACTIVAS
SELECT '=== CONEXIONES ACTIVAS ===' as info;
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    state_change
FROM pg_stat_activity 
WHERE state = 'active'
ORDER BY query_start DESC;

-- 8. VERIFICAR LOCKED OBJECTS
SELECT '=== OBJETOS BLOQUEADOS ===' as info;
SELECT 
    l.pid,
    l.mode,
    l.granted,
    a.usename,
    a.application_name,
    a.query
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
WHERE NOT l.granted
ORDER BY l.pid;

-- 9. VERIFICAR CONFIGURACIÓN DE SUPABASE
SELECT '=== CONFIGURACIÓN SUPABASE ===' as info;

-- Verificar si existe el esquema auth
SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = 'auth'
) as auth_schema_exists;

-- Verificar tablas en esquema auth
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 10. VERIFICAR PERMISOS ESPECÍFICOS DEL SERVICE ROLE
SELECT '=== PERMISOS SERVICE ROLE ===' as info;

-- Verificar si service_role puede leer User
SELECT has_table_privilege('service_role', 'public.User', 'SELECT') as can_select_user;

-- Verificar si service_role puede insertar en User
SELECT has_table_privilege('service_role', 'public.User', 'INSERT') as can_insert_user;

-- Verificar si service_role puede actualizar User
SELECT has_table_privilege('service_role', 'public.User', 'UPDATE') as can_update_user;

-- Verificar si service_role puede eliminar de User
SELECT has_table_privilege('service_role', 'public.User', 'DELETE') as can_delete_user;

-- 11. VERIFICAR PERMISOS EN ROLE
SELECT '=== PERMISOS EN ROLE ===' as info;

-- Verificar si service_role puede leer Role
SELECT has_table_privilege('service_role', 'public.Role', 'SELECT') as can_select_role;

-- Verificar si service_role puede insertar en Role
SELECT has_table_privilege('service_role', 'public.Role', 'INSERT') as can_insert_role;

-- 12. SCRIPT DE CORRECCIÓN DE PERMISOS
SELECT '=== CORRECCIÓN DE PERMISOS ===' as info;

-- Otorgar permisos completos al service_role en User
GRANT ALL PRIVILEGES ON public."User" TO service_role;
GRANT ALL PRIVILEGES ON public."Role" TO service_role;

-- Otorgar permisos en secuencias si existen
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verificar permisos después de la corrección
SELECT '=== PERMISOS DESPUÉS DE CORRECCIÓN ===' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'User' AND table_schema = 'public' AND grantee = 'service_role'
ORDER BY privilege_type;

-- 13. VERIFICACIÓN FINAL
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Probar inserción directa con service_role
DO $$
DECLARE
    test_role_id INTEGER;
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Obtener rol de prueba
    SELECT id INTO test_role_id FROM public."Role" WHERE "roleName" = 'USUARIO_FINAL' LIMIT 1;
    
    IF test_role_id IS NULL THEN
        RAISE NOTICE 'No se encontró rol USUARIO_FINAL';
        RETURN;
    END IF;
    
    -- Intentar inserción directa
    BEGIN
        INSERT INTO public."User" (
            id, name, email, username, "roleId", department, "isActive", "isCashier", "createdAt", "updatedAt"
        ) VALUES (
            test_user_id,
            'Test Service Role',
            'test.service@example.com',
            'testservice',
            test_role_id,
            'SISTEMAS',
            true,
            false,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Inserción exitosa con service_role: %', test_user_id;
        
        -- Limpiar
        DELETE FROM public."User" WHERE id = test_user_id;
        RAISE NOTICE 'Usuario de prueba eliminado';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error en inserción con service_role: %', SQLERRM;
    END;
    
END $$;

SELECT '=== VERIFICACIÓN COMPLETADA ===' as info; 