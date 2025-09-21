-- Script para diagnosticar políticas RLS de Storage
-- Ejecutar en Supabase Studio SQL Editor

-- 1. Verificar que el bucket "Imagenes Productos" existe
SELECT 
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types,
    created_at,
    updated_at
FROM storage.buckets 
WHERE name = 'Imagenes Productos';

-- 2. Verificar todas las políticas existentes en storage.objects
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
WHERE tablename = 'objects'
ORDER BY policyname;

-- 3. Verificar políticas específicas para el bucket "Imagenes Productos"
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND (qual LIKE '%Imagenes Productos%' OR with_check LIKE '%Imagenes Productos%' OR policyname LIKE '%product%');

-- 4. Verificar si hay políticas que puedan estar bloqueando
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
AND cmd IN ('INSERT', 'SELECT', 'UPDATE', 'DELETE', '*');

-- 5. Verificar el estado de RLS en la tabla objects
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 6. Verificar usuarios y roles actuales
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'service_role');

-- 7. Verificar la configuración de auth actual
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email;
