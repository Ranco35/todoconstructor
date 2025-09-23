-- Script completo para configurar website-images
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. CREAR BUCKET WEBSITE-IMAGES
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'website-images',
  'website-images',
  true,
  5242880, -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CREAR POLÍTICAS RLS PARA STORAGE
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public read access for website images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload website images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update website images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete website images" ON storage.objects;

-- Crear nuevas políticas
CREATE POLICY "Public read access for website images" ON storage.objects
FOR SELECT USING (bucket_id = 'website-images');

CREATE POLICY "Authenticated users can upload website images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update website images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete website images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'website-images' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 3. CREAR TABLA WEBSITE_IMAGES
-- ============================================

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

-- ============================================
-- 4. CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_website_images_category ON public.website_images(category);
CREATE INDEX IF NOT EXISTS idx_website_images_active ON public.website_images(is_active);
CREATE INDEX IF NOT EXISTS idx_website_images_uploaded_at ON public.website_images(uploaded_at);

-- ============================================
-- 5. CONFIGURAR RLS PARA TABLA
-- ============================================

ALTER TABLE public.website_images ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public read access for website images table" ON public.website_images;
DROP POLICY IF EXISTS "Authenticated users can manage website images" ON public.website_images;

-- Crear nuevas políticas
CREATE POLICY "Public read access for website images table" ON public.website_images
FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage website images" ON public.website_images
FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 6. VERIFICAR CONFIGURACIÓN
-- ============================================

-- Verificar bucket creado
SELECT 
  '✅ Bucket website-images creado:' as status,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets 
WHERE id = 'website-images';

-- Verificar políticas de storage
SELECT 
  '✅ Políticas de storage creadas:' as status,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%website%';

-- Verificar tabla creada
SELECT 
  '✅ Tabla website_images creada:' as status,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'website_images' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas de tabla
SELECT 
  '✅ Políticas de tabla creadas:' as status,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'website_images' 
AND schemaname = 'public';
