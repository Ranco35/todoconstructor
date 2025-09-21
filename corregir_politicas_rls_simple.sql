-- Script simplificado para corregir políticas RLS del bucket "Imagenes Productos"
-- Compatible con todas las versiones de PostgreSQL/Supabase
-- Ejecutar directamente en Supabase Studio SQL Editor

-- 1. Verificar bucket actual
SELECT '=== VERIFICANDO BUCKET ACTUAL ===' as info;
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'Imagenes Productos';

-- 2. Eliminar políticas conflictivas existentes
SELECT '=== ELIMINANDO POLÍTICAS CONFLICTIVAS ===' as info;

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
DROP POLICY IF EXISTS "imagenes_productos_public_select" ON storage.objects;
DROP POLICY IF EXISTS "imagenes_productos_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "imagenes_productos_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "imagenes_productos_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "imagenes_productos_service_role_all" ON storage.objects;

-- 3. Crear bucket si no existe
SELECT '=== CREANDO BUCKET ===' as info;
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

-- 4. Crear políticas RLS específicas
SELECT '=== CREANDO POLÍTICAS RLS ===' as info;

-- Política para lectura pública
CREATE POLICY "imagenes_productos_public_select" ON storage.objects
FOR SELECT USING (bucket_id = 'Imagenes Productos');

-- Política para inserción
CREATE POLICY "imagenes_productos_authenticated_insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'Imagenes Productos');

-- Política para actualización
CREATE POLICY "imagenes_productos_authenticated_update" ON storage.objects
FOR UPDATE USING (bucket_id = 'Imagenes Productos')
WITH CHECK (bucket_id = 'Imagenes Productos');

-- Política para eliminación
CREATE POLICY "imagenes_productos_authenticated_delete" ON storage.objects
FOR DELETE USING (bucket_id = 'Imagenes Productos');

-- Política para service role
CREATE POLICY "imagenes_productos_service_role_all" ON storage.objects
FOR ALL USING (bucket_id = 'Imagenes Productos' AND auth.role() = 'service_role');

-- 5. Verificar políticas creadas
SELECT '=== VERIFICANDO POLÍTICAS CREADAS ===' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%imagenes_productos%'
ORDER BY policyname;

-- 6. Verificar configuración final del bucket
SELECT '=== CONFIGURACIÓN FINAL ===' as info;
SELECT 
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'Imagenes Productos';

-- 7. Mensaje de confirmación
SELECT '=== ¡CONFIGURACIÓN COMPLETADA! ===' as status;
SELECT 'El bucket "Imagenes Productos" está listo para usar.' as message;
