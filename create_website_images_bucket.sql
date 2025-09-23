-- Crear bucket para imágenes del website
-- Ejecutar en Supabase SQL Editor

-- Crear el bucket website-images si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-images',
  'website-images',
  true,
  5242880, -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Crear política RLS para permitir lectura pública
CREATE POLICY "Public read access for website images" ON storage.objects
FOR SELECT USING (bucket_id = 'website-images');

-- Crear política RLS para permitir inserción (solo usuarios autenticados)
CREATE POLICY "Authenticated users can upload website images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- Crear política RLS para permitir actualización (solo usuarios autenticados)
CREATE POLICY "Authenticated users can update website images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- Crear política RLS para permitir eliminación (solo usuarios autenticados)
CREATE POLICY "Authenticated users can delete website images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- Verificar que el bucket se creó correctamente
SELECT * FROM storage.buckets WHERE id = 'website-images';
