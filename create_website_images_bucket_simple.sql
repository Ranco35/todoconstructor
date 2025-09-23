-- Crear bucket website-images y carpeta categories
-- Ejecutar en Supabase SQL Editor

-- 1. Crear el bucket website-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-images',
  'website-images',
  true,
  5242880, -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear políticas RLS para lectura pública
CREATE POLICY IF NOT EXISTS "Public read access for website images" ON storage.objects
FOR SELECT USING (bucket_id = 'website-images');

-- 3. Crear políticas RLS para usuarios autenticados
CREATE POLICY IF NOT EXISTS "Authenticated users can upload website images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated users can update website images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated users can delete website images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Verificar que el bucket se creó
SELECT 
  'Bucket website-images creado:' as status,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'website-images';
