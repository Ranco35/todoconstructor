-- ========================================
-- VERIFICACIÓN Y CREACIÓN DE TABLA USER
-- ========================================

-- 1. VERIFICAR SI EXISTE LA TABLA USER
SELECT '=== VERIFICACIÓN DE TABLA USER ===' as info;

SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'User'
) as tabla_user_existe;

-- 2. VERIFICAR TODAS LAS TABLAS EN PUBLIC
SELECT '=== TODAS LAS TABLAS EN PUBLIC ===' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. VERIFICAR SI EXISTE TABLA USER CON DIFERENTE NOMBRE
SELECT '=== BUSCAR TABLA USER ===' as info;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name ILIKE '%user%' OR table_name ILIKE '%profile%')
ORDER BY table_name;

-- 4. CREAR TABLA USER SI NO EXISTE
DO $$
BEGIN
    -- Verificar si existe la tabla User
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'User') THEN
        
        RAISE NOTICE 'Creando tabla User...';
        
        -- Crear tabla User
        CREATE TABLE public."User" (
            id UUID PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            username TEXT,
            "firstName" TEXT,
            "lastName" TEXT,
            "roleId" INTEGER REFERENCES public."Role"(id),
            department TEXT DEFAULT 'SISTEMAS',
            "isActive" BOOLEAN DEFAULT true,
            "isCashier" BOOLEAN DEFAULT false,
            "lastLogin" TIMESTAMP WITH TIME ZONE,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crear índices
        CREATE INDEX IF NOT EXISTS idx_user_email ON public."User"(email);
        CREATE INDEX IF NOT EXISTS idx_user_username ON public."User"(username);
        CREATE INDEX IF NOT EXISTS idx_user_role ON public."User"("roleId");
        CREATE INDEX IF NOT EXISTS idx_user_active ON public."User"("isActive");
        
        RAISE NOTICE 'Tabla User creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla User ya existe';
    END IF;
END $$;

-- 5. VERIFICAR ESTRUCTURA DE TABLA USER
SELECT '=== ESTRUCTURA DE TABLA USER ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
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

-- 7. VERIFICAR SI EXISTE TABLA ROLE
SELECT '=== VERIFICACIÓN DE TABLA ROLE ===' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Role'
) as tabla_role_existe;

-- 8. CREAR TABLA ROLE SI NO EXISTE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'Role') THEN
        
        RAISE NOTICE 'Creando tabla Role...';
        
        CREATE TABLE public."Role" (
            id SERIAL PRIMARY KEY,
            "roleName" TEXT UNIQUE NOT NULL,
            description TEXT,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insertar roles básicos
        INSERT INTO public."Role" ("roleName", description) VALUES 
        ('SUPER_USER', 'Super usuario con acceso completo al sistema'),
        ('ADMINISTRADOR', 'Administrador del sistema con permisos amplios'),
        ('JEFE_SECCION', 'Jefe de sección con permisos departamentales'),
        ('USUARIO_FINAL', 'Usuario final con permisos básicos');
        
        RAISE NOTICE 'Tabla Role creada con roles básicos';
    ELSE
        RAISE NOTICE 'Tabla Role ya existe';
    END IF;
END $$;

-- 9. VERIFICAR ROLES EXISTENTES
SELECT '=== ROLES EXISTENTES ===' as info;
SELECT id, "roleName", description FROM public."Role" ORDER BY "roleName";

-- 10. HABILITAR RLS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Role" ENABLE ROW LEVEL SECURITY;

-- 11. CREAR POLÍTICAS RLS
DO $$
BEGIN
    -- Políticas para tabla User
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can insert users') THEN
        CREATE POLICY "Service role can insert users" ON public."User"
        FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can update users') THEN
        CREATE POLICY "Service role can update users" ON public."User"
        FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Service role can delete users') THEN
        CREATE POLICY "Service role can delete users" ON public."User"
        FOR DELETE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'User' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public."User"
        FOR SELECT USING (auth.uid() = id);
    END IF;
    
    -- Políticas para tabla Role
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Role' AND policyname = 'Authenticated users can view roles') THEN
        CREATE POLICY "Authenticated users can view roles" ON public."Role"
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'Role' AND policyname = 'Service role can insert roles') THEN
        CREATE POLICY "Service role can insert roles" ON public."Role"
        FOR INSERT WITH CHECK (true);
    END IF;
    
    RAISE NOTICE 'Políticas RLS creadas';
END $$;

-- 12. OTORGAR PERMISOS
GRANT ALL PRIVILEGES ON public."User" TO service_role;
GRANT ALL PRIVILEGES ON public."Role" TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 13. PRUEBA DE CREACIÓN
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
    
    -- Insertar usuario de prueba
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
    
    RAISE NOTICE 'Usuario de prueba creado exitosamente: %', test_user_id;
    
    -- Limpiar usuario de prueba
    DELETE FROM public."User" WHERE id = test_user_id;
    RAISE NOTICE 'Usuario de prueba eliminado';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error en prueba: %', SQLERRM;
END $$;

-- 14. VERIFICACIÓN FINAL
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Mostrar tablas creadas
SELECT 'Tablas creadas:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('User', 'Role')
ORDER BY table_name;

-- Mostrar políticas RLS
SELECT 'Políticas RLS:' as info;
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('User', 'Role')
ORDER BY tablename, policyname;

SELECT '=== TABLA USER CORREGIDA ===' as info; 