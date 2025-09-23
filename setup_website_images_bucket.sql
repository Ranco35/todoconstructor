-- Script completo para configurar el bucket website-images
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
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public read access for website images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload website images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update website images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete website images" ON storage.objects;

-- 3. Crear políticas RLS para el bucket website-images

-- Política para lectura pública
CREATE POLICY "Public read access for website images" ON storage.objects
FOR SELECT USING (bucket_id = 'website-images');

-- Política para inserción (usuarios autenticados)
CREATE POLICY "Authenticated users can upload website images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- Política para actualización (usuarios autenticados)
CREATE POLICY "Authenticated users can update website images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- Política para eliminación (usuarios autenticados)
CREATE POLICY "Authenticated users can delete website images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- 4. Verificar que todo se creó correctamente
SELECT 
  'Bucket creado:' as status,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'website-images';

-- 5. Verificar políticas creadas
SELECT 
  'Políticas creadas:' as status,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%website%';

-- 6. Crear tabla website_images si no existe
CREATE TABLE IF NOT EXISTS public.website_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  alt_text TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  is_active BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_website_images_category ON public.website_images(category);
CREATE INDEX IF NOT EXISTS idx_website_images_active ON public.website_images(is_active);
CREATE INDEX IF NOT EXISTS idx_website_images_uploaded_at ON public.website_images(uploaded_at);

-- 8. Habilitar RLS en la tabla
ALTER TABLE public.website_images ENABLE ROW LEVEL SECURITY;

-- 9. Crear políticas RLS para la tabla website_images
CREATE POLICY "Public read access for website images table" ON public.website_images
FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage website images" ON public.website_images
FOR ALL USING (auth.role() = 'authenticated');

-- 10. Verificar tabla creada
SELECT 
  'Tabla website_images creada:' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'website_images' 
AND table_schema = 'public'
ORDER BY ordinal_position;
