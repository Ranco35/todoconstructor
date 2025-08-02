-- Script para corregir políticas RLS del bucket client-images
-- Ejecutar directamente en Supabase Studio SQL Editor

-- 1. Eliminar todas las políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload client images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own client images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own client images" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir imágenes de clientes" ON storage.objects;
DROP POLICY IF EXISTS "Las imágenes de clientes son públicas para lectura" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar imágenes de clientes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar imágenes de clientes" ON storage.objects;
DROP POLICY IF EXISTS "client_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "client_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "client_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "client_images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "client_images_service_role_all" ON storage.objects;

-- 2. Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-images',
  'client-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 3. Crear políticas permisivas para el bucket client-images
-- Política para lectura pública
CREATE POLICY "client_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'client-images');

-- Política para inserción de usuarios autenticados
CREATE POLICY "client_images_authenticated_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'client-images' 
  AND auth.role() = 'authenticated'
);

-- Política para actualización de usuarios autenticados
CREATE POLICY "client_images_authenticated_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'client-images' 
  AND auth.role() = 'authenticated'
);

-- Política para eliminación de usuarios autenticados
CREATE POLICY "client_images_authenticated_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'client-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Crear políticas adicionales para service role
CREATE POLICY "client_images_service_role_all" ON storage.objects
FOR ALL USING (
  bucket_id = 'client-images' 
  AND auth.role() = 'service_role'
);

-- 5. Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%client_images%'
ORDER BY policyname;

-- 6. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS para bucket client-images configuradas exitosamente';
  RAISE NOTICE 'Ahora se pueden subir imágenes sin errores de seguridad';
END $$; 