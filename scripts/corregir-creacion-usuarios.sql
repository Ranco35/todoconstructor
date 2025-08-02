-- ========================================
-- CORRECCIÓN DEL PROBLEMA DE CREACIÓN DE USUARIOS
-- ========================================

-- 1. VERIFICAR Y CREAR ROLES BÁSICOS
DO $$
BEGIN
    -- Insertar roles si no existen
    INSERT INTO public."Role" ("roleName", "description", "createdAt", "updatedAt") VALUES 
    ('SUPER_USER', 'Super usuario con acceso completo al sistema', NOW(), NOW()),
    ('ADMINISTRADOR', 'Administrador del sistema con permisos amplios', NOW(), NOW()),
    ('JEFE_SECCION', 'Jefe de sección con permisos departamentales', NOW(), NOW()),
    ('USUARIO_FINAL', 'Usuario final con permisos básicos', NOW(), NOW())
    ON CONFLICT ("roleName") DO NOTHING;
    
    RAISE NOTICE 'Roles verificados/creados exitosamente';
END $$;

-- 2. VERIFICAR ESTRUCTURA DE TABLA USER
-- Agregar columnas faltantes si no existen
DO $$
BEGIN
    -- Agregar columna isCashier si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'isCashier') THEN
        ALTER TABLE public."User" ADD COLUMN "isCashier" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Columna isCashier agregada';
    END IF;
    
    -- Agregar columna department si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'department') THEN
        ALTER TABLE public."User" ADD COLUMN "department" TEXT DEFAULT 'SISTEMAS';
        RAISE NOTICE 'Columna department agregada';
    END IF;
    
    -- Agregar columna username si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'username') THEN
        ALTER TABLE public."User" ADD COLUMN "username" TEXT;
        RAISE NOTICE 'Columna username agregada';
    END IF;
    
    -- Agregar columna createdAt si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'createdAt') THEN
        ALTER TABLE public."User" ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna createdAt agregada';
    END IF;
    
    -- Agregar columna updatedAt si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'updatedAt') THEN
        ALTER TABLE public."User" ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna updatedAt agregada';
    END IF;
    
    RAISE NOTICE 'Estructura de tabla User verificada';
END $$;

-- 3. VERIFICAR POLÍTICAS RLS PARA TABLA USER
-- Crear políticas si no existen
DO $$
BEGIN
    -- Política para permitir lectura a usuarios autenticados
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public."User"
        FOR SELECT USING (auth.uid() = id);
        RAISE NOTICE 'Política de lectura creada';
    END IF;
    
    -- Política para permitir inserción con service role
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can insert users') THEN
        CREATE POLICY "Service role can insert users" ON public."User"
        FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Política de inserción creada';
    END IF;
    
    -- Política para permitir actualización con service role
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can update users') THEN
        CREATE POLICY "Service role can update users" ON public."User"
        FOR UPDATE USING (true) WITH CHECK (true);
        RAISE NOTICE 'Política de actualización creada';
    END IF;
    
    -- Política para permitir eliminación con service role
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can delete users') THEN
        CREATE POLICY "Service role can delete users" ON public."User"
        FOR DELETE USING (true);
        RAISE NOTICE 'Política de eliminación creada';
    END IF;
    
    RAISE NOTICE 'Políticas RLS verificadas';
END $$;

-- 4. VERIFICAR POLÍTICAS RLS PARA TABLA ROLE
DO $$
BEGIN
    -- Política para permitir lectura de roles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Role' AND policyname = 'Authenticated users can view roles') THEN
        CREATE POLICY "Authenticated users can view roles" ON public."Role"
        FOR SELECT USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Política de lectura de roles creada';
    END IF;
    
    -- Política para permitir inserción de roles con service role
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Role' AND policyname = 'Service role can insert roles') THEN
        CREATE POLICY "Service role can insert roles" ON public."Role"
        FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Política de inserción de roles creada';
    END IF;
    
    RAISE NOTICE 'Políticas RLS de roles verificadas';
END $$;

-- 5. HABILITAR RLS EN TABLAS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR USUARIOS EXISTENTES Y CORREGIR INCONSISTENCIAS
DO $$
DECLARE
    user_record RECORD;
    default_role_id INTEGER;
BEGIN
    -- Obtener ID del rol por defecto
    SELECT id INTO default_role_id FROM public."Role" WHERE "roleName" = 'USUARIO_FINAL' LIMIT 1;
    
    -- Corregir usuarios sin roleId
    UPDATE public."User" 
    SET "roleId" = default_role_id 
    WHERE "roleId" IS NULL;
    
    -- Corregir usuarios sin department
    UPDATE public."User" 
    SET "department" = 'SISTEMAS' 
    WHERE "department" IS NULL;
    
    -- Corregir usuarios sin isCashier
    UPDATE public."User" 
    SET "isCashier" = false 
    WHERE "isCashier" IS NULL;
    
    -- Corregir usuarios sin isActive
    UPDATE public."User" 
    SET "isActive" = true 
    WHERE "isActive" IS NULL;
    
    -- Corregir usuarios sin username
    FOR user_record IN SELECT id, email FROM public."User" WHERE username IS NULL OR username = ''
    LOOP
        UPDATE public."User" 
        SET username = user_record.email 
        WHERE id = user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Usuarios existentes corregidos';
END $$;

-- 7. VERIFICAR RESULTADO FINAL
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Mostrar roles disponibles
SELECT 'Roles disponibles:' as info;
SELECT id, "roleName", description FROM public."Role" ORDER BY "roleName";

-- Mostrar usuarios existentes
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

-- Mostrar políticas RLS
SELECT 'Políticas RLS:' as info;
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename IN ('User', 'Role')
ORDER BY tablename, policyname;

-- 8. SCRIPT DE PRUEBA DE CREACIÓN MANUAL
SELECT '=== PRUEBA DE CREACIÓN MANUAL ===' as info;

-- Crear un usuario de prueba manualmente
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
    
    -- Insertar usuario de prueba
    INSERT INTO public."User" (
        id, name, email, username, "roleId", department, "isActive", "isCashier", "createdAt", "updatedAt"
    ) VALUES (
        test_user_id,
        'Usuario Prueba Manual',
        'test.manual@example.com',
        'testmanual',
        test_role_id,
        'SISTEMAS',
        true,
        false,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Usuario de prueba creado exitosamente: %', test_user_id;
    
    -- Limpiar usuario de prueba
    DELETE FROM public."User" WHERE id = test_user_id;
    RAISE NOTICE 'Usuario de prueba eliminado';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error en prueba manual: %', SQLERRM;
END $$;

SELECT '=== CORRECCIÓN COMPLETADA ===' as info; 