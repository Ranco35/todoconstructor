-- Migración: Agregar contador de servicios vendidos
-- Fecha: 2025-01-01
-- Descripción: Agrega campo servicesSold para contar cuántos servicios se han vendido

-- Agregar campo contador de servicios vendidos solo si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'Product' AND column_name = 'servicesSold') THEN
        ALTER TABLE "Product" 
        ADD COLUMN "servicesSold" INTEGER DEFAULT 0;
    END IF;
END $$;

-- Crear índice para mejorar performance en consultas de servicios más vendidos
CREATE INDEX IF NOT EXISTS "idx_product_services_sold" ON "Product"("servicesSold");

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN "Product"."servicesSold" IS 'Contador de servicios vendidos (solo aplica para productos tipo SERVICIO)';

-- Inicializar contador en 0 para todos los productos existentes de tipo SERVICIO
UPDATE "Product" 
SET "servicesSold" = 0 
WHERE "type" = 'SERVICIO' AND ("servicesSold" IS NULL OR "servicesSold" = 0); 