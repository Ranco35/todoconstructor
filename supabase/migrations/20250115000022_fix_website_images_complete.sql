-- =====================================================================
-- Migración: Corrección completa de tabla website_images y permisos
-- Fecha: 2025-01-15
-- Descripción: Resolver errores "permission denied for table users" y "Table website_images does not exist"
-- =====================================================================

-- 1. Crear tabla website_images si no existe
CREATE TABLE IF NOT EXISTS website_images (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    category VARCHAR(100) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES auth.users(id),
    updated_by INTEGER REFERENCES auth.users(id)
);

-- 2. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_website_images_category ON website_images(category);
CREATE INDEX IF NOT EXISTS idx_website_images_active ON website_images(is_active);
CREATE INDEX IF NOT EXISTS idx_website_images_sort ON website_images(sort_order);

-- 3. Función para actualizar timestamp de modificación
CREATE OR REPLACE FUNCTION update_website_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para auto-actualizar updated_at
DROP TRIGGER IF EXISTS trigger_website_images_updated_at ON website_images;
CREATE TRIGGER trigger_website_images_updated_at
    BEFORE UPDATE ON website_images
    FOR EACH ROW
    EXECUTE FUNCTION update_website_images_updated_at();

-- 5. Configurar RLS (Row Level Security)
ALTER TABLE website_images ENABLE ROW LEVEL SECURITY;

-- 6. Mejorar función get_user_role para evitar errores de permisos
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Intentar obtener el rol del usuario desde auth.users
    BEGIN
        SELECT raw_user_meta_data->>'role' INTO user_role
        FROM auth.users 
        WHERE id = user_uuid;
        
        -- Si no hay rol en metadata, usar 'USER' como default
        IF user_role IS NULL OR user_role = '' THEN
            user_role := 'USER';
        END IF;
        
        RETURN user_role;
    EXCEPTION 
        WHEN insufficient_privilege THEN
            -- Si no hay permisos para acceder a auth.users, retornar rol básico
            RETURN 'USER';
        WHEN OTHERS THEN
            -- Cualquier otro error, retornar rol básico
            RETURN 'USER';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Políticas RLS para website_images

-- Política para lectura (todos pueden ver imágenes activas)
CREATE POLICY "website_images_select_policy" ON website_images
    FOR SELECT USING (
        is_active = true OR 
        get_user_role(auth.uid()) IN ('ADMIN', 'JEFE_SECCION')
    );

-- Política para insertar (solo admin y jefe de sección)
CREATE POLICY "website_images_insert_policy" ON website_images
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) IN ('ADMIN', 'JEFE_SECCION')
    );

-- Política para actualizar (solo admin y jefe de sección)
CREATE POLICY "website_images_update_policy" ON website_images
    FOR UPDATE USING (
        get_user_role(auth.uid()) IN ('ADMIN', 'JEFE_SECCION')
    );

-- Política para eliminar (solo admin)
CREATE POLICY "website_images_delete_policy" ON website_images
    FOR DELETE USING (
        get_user_role(auth.uid()) = 'ADMIN'
    );

-- 8. Crear bucket de storage para imágenes del sitio web si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-images', 'website-images', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Políticas de storage para el bucket website-images
CREATE POLICY "website_images_storage_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'website-images');

CREATE POLICY "website_images_storage_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'website-images' AND
        get_user_role(auth.uid()) IN ('ADMIN', 'JEFE_SECCION')
    );

CREATE POLICY "website_images_storage_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'website-images' AND
        get_user_role(auth.uid()) IN ('ADMIN', 'JEFE_SECCION')
    );

CREATE POLICY "website_images_storage_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'website-images' AND
        get_user_role(auth.uid()) = 'ADMIN'
    );

-- 10. Insertar datos de ejemplo para el hotel
INSERT INTO website_images (title, description, image_url, alt_text, category, is_active, sort_order) VALUES
('Entrada Principal Hotel', 'Vista frontal del Hotel Termas Panimávida', '/images/hotel-entrance.jpg', 'Fachada principal del hotel con jardines', 'hotel', true, 1),
('Piscinas Termales', 'Piscinas con aguas termales naturales', '/images/thermal-pools.jpg', 'Piscinas termales al aire libre rodeadas de naturaleza', 'spa', true, 2),
('Habitación Superior', 'Habitación superior con vista a la cordillera', '/images/superior-room.jpg', 'Habitación elegante con cama king size y vista panorámica', 'rooms', true, 3),
('Restaurante Principal', 'Comedor principal con cocina regional', '/images/restaurant.jpg', 'Amplio comedor con decoración tradicional chilena', 'restaurant', true, 4),
('Jardines del Hotel', 'Extensos jardines y áreas verdes', '/images/gardens.jpg', 'Jardines paisajísticos con senderos y áreas de descanso', 'facilities', true, 5)
ON CONFLICT DO NOTHING;

-- 11. Función para verificar existencia de tabla (evita errores de permisos)
CREATE OR REPLACE FUNCTION check_website_images_table_exists()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'website_images'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Comentarios de documentación
COMMENT ON TABLE website_images IS 'Tabla para gestionar imágenes del sitio web del hotel';
COMMENT ON COLUMN website_images.category IS 'Categoría de la imagen: hotel, spa, rooms, restaurant, facilities, gallery';
COMMENT ON COLUMN website_images.is_active IS 'Indica si la imagen está activa y visible en el sitio web';
COMMENT ON COLUMN website_images.sort_order IS 'Orden de visualización de las imágenes';

-- 13. Verificación final
DO $$
BEGIN
    -- Verificar que la tabla existe
    IF check_website_images_table_exists() THEN
        RAISE NOTICE '✅ Tabla website_images creada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: No se pudo crear la tabla website_images';
    END IF;
    
    -- Verificar que hay datos
    IF (SELECT COUNT(*) FROM website_images) > 0 THEN
        RAISE NOTICE '✅ Datos de ejemplo insertados correctamente (% registros)', (SELECT COUNT(*) FROM website_images);
    ELSE
        RAISE NOTICE '⚠️ No se insertaron datos de ejemplo';
    END IF;
    
    -- Verificar que RLS está habilitado
    IF (SELECT relrowsecurity FROM pg_class WHERE relname = 'website_images') THEN
        RAISE NOTICE '✅ RLS habilitado correctamente en website_images';
    ELSE
        RAISE NOTICE '⚠️ RLS no está habilitado en website_images';
    END IF;
    
    RAISE NOTICE '🎉 Migración website_images completada exitosamente';
END;
$$; 