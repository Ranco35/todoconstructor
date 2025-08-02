-- Script para configurar políticas RLS del bucket product-images
-- Ejecutar directamente en Supabase Studio SQL Editor

-- 1. Crear bucket para productos si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Eliminar políticas existentes que puedan estar causando conflictos para product-images
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "product_images_service_role_all" ON storage.objects;

-- 3. Crear políticas específicas para el bucket product-images
-- Política para lectura pública
CREATE POLICY "product_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Política para inserción de usuarios autenticados
CREATE POLICY "product_images_authenticated_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Política para actualización de usuarios autenticados
CREATE POLICY "product_images_authenticated_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Política para eliminación de usuarios autenticados
CREATE POLICY "product_images_authenticated_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Política para service role (por si acaso)
CREATE POLICY "product_images_service_role_all" ON storage.objects
FOR ALL USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'service_role'
);

-- 4. Verificar que las políticas se crearon correctamente
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
  AND policyname LIKE '%product_images%'
ORDER BY policyname;

-- 5. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS para bucket product-images configuradas exitosamente';
  RAISE NOTICE 'Ahora se pueden subir imágenes de productos sin errores de seguridad';
END $$; 