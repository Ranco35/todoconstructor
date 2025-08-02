-- ========================================
-- DIAGNÓSTICO Y CORRECCIÓN DE CREACIÓN DE USUARIOS
-- ========================================

-- 1. VERIFICAR ESTRUCTURA DE TABLAS
SELECT '=== VERIFICACIÓN DE ESTRUCTURA ===' as info;

-- Verificar tabla Role
SELECT 'Tabla Role:' as tabla, 
       COUNT(*) as registros,
       STRING_AGG("roleName", ', ') as roles_existentes
FROM public."Role";

-- Verificar tabla User
SELECT 'Tabla User:' as tabla,
       COUNT(*) as registros,
       COUNT(CASE WHEN "isActive" = true THEN 1 END) as usuarios_activos
FROM public."User";

-- Verificar columnas de tabla User
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'User' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR ROLES FALTANTES Y CREARLOS
SELECT '=== CREANDO ROLES FALTANTES ===' as info;

INSERT INTO public."Role" ("roleName", "description", "createdAt", "updatedAt") VALUES 
('SUPER_USER', 'Super usuario con acceso completo al sistema', NOW(), NOW()),
('ADMINISTRADOR', 'Administrador del sistema con permisos amplios', NOW(), NOW()),
('JEFE_SECCION', 'Jefe de sección con permisos departamentales', NOW(), NOW()),
('USUARIO_FINAL', 'Usuario final con permisos básicos', NOW(), NOW())
ON CONFLICT ("roleName") DO NOTHING;

-- 3. VERIFICAR QUE SE CREARON LOS ROLES
SELECT '=== ROLES DISPONIBLES ===' as info;
SELECT id, "roleName", description, "createdAt"
FROM public."Role" 
ORDER BY "roleName";

-- 4. VERIFICAR USUARIOS EN AUTH.USERS
SELECT '=== USUARIOS EN AUTH.USERS ===' as info;
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC;

-- 5. VERIFICAR USUARIOS EN TABLA USER
SELECT '=== USUARIOS EN TABLA USER ===' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    u.username,
    r."roleName" as rol,
    u.department,
    u."isActive",
    u."isCashier",
    u."createdAt"
FROM public."User" u
LEFT JOIN public."Role" r ON u."roleId" = r.id
ORDER BY u."createdAt" DESC;

-- 6. VERIFICAR INCONSISTENCIAS ENTRE AUTH.USERS Y USER
SELECT '=== INCONSISTENCIAS ENTRE AUTH Y USER ===' as info;
SELECT 
    'Usuario en auth.users pero no en User' as tipo,
    au.id,
    au.email
FROM auth.users au
LEFT JOIN public."User" u ON au.id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
    'Usuario en User pero no en auth.users' as tipo,
    u.id,
    u.email
FROM public."User" u
LEFT JOIN auth.users au ON u.id = au.id
WHERE au.id IS NULL;

-- 7. VERIFICAR POLÍTICAS RLS
SELECT '=== POLÍTICAS RLS ===' as info;
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

-- 8. SCRIPT DE LIMPIEZA Y CORRECCIÓN
SELECT '=== SCRIPT DE CORRECCIÓN ===' as info;

-- Crear función para limpiar usuarios huérfanos
CREATE OR REPLACE FUNCTION cleanup_orphan_users()
RETURNS void AS $$
DECLARE
    orphan_user RECORD;
BEGIN
    -- Eliminar usuarios en User que no existen en auth.users
    FOR orphan_user IN 
        SELECT u.id, u.email 
        FROM public."User" u
        LEFT JOIN auth.users au ON u.id = au.id
        WHERE au.id IS NULL
    LOOP
        RAISE NOTICE 'Eliminando usuario huérfano: % (%)', orphan_user.email, orphan_user.id;
        DELETE FROM public."User" WHERE id = orphan_user.id;
    END LOOP;
    
    RAISE NOTICE 'Limpieza completada';
END;
$$ LANGUAGE plpgsql;

-- 9. VERIFICAR CONFIGURACIÓN DE SERVICE ROLE
SELECT '=== CONFIGURACIÓN SERVICE ROLE ===' as info;
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname LIKE '%service%' OR rolname LIKE '%anon%';

-- 10. SCRIPT DE PRUEBA DE CREACIÓN
SELECT '=== SCRIPT DE PRUEBA ===' as info;

-- Crear función de prueba
CREATE OR REPLACE FUNCTION test_user_creation()
RETURNS TABLE(result text, details text) AS $$
DECLARE
    test_role_id INTEGER;
    test_user_id UUID;
BEGIN
    -- Obtener rol de prueba
    SELECT id INTO test_role_id FROM public."Role" WHERE "roleName" = 'USUARIO_FINAL' LIMIT 1;
    
    IF test_role_id IS NULL THEN
        RETURN QUERY SELECT 'ERROR'::text, 'No se encontró rol USUARIO_FINAL'::text;
        RETURN;
    END IF;
    
    -- Generar ID de prueba
    test_user_id := gen_random_uuid();
    
    -- Intentar insertar usuario de prueba
    BEGIN
        INSERT INTO public."User" (
            id, name, email, username, "roleId", department, "isActive", "isCashier", "createdAt", "updatedAt"
        ) VALUES (
            test_user_id,
            'Usuario Prueba',
            'test@example.com',
            'testuser',
            test_role_id,
            'SISTEMAS',
            true,
            false,
            NOW(),
            NOW()
        );
        
        -- Limpiar usuario de prueba
        DELETE FROM public."User" WHERE id = test_user_id;
        
        RETURN QUERY SELECT 'SUCCESS'::text, 'Creación de usuario funciona correctamente'::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'ERROR'::text, SQLERRM::text;
    END;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar prueba
SELECT * FROM test_user_creation();

-- 11. LIMPIAR FUNCIONES DE PRUEBA
DROP FUNCTION IF EXISTS cleanup_orphan_users();
DROP FUNCTION IF EXISTS test_user_creation(); 