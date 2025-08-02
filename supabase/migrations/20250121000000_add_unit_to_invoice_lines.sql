-- Agregar campo unit a invoice_lines para manejar unidades de medida
ALTER TABLE public.invoice_lines 
ADD COLUMN unit VARCHAR(50) DEFAULT 'UND';

-- Crear índice para mejorar consultas por unidad
CREATE INDEX idx_invoice_lines_unit ON public.invoice_lines(unit);

-- Comentario para documentar el campo
COMMENT ON COLUMN public.invoice_lines.unit IS 'Unidad de medida del producto (ej: UND, KG, DOC, etc.)'; 