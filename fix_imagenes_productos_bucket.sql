-- Script para configurar correctamente el bucket "Imagenes Productos"
-- Resuelve el error: "Bucket not found" al subir imágenes de productos
-- Ejecutar directamente en Supabase Studio SQL Editor

-- 1. Verificar que el bucket "Imagenes Productos" existe
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'Imagenes Productos';

-- 2. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Imagenes Productos',
  'Imagenes Productos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 3. Eliminar políticas existentes que puedan estar causando conflictos
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

-- 4. Crear políticas específicas para el bucket "Imagenes Productos"
-- Política para lectura pública
CREATE POLICY "imagenes_productos_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'Imagenes Productos');

-- Política para inserción de usuarios autenticados
CREATE POLICY "imagenes_productos_authenticated_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'Imagenes Productos' 
  AND auth.role() = 'authenticated'
);

-- Política para actualización de usuarios autenticados
CREATE POLICY "imagenes_productos_authenticated_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'Imagenes Productos' 
  AND auth.role() = 'authenticated'
);

-- Política para eliminación de usuarios autenticados
CREATE POLICY "imagenes_productos_authenticated_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'Imagenes Productos' 
  AND auth.role() = 'authenticated'
);

-- Política para service role (por si acaso)
CREATE POLICY "imagenes_productos_service_role_all" ON storage.objects
FOR ALL USING (
  bucket_id = 'Imagenes Productos' 
  AND auth.role() = 'service_role'
);

-- 5. Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%imagenes_productos%';

-- 6. Verificar que el bucket existe y está configurado correctamente
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'Imagenes Productos';

