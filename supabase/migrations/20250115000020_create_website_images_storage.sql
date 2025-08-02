-- Migración para configurar Storage de imágenes del website
-- Esta migración configura el bucket y las políticas de seguridad para las imágenes del website

-- 1. Crear bucket para imágenes del website (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-images',
  'website-images',
  true,
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Eliminar políticas existentes si existen para evitar conflictos
DROP POLICY IF EXISTS "website_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "website_images_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "website_images_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "website_images_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "website_images_service_role_all" ON storage.objects;

-- 3. Crear políticas permisivas para el bucket website-images
-- Política para lectura pública
CREATE POLICY "website_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'website-images');

-- Política para inserción de usuarios autenticados
CREATE POLICY "website_images_authenticated_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- Política para actualización de usuarios autenticados
CREATE POLICY "website_images_authenticated_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- Política para eliminación de usuarios autenticados
CREATE POLICY "website_images_authenticated_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- Política para service role (por si acaso)
CREATE POLICY "website_images_service_role_all" ON storage.objects
FOR ALL USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'service_role'
);

-- 4. Crear función para limpiar imágenes huérfanas del website (opcional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_website_images()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Eliminar archivos de storage que no tienen referencia en la tabla
  DELETE FROM storage.objects
  WHERE bucket_id = 'website-images'
    AND name NOT IN (
      SELECT DISTINCT split_part(url, '/', -1)
      FROM website_images
      WHERE url IS NOT NULL
    );
END;
$$;

-- 5. Comentarios informativos
COMMENT ON FUNCTION cleanup_orphaned_website_images() IS 'Función para limpiar imágenes huérfanas del storage del website'; 