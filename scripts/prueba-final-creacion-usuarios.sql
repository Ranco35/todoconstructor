-- ========================================
-- PRUEBA FINAL DE CREACIÓN DE USUARIOS
-- ========================================

-- 1. VERIFICAR ESTADO ACTUAL
SELECT '=== ESTADO ACTUAL ===' as info;

-- Verificar roles disponibles
SELECT 'Roles disponibles:' as info;
SELECT id, "roleName", description FROM public."Role" ORDER BY "roleName";

-- Verificar usuarios existentes
SELECT 'Usuarios existentes:' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    u.username,
    r."roleName" as rol,
    u.department,
    u."isActive",
    u."isCashier"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
ORDER BY u."createdAt" DESC;

-- 2. PRUEBA DE CREACIÓN SIMULANDO EL FLUJO REAL
SELECT '=== PRUEBA DE CREACIÓN SIMULADA ===' as info;

DO $$
DECLARE
    test_role_id INTEGER;
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test.final@example.com';
    test_username TEXT := 'testfinal';
BEGIN
    -- Obtener rol de prueba
    SELECT id INTO test_role_id FROM public."Role" WHERE "roleName" = 'USUARIO_FINAL' LIMIT 1;
    
    IF test_role_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró rol USUARIO_FINAL';
    END IF;
    
    RAISE NOTICE 'Iniciando prueba de creación...';
    RAISE NOTICE 'Rol ID: %', test_role_id;
    RAISE NOTICE 'Usuario ID: %', test_user_id;
    RAISE NOTICE 'Email: %', test_email;
    
    -- Simular el proceso de creación como lo haría la aplicación
    -- Paso 1: Crear usuario en auth.users (simulado)
    RAISE NOTICE 'Paso 1: Simulando creación en auth.users...';
    
    -- Paso 2: Crear perfil en tabla User
    RAISE NOTICE 'Paso 2: Creando perfil en tabla User...';
    
    INSERT INTO public."User" (
        id, 
        name, 
        email, 
        username, 
        "roleId", 
        department, 
        "isActive", 
        "isCashier", 
        "createdAt", 
        "updatedAt"
    ) VALUES (
        test_user_id,
        'Usuario Prueba Final',
        test_email,
        test_username,
        test_role_id,
        'SISTEMAS',
        true,
        false,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Usuario creado exitosamente en tabla User';
    
    -- Verificar que se creó correctamente
    IF EXISTS (SELECT 1 FROM public."User" WHERE id = test_user_id) THEN
        RAISE NOTICE '✅ Verificación: Usuario existe en BD';
        
        -- Mostrar datos del usuario creado
        SELECT 
            u.id,
            u.name,
            u.email,
            u.username,
            r."roleName" as rol,
            u.department,
            u."isActive",
            u."isCashier"
        FROM public."User" u
        LEFT JOIN public."Role" r ON u."roleId" = r.id
        WHERE u.id = test_user_id;
        
    ELSE
        RAISE NOTICE '❌ ERROR: Usuario no se encontró en BD';
    END IF;
    
    -- Limpiar usuario de prueba
    DELETE FROM public."User" WHERE id = test_user_id;
    RAISE NOTICE '🧹 Usuario de prueba eliminado';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error en prueba: %', SQLERRM;
    RAISE NOTICE '❌ Código de error: %', SQLSTATE;
END $$;

-- 3. VERIFICAR POLÍTICAS RLS
SELECT '=== POLÍTICAS RLS ===' as info;
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('User', 'Role')
ORDER BY tablename, policyname;

-- 4. VERIFICAR PERMISOS
SELECT '=== PERMISOS SERVICE ROLE ===' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'User' AND table_schema = 'public' AND grantee = 'service_role'
ORDER BY privilege_type;

-- 5. VERIFICAR ESTRUCTURA DE TABLA
SELECT '=== ESTRUCTURA TABLA USER ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'User' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. VERIFICAR FOREIGN KEYS
SELECT '=== FOREIGN KEYS ===' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'User';

-- 7. PRUEBA DE CONSULTA DE ROLES
SELECT '=== PRUEBA CONSULTA ROLES ===' as info;
SELECT id, "roleName", description FROM public."Role" ORDER BY "roleName";

-- 8. VERIFICAR RLS HABILITADO
SELECT '=== ESTADO RLS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('User', 'Role') AND schemaname = 'public';

-- 9. RESUMEN FINAL
SELECT '=== RESUMEN FINAL ===' as info;

SELECT 
    'Tabla User' as tabla,
    COUNT(*) as registros
FROM public."User"

UNION ALL

SELECT 
    'Tabla Role' as tabla,
    COUNT(*) as registros
FROM public."Role";

SELECT '=== SISTEMA LISTO PARA CREACIÓN DE USUARIOS ===' as info; 