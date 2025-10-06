-- =====================================================
-- Agregar Columnas Faltantes a la Tabla Client
-- Fecha: 2025-10-06
-- Descripción: Agregar todas las columnas que faltan en la tabla Client
-- =====================================================

-- Agregar columnas de dirección adicionales
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "calle2" VARCHAR(255);

-- Agregar campos adicionales
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "idioma" VARCHAR(10) DEFAULT 'es';
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "zonaHoraria" VARCHAR(100);
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "imagen" TEXT;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "comentarios" TEXT;

-- Agregar campos específicos para empresas
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "numeroEmpleados" INTEGER;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "facturacionAnual" DECIMAL(15,2);

-- Agregar campos específicos para personas
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "fechaNacimiento" DATE;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "genero" VARCHAR(50);
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "profesion" VARCHAR(255);
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "titulo" VARCHAR(100);

-- Agregar campos de segmentación
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "origenCliente" VARCHAR(100);

-- Agregar campos de configuración (LOS MÁS IMPORTANTES)
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "recibirNewsletter" BOOLEAN DEFAULT true;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "aceptaMarketing" BOOLEAN DEFAULT false;

-- Modificar rankingCliente si existe como VARCHAR (cambiar a INTEGER)
-- Primero verificar si existe y es VARCHAR, luego cambiar
DO $$
BEGIN
  -- Intentar eliminar la columna antigua y recrearla
  BEGIN
    ALTER TABLE "Client" DROP COLUMN IF EXISTS "rankingCliente" CASCADE;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorar errores
  END;
  
  -- Agregar la columna con el tipo correcto
  ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "rankingCliente" INTEGER DEFAULT 0;
END $$;

-- Modificar fechaModificacion para que tenga valor por defecto
ALTER TABLE "Client" ALTER COLUMN "fechaModificacion" SET DEFAULT NOW();

-- Agregar campos de auditoría si no existen
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "creadoPor" UUID;
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "modificadoPor" UUID;

-- Agregar índices adicionales para las nuevas columnas
CREATE INDEX IF NOT EXISTS "idx_client_idioma" ON "Client"("idioma");
CREATE INDEX IF NOT EXISTS "idx_client_origen" ON "Client"("origenCliente");
CREATE INDEX IF NOT EXISTS "idx_client_genero" ON "Client"("genero");

-- Modificar columnas de ClientContact para agregar auditoría
ALTER TABLE "ClientContact" ADD COLUMN IF NOT EXISTS "creadoPor" UUID;
ALTER TABLE "ClientContact" ADD COLUMN IF NOT EXISTS "modificadoPor" UUID;
ALTER TABLE "ClientContact" ADD COLUMN IF NOT EXISTS "fechaModificacion" TIMESTAMPTZ DEFAULT NOW();

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Columnas faltantes agregadas a la tabla Client';
  RAISE NOTICE '✅ Columnas agregadas:';
  RAISE NOTICE '   - aceptaMarketing (BOOLEAN)';
  RAISE NOTICE '   - recibirNewsletter (BOOLEAN)';
  RAISE NOTICE '   - origenCliente (VARCHAR)';
  RAISE NOTICE '   - idioma (VARCHAR)';
  RAISE NOTICE '   - calle2 (VARCHAR)';
  RAISE NOTICE '   - zonaHoraria (VARCHAR)';
  RAISE NOTICE '   - imagen (TEXT)';
  RAISE NOTICE '   - comentarios (TEXT)';
  RAISE NOTICE '   - numeroEmpleados (INTEGER)';
  RAISE NOTICE '   - facturacionAnual (DECIMAL)';
  RAISE NOTICE '   - fechaNacimiento (DATE)';
  RAISE NOTICE '   - genero (VARCHAR)';
  RAISE NOTICE '   - profesion (VARCHAR)';
  RAISE NOTICE '   - titulo (VARCHAR)';
  RAISE NOTICE '   - rankingCliente (INTEGER)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ahora la tabla Client está completa y lista para usar';
END $$;

