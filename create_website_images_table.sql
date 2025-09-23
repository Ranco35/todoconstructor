-- Crear tabla website_images para tracking de imágenes
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla website_images
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

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_website_images_category ON public.website_images(category);
CREATE INDEX IF NOT EXISTS idx_website_images_active ON public.website_images(is_active);
CREATE INDEX IF NOT EXISTS idx_website_images_uploaded_at ON public.website_images(uploaded_at);

-- 3. Habilitar RLS
ALTER TABLE public.website_images ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
CREATE POLICY IF NOT EXISTS "Public read access for website images table" ON public.website_images
FOR SELECT USING (is_active = true);

CREATE POLICY IF NOT EXISTS "Authenticated users can manage website images" ON public.website_images
FOR ALL USING (auth.role() = 'authenticated');

-- 5. Verificar tabla creada
SELECT 
  'Tabla website_images creada:' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'website_images' 
AND table_schema = 'public'
ORDER BY ordinal_position;
