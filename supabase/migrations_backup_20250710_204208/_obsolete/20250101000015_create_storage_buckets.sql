-- Crear buckets de storage para imágenes
-- Bucket para imágenes de clientes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-images',
  'client-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para el bucket de clientes
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'client-images');
CREATE POLICY "Authenticated users can upload client images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'client-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own client images" ON storage.objects FOR UPDATE USING (bucket_id = 'client-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own client images" ON storage.objects FOR DELETE USING (bucket_id = 'client-images' AND auth.role() = 'authenticated');

-- Políticas RLS para el bucket de productos
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated'); 