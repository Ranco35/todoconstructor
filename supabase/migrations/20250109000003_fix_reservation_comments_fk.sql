-- Migración para corregir foreign key de reservation_comments
-- Permite comentarios para reservas tradicionales y modulares

-- 1. Eliminar la foreign key restrictiva existente
ALTER TABLE reservation_comments 
DROP CONSTRAINT IF EXISTS reservation_comments_reservation_id_fkey;

-- 2. No agregar nueva foreign key restrictiva ya que tenemos dos tipos de reservas:
--    - reservations (tradicionales)
--    - modular_reservations (modulares)
-- Los comentarios deben funcionar para ambos tipos

-- 3. Agregar índice para performance
CREATE INDEX IF NOT EXISTS idx_reservation_comments_reservation_id 
ON reservation_comments(reservation_id);

-- 4. Comentario explicativo
COMMENT ON TABLE reservation_comments IS 'Comentarios para reservas. reservation_id puede referenciar tanto reservations como modular_reservations'; 