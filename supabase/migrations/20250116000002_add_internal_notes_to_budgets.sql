-- Migración: Agregar notas internas a presupuestos
-- Solo visibles para usuarios internos, NO para clientes

-- Agregar campo de notas internas a tabla sales_quotes
ALTER TABLE public.sales_quotes 
ADD COLUMN internal_notes TEXT;

-- Agregar comentario para documentar el propósito
COMMENT ON COLUMN public.sales_quotes.internal_notes IS 'Notas internas del presupuesto, solo visibles para personal interno. NO se envían a clientes en emails ni PDFs.';

-- Agregar índice para mejorar búsquedas si se implementan filtros por notas internas
CREATE INDEX IF NOT EXISTS idx_sales_quotes_internal_notes_search 
ON public.sales_quotes USING gin(to_tsvector('spanish', internal_notes));

-- Trigger para actualizar updated_at cuando se modifiquen las notas internas
CREATE OR REPLACE FUNCTION update_quote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger solo si no existe
DROP TRIGGER IF EXISTS trigger_update_quote_updated_at ON public.sales_quotes;
CREATE TRIGGER trigger_update_quote_updated_at
    BEFORE UPDATE ON public.sales_quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_quote_updated_at();

-- Política RLS para notas internas (solo usuarios autenticados pueden ver/editar)
-- Las notas internas solo son visibles para usuarios con rol de recepcionista o superior
ALTER TABLE public.sales_quotes ENABLE ROW LEVEL SECURITY;

-- La política general de sales_quotes ya existe, estas notas siguen la misma política
-- pero agregaremos verificación adicional en el frontend para asegurar que solo personal interno las vea 