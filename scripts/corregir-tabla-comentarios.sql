-- ================================================
-- CORREGIR TABLA DE COMENTARIOS DE RESERVAS
-- ================================================

-- Eliminar la tabla si existe para recrearla correctamente
DROP TABLE IF EXISTS reservation_comments;

-- Crear tabla correctamente con la foreign key correcta
CREATE TABLE reservation_comments (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT REFERENCES modular_reservations(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_reservation_comments_reservation_id
  ON reservation_comments(reservation_id);

-- Verificar que se creó correctamente
SELECT 
  'Tabla reservation_comments corregida correctamente' as mensaje,
  COUNT(*) as total_comentarios
FROM reservation_comments;

-- Mostrar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'reservation_comments'
ORDER BY ordinal_position; 