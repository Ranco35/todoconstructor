-- ================================================
-- AGREGAR CAMPOS DE AUDITORÍA A RESERVATIONS
-- ================================================

-- Agregar campos de auditoría a la tabla reservations
ALTER TABLE public.reservations
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_reservations_created_by ON public.reservations (created_by);
CREATE INDEX IF NOT EXISTS idx_reservations_updated_by ON public.reservations (updated_by);

-- Actualizar registros existentes con un usuario por defecto (opcional)
-- Se puede ajustar más tarde con el usuario real si es necesario
UPDATE public.reservations 
SET created_by = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'sistema@admintermas.com' 
    LIMIT 1
),
updated_by = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'sistema@admintermas.com' 
    LIMIT 1
)
WHERE created_by IS NULL OR updated_by IS NULL;

-- Comentarios para documentar los campos
COMMENT ON COLUMN public.reservations.created_by IS 'Usuario que creó la reserva';
COMMENT ON COLUMN public.reservations.updated_by IS 'Usuario que realizó la última modificación'; 