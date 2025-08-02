-- Script para agregar campo de precio final congelado a la tabla Product
-- Este campo almacenará el precio final definitivo que el usuario establece

-- 1. Agregar columna para precio final congelado
ALTER TABLE "Product" 
ADD COLUMN "finalPrice" DECIMAL(10,2) DEFAULT NULL;

-- 2. Agregar comentario a la columna
COMMENT ON COLUMN "Product"."finalPrice" IS 'Precio final congelado con IVA incluido que el usuario establece como definitivo';

-- 3. Actualizar productos existentes con precio final calculado
UPDATE "Product" 
SET "finalPrice" = ROUND(saleprice * (1 + vat/100))
WHERE saleprice IS NOT NULL AND vat IS NOT NULL;

-- 4. Verificar la actualización
SELECT 
    id,
    name,
    saleprice as precio_neto,
    vat,
    "finalPrice" as precio_final_congelado,
    ROUND(saleprice * (1 + vat/100)) as precio_final_calculado
FROM "Product" 
WHERE saleprice IS NOT NULL 
AND vat IS NOT NULL 
LIMIT 10;

-- 5. Crear índice para optimizar consultas por precio final
CREATE INDEX IF NOT EXISTS idx_product_final_price ON "Product"("finalPrice");

-- 6. Agregar restricción para asegurar que el precio final sea positivo
ALTER TABLE "Product" 
ADD CONSTRAINT check_final_price_positive 
CHECK ("finalPrice" IS NULL OR "finalPrice" >= 0); 