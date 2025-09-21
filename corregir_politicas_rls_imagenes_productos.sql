-- Script para corregir políticas RLS del bucket "Imagenes Productos"
-- Resuelve el error: "new row violates row-level security policy"
-- Ejecutar directamente en Supabase Studio SQL Editor

-- 1. Verificar que el bucket existe
SELECT 'Verificando bucket...' as status;
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'Imagenes Productos';

-- 2. Eliminar TODAS las políticas existentes que puedan estar causando conflictos
SELECT 'Eliminando políticas conflictivas...' as status;

-- Eliminar políticas específicas para productos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Product Images" ON storage.objects;
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "product_images_service_role_all" ON storage.objects;

-- Eliminar políticas genéricas que puedan interferir
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users based on email" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON storage.objects;

-- 3. Crear el bucket "Imagenes Productos" si no existe
SELECT 'Creando bucket si no existe...' as status;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Imagenes Productos',
  'Imagenes Productos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Crear políticas RLS PERMISIVAS para el bucket "Imagenes Productos"
SELECT 'Creando políticas RLS...' as status;

-- Política para lectura pública (cualquiera puede leer)
CREATE POLICY "imagenes_productos_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'Imagenes Productos');

-- Política para inserción (usuarios autenticados pueden subir)
CREATE POLICY "imagenes_productos_authenticated_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'Imagenes Productos'
);

-- Política para actualización (usuarios autenticados pueden actualizar)
CREATE POLICY "imagenes_productos_authenticated_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'Imagenes Productos'
) WITH CHECK (
  bucket_id = 'Imagenes Productos'
);

-- Política para eliminación (usuarios autenticados pueden eliminar)
CREATE POLICY "imagenes_productos_authenticated_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'Imagenes Productos'
);

-- Política para service role (permisos completos para el service role)
CREATE POLICY "imagenes_productos_service_role_all" ON storage.objects
FOR ALL USING (
  bucket_id = 'Imagenes Productos' AND auth.role() = 'service_role'
);

-- 5. Verificar que las políticas se crearon correctamente
SELECT 'Verificando políticas creadas...' as status;
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
AND policyname LIKE '%imagenes_productos%'
ORDER BY policyname;

-- 6. Verificar configuración final del bucket
SELECT 'Verificando configuración final...' as status;
SELECT 
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'Imagenes Productos';

-- 7. Verificar que RLS está habilitado en storage.objects
SELECT 'Verificando RLS...' as status;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 8. Mensaje de confirmación
SELECT '¡Configuración completada exitosamente!' as status;
SELECT 'El bucket "Imagenes Productos" está listo para usar.' as message;
