-- ================================================
-- AGREGAR CAMPOS DE EDICIÓN A RESERVATION_COMMENTS
-- Fecha: 2025-01-15
-- Descripción: Permite rastrear quién editó cada comentario y cuándo
-- ================================================

-- Agregar campos para rastrear ediciones
ALTER TABLE reservation_comments 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
ADD COLUMN updated_by VARCHAR(255),
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN original_text TEXT;

-- Comentarios explicativos
COMMENT ON COLUMN reservation_comments.updated_at IS 'Fecha y hora de la última edición';
COMMENT ON COLUMN reservation_comments.updated_by IS 'Usuario que realizó la última edición';
COMMENT ON COLUMN reservation_comments.is_edited IS 'Indica si el comentario ha sido editado';
COMMENT ON COLUMN reservation_comments.original_text IS 'Texto original antes de la primera edición';

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_reservation_comments_updated_at ON reservation_comments(updated_at);
CREATE INDEX IF NOT EXISTS idx_reservation_comments_is_edited ON reservation_comments(is_edited);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_reservation_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reservation_comments_updated_at 
    BEFORE UPDATE ON reservation_comments
    FOR EACH ROW 
    EXECUTE FUNCTION update_reservation_comments_updated_at();

-- Actualizar registros existentes
UPDATE reservation_comments 
SET updated_at = created_at,
    is_edited = FALSE
WHERE updated_at IS NULL; 