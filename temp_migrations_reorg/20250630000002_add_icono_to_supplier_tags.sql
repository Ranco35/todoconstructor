-- Agregar campo icono a la tabla SupplierTag
ALTER TABLE "SupplierTag" 
ADD COLUMN IF NOT EXISTS "icono" TEXT DEFAULT 'truck';

-- Actualizar etiquetas existentes con iconos apropiados basados en su nombre
UPDATE "SupplierTag" 
SET "icono" = CASE 
  WHEN "nombre" = 'Confiable' THEN 'shield'
  WHEN "nombre" = 'Urgente' THEN 'zap'
  WHEN "nombre" = 'Premium' THEN 'award'
  WHEN "nombre" = 'Nuevo' THEN 'package'
  WHEN "nombre" = 'Local' THEN 'map-pin'
  WHEN "nombre" = 'Certificado' THEN 'shield'
  WHEN "nombre" = 'Grande' THEN 'building2'
  WHEN "nombre" = 'Pyme' THEN 'briefcase'
  WHEN "nombre" = 'Part-Time' THEN 'users2'
  WHEN "nombre" = 'Especialista' THEN 'wrench'
  WHEN "nombre" = 'Freelance' THEN 'user'
  ELSE 'truck'
END
WHERE "icono" IS NULL OR "icono" = 'truck';

-- Crear índice para el campo icono si es necesario
CREATE INDEX IF NOT EXISTS "idx_supplier_tag_icono" ON "SupplierTag"("icono");

-- Comentario de la migración
COMMENT ON COLUMN "SupplierTag"."icono" IS 'Icono visual para la etiqueta de proveedor'; 