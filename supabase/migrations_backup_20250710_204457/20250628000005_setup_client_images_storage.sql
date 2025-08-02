-- Migración para configurar Storage de imágenes de clientes
-- Esta migración configura el bucket y las políticas de seguridad para las imágenes

-- 1. Crear bucket para imágenes de clientes (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-images',
  'client-images',
  true,
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política para permitir que usuarios autenticados suban imágenes
CREATE POLICY "Usuarios autenticados pueden subir imágenes de clientes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-images');

-- 3. Política para permitir que todos vean las imágenes (públicas)
CREATE POLICY "Las imágenes de clientes son públicas para lectura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-images');

-- 4. Política para permitir que usuarios autenticados actualicen sus imágenes
CREATE POLICY "Usuarios autenticados pueden actualizar imágenes de clientes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-images');

-- 5. Política para permitir que usuarios autenticados eliminen imágenes
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes de clientes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-images');

-- 6. Crear función para limpiar imágenes huérfanas (opcional)
CREATE OR REPLACE FUNCTION cleanup_orphaned_client_images()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Eliminar imágenes que no están referenciadas en la tabla Client
  DELETE FROM storage.objects
  WHERE bucket_id = 'client-images'
    AND name NOT IN (
      SELECT SUBSTRING(imagen FROM 'clients/(.+)$')
      FROM "Client"
      WHERE imagen IS NOT NULL
        AND imagen LIKE '%supabase%'
        AND imagen LIKE '%client-images%'
    )
    AND name LIKE 'client-%' -- Solo eliminar imágenes con prefijo client-
    AND created_at < NOW() - INTERVAL '7 days'; -- Solo eliminar imágenes de más de 7 días
END;
$$;

-- 7. Crear función para obtener URL pública de imagen
CREATE OR REPLACE FUNCTION get_client_image_url(image_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url text;
  public_url text;
BEGIN
  -- Obtener la URL base del proyecto
  SELECT concat('https://', current_setting('app.settings.supabase_url', true), '/storage/v1/object/public/')
  INTO base_url;
  
  -- Construir URL pública
  IF image_path IS NOT NULL AND image_path != '' THEN
    public_url := concat(base_url, 'client-images/', image_path);
  ELSE
    public_url := NULL;
  END IF;
  
  RETURN public_url;
END;
$$;

-- 8. Crear trigger para actualizar fecha de modificación cuando se actualiza imagen
CREATE OR REPLACE FUNCTION update_client_modified_on_image_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.imagen IS DISTINCT FROM NEW.imagen THEN
    NEW.fechaModificacion = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Crear el trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_client_modified_on_image_change'
  ) THEN
    CREATE TRIGGER trigger_update_client_modified_on_image_change
      BEFORE UPDATE ON "Client"
      FOR EACH ROW
      EXECUTE FUNCTION update_client_modified_on_image_change();
  END IF;
END;
$$;

-- 9. Comentarios para documentación
COMMENT ON FUNCTION cleanup_orphaned_client_images() IS 'Limpia imágenes de clientes que no están referenciadas en la tabla Client';
COMMENT ON FUNCTION get_client_image_url(text) IS 'Obtiene la URL pública completa de una imagen de cliente';
COMMENT ON FUNCTION update_client_modified_on_image_change() IS 'Actualiza fechaModificacion cuando se cambia la imagen del cliente'; 