-- ========================================
-- COMPLETAR CONFIGURACIÓN DE USUARIOS
-- ========================================

-- 1. VERIFICAR ESTRUCTURA ACTUAL
SELECT '=== ESTRUCTURA ACTUAL ===' as info;

-- Verificar tabla User
SELECT 'Tabla User:' as tabla,
       COUNT(*) as registros
FROM public."User";

-- Verificar tabla Role
SELECT 'Tabla Role:' as tabla,
       COUNT(*) as registros,
       STRING_AGG("roleName", ', ') as roles_existentes
FROM public."Role";

-- 2. VERIFICAR Y CREAR ROLES FALTANTES
SELECT '=== CREANDO ROLES FALTANTES ===' as info;

INSERT INTO public."Role" ("roleName", "description", "createdAt", "updatedAt") VALUES 
('SUPER_USER', 'Super usuario con acceso completo al sistema', NOW(), NOW()),
('ADMINISTRADOR', 'Administrador del sistema con permisos amplios', NOW(), NOW()),
('JEFE_SECCION', 'Jefe de sección con permisos departamentales', NOW(), NOW()),
('USUARIO_FINAL', 'Usuario final con permisos básicos', NOW(), NOW())
ON CONFLICT ("roleName") DO NOTHING;

-- 3. VERIFICAR ROLES DISPONIBLES
SELECT '=== ROLES DISPONIBLES ===' as info;
SELECT id, "roleName", description, "createdAt"
FROM public."Role" 
ORDER BY "roleName";

-- 4. VERIFICAR POLÍTICAS RLS EXISTENTES
SELECT '=== POLÍTICAS RLS EXISTENTES ===' as info;
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('User', 'Role')
ORDER BY tablename, policyname;

-- 5. CREAR POLÍTICAS RLS FALTANTES
SELECT '=== CREANDO POLÍTICAS RLS ===' as info;

DO $$
BEGIN
    -- Políticas para tabla User
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can insert users') THEN
        CREATE POLICY "Service role can insert users" ON public."User"
        FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Política de inserción para User creada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can update users') THEN
        CREATE POLICY "Service role can update users" ON public."User"
        FOR UPDATE USING (true) WITH CHECK (true);
        RAISE NOTICE 'Política de actualización para User creada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can delete users') THEN
        CREATE POLICY "Service role can delete users" ON public."User"
        FOR DELETE USING (true);
        RAISE NOTICE 'Política de eliminación para User creada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can select users') THEN
        CREATE POLICY "Service role can select users" ON public."User"
        FOR SELECT USING (true);
        RAISE NOTICE 'Política de selección para User creada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public."User"
        FOR SELECT USING (auth.uid() = id);
        RAISE NOTICE 'Política de perfil propio para User creada';
    END IF;
    
    -- Políticas para tabla Role
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Role' AND policyname = 'Authenticated users can view roles') THEN
        CREATE POLICY "Authenticated users can view roles" ON public."Role"
        FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Política de lectura para Role creada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Role' AND policyname = 'Service role can insert roles') THEN
        CREATE POLICY "Service role can insert roles" ON public."Role"
        FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Política de inserción para Role creada';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Role' AND policyname = 'Service role can select roles') THEN
        CREATE POLICY "Service role can select roles" ON public."Role"
        FOR SELECT USING (true);
        RAISE NOTICE 'Política de selección para Role creada';
    END IF;
    
    RAISE NOTICE 'Todas las políticas RLS verificadas/creadas';
END $$;

-- 6. HABILITAR RLS EN TABLAS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;

-- 7. OTORGAR PERMISOS AL SERVICE ROLE
SELECT '=== OTORGANDO PERMISOS ===' as info;

GRANT ALL PRIVILEGES ON public."User" TO service_role;
GRANT ALL PRIVILEGES ON public."Role" TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 8. VERIFICAR PERMISOS OTORGADOS
SELECT '=== PERMISOS VERIFICADOS ===' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'User' AND table_schema = 'public' AND grantee = 'service_role'
ORDER BY privilege_type;

-- 9. VERIFICAR USUARIOS EXISTENTES
SELECT '=== USUARIOS EXISTENTES ===' as info;
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

-- 10. PRUEBA DE CREACIÓN MANUAL
SELECT '=== PRUEBA DE CREACIÓN ===' as info;

DO $$
DECLARE
    test_role_id INTEGER;
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- Obtener rol de prueba
    SELECT id INTO test_role_id FROM public."Role" WHERE "roleName" = 'USUARIO_FINAL' LIMIT 1;
    
    IF test_role_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró rol USUARIO_FINAL';
    END IF;
    
    RAISE NOTICE 'Rol encontrado: %', test_role_id;
    
    -- Insertar usuario de prueba
    INSERT INTO public."User" (
        id, name, email, username, "roleId", department, "isActive", "isCashier", "createdAt", "updatedAt"
    ) VALUES (
        test_user_id,
        'Usuario Prueba Configuración',
        'test.config@example.com',
        'testconfig',
        test_role_id,
        'SISTEMAS',
        true,
        false,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Usuario de prueba creado exitosamente: %', test_user_id;
    
    -- Verificar que se creó
    IF EXISTS (SELECT 1 FROM public."User" WHERE id = test_user_id) THEN
        RAISE NOTICE 'Verificación: Usuario existe en BD';
    ELSE
        RAISE NOTICE 'ERROR: Usuario no se encontró en BD';
    END IF;
    
    -- Limpiar usuario de prueba
    DELETE FROM public."User" WHERE id = test_user_id;
    RAISE NOTICE 'Usuario de prueba eliminado';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error en prueba: %', SQLERRM;
    RAISE NOTICE 'Código de error: %', SQLSTATE;
END $$;

-- 11. VERIFICAR CONFIGURACIÓN DE AUTH
SELECT '=== VERIFICACIÓN AUTH ===' as info;

-- Verificar usuarios en auth.users
SELECT 
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 12. VERIFICACIÓN FINAL
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Mostrar políticas RLS finales
SELECT 'Políticas RLS finales:' as info;
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('User', 'Role')
ORDER BY tablename, policyname;

-- Mostrar permisos finales
SELECT 'Permisos finales:' as info;
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'User' AND table_schema = 'public' AND grantee = 'service_role'
ORDER BY privilege_type;

-- Mostrar roles disponibles
SELECT 'Roles disponibles:' as info;
SELECT id, "roleName", description FROM public."Role" ORDER BY "roleName";

SELECT '=== CONFIGURACIÓN COMPLETADA ===' as info; 