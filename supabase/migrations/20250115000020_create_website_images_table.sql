-- Crear tabla para imágenes del website
CREATE TABLE IF NOT EXISTS website_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (category IN ('hero', 'rooms', 'services', 'gallery', 'testimonials', 'other')),
  size INTEGER NOT NULL DEFAULT 0, -- tamaño en bytes
  width INTEGER,
  height INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_website_images_category ON website_images(category);
CREATE INDEX IF NOT EXISTS idx_website_images_is_active ON website_images(is_active);
CREATE INDEX IF NOT EXISTS idx_website_images_uploaded_at ON website_images(uploaded_at);

-- Políticas RLS para website_images
ALTER TABLE website_images ENABLE ROW LEVEL SECURITY;

-- Política para leer imágenes (público)
CREATE POLICY "Allow public read access to website images" 
ON website_images FOR SELECT 
USING (is_active = true);

-- Política para administradores (CRUD completo)
CREATE POLICY "Allow admin full access to website images" 
ON website_images FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' IN ('ADMINISTRADOR', 'SUPER_USER')
  )
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_website_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_website_images_updated_at_trigger ON website_images;
CREATE TRIGGER update_website_images_updated_at_trigger
  BEFORE UPDATE ON website_images
  FOR EACH ROW
  EXECUTE FUNCTION update_website_images_updated_at();

-- Insertar algunas imágenes de ejemplo (opcionales)
INSERT INTO website_images (filename, original_name, url, alt_text, category, size, width, height) VALUES
('hero-spa.jpg', 'Portada del Spa', '/images/website/hero-spa.jpg', 'Vista panorámica del spa y termas', 'hero', 2048000, 1920, 1080),
('room-standard.jpg', 'Habitación Estándar', '/images/website/room-standard.jpg', 'Habitación estándar con vista al jardín', 'rooms', 1536000, 800, 600),
('spa-services.jpg', 'Servicios de Spa', '/images/website/spa-services.jpg', 'Tratamientos relajantes en el spa', 'services', 1024000, 600, 400),
('gallery-pool.jpg', 'Piscina Termal', '/images/website/gallery-pool.jpg', 'Piscina termal con aguas naturales', 'gallery', 1792000, 800, 800),
('testimonial-client.jpg', 'Cliente Satisfecho', '/images/website/testimonial-client.jpg', 'Cliente disfrutando de los servicios', 'testimonials', 512000, 400, 400);

-- Comentarios para documentación
COMMENT ON TABLE website_images IS 'Tabla para almacenar todas las imágenes utilizadas en el website';
COMMENT ON COLUMN website_images.category IS 'Categoría de la imagen: hero, rooms, services, gallery, testimonials, other';
COMMENT ON COLUMN website_images.size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN website_images.is_active IS 'Indica si la imagen está activa y visible en el website'; 