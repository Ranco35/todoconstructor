-- Agregar columna isCashier a la tabla User (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'isCashier') THEN
        ALTER TABLE "public"."User" ADD COLUMN "isCashier" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Comentario para documentar el cambio
COMMENT ON COLUMN "public"."User"."isCashier" IS 'Indica si el usuario es cajero y puede manejar sesiones de caja'; 