-- Script simplificado para diagnosticar políticas RLS de Storage
-- Compatible con todas las versiones de PostgreSQL/Supabase
-- Ejecutar en Supabase Studio SQL Editor

-- 1. Verificar que el bucket "Imagenes Productos" existe
SELECT '=== VERIFICANDO BUCKET ===' as info;
SELECT 
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE name = 'Imagenes Productos';

-- 2. Verificar todas las políticas existentes en storage.objects
SELECT '=== POLÍTICAS EXISTENTES ===' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    CASE 
        WHEN cmd = 'INSERT' THEN with_check
        WHEN cmd = 'SELECT' THEN qual
        WHEN cmd = 'UPDATE' THEN qual
        WHEN cmd = 'DELETE' THEN qual
        ELSE 'ALL'
    END as policy_condition
FROM pg_policies 
WHERE tablename = 'objects'
ORDER BY policyname;

-- 3. Verificar políticas específicas para productos
SELECT '=== POLÍTICAS PARA PRODUCTOS ===' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    CASE 
        WHEN cmd = 'INSERT' THEN with_check
        WHEN cmd = 'SELECT' THEN qual
        WHEN cmd = 'UPDATE' THEN qual
        WHEN cmd = 'DELETE' THEN qual
        ELSE 'ALL'
    END as policy_condition
FROM pg_policies 
WHERE tablename = 'objects' 
AND (
    policyname LIKE '%product%' 
    OR qual LIKE '%Imagenes Productos%' 
    OR with_check LIKE '%Imagenes Productos%'
    OR policyname LIKE '%imagenes_productos%'
)
ORDER BY policyname;

-- 4. Verificar si RLS está habilitado
SELECT '=== ESTADO DE RLS ===' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 5. Verificar roles de usuario
SELECT '=== ROLES DE USUARIO ===' as info;
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'service_role');

-- 6. Verificar usuario actual
SELECT '=== USUARIO ACTUAL ===' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email;

-- 7. Contar políticas por comando
SELECT '=== RESUMEN DE POLÍTICAS ===' as info;
SELECT 
    cmd,
    COUNT(*) as cantidad_politicas
FROM pg_policies 
WHERE tablename = 'objects'
GROUP BY cmd
ORDER BY cmd;
