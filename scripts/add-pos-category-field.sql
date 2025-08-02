-- Script para agregar el campo posCategoryId a la tabla Product
-- Este campo permitirá asignar una categoría POS específica a cada producto

-- Verificar si la tabla POSProductCategory existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'POSProductCategory') THEN
        RAISE NOTICE 'La tabla POSProductCategory no existe. Créala primero antes de ejecutar este script.';
        RETURN;
    END IF;
END $$;

-- Agregar el campo posCategoryId a la tabla Product si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'Product' AND column_name = 'posCategoryId') THEN
        
        -- Agregar la columna
        ALTER TABLE "Product" 
        ADD COLUMN "posCategoryId" bigint;
        
        -- Agregar la restricción de clave foránea
        ALTER TABLE "Product" 
        ADD CONSTRAINT "Product_posCategoryId_fkey" 
        FOREIGN KEY ("posCategoryId") 
        REFERENCES "POSProductCategory"(id)
        ON DELETE SET NULL;
        
        -- Crear índice para mejorar performance
        CREATE INDEX IF NOT EXISTS "idx_product_pos_category" 
        ON "Product"("posCategoryId");
        
        RAISE NOTICE 'Campo posCategoryId agregado exitosamente a la tabla Product.';
    ELSE
        RAISE NOTICE 'El campo posCategoryId ya existe en la tabla Product.';
    END IF;
END $$;

-- Verificar el resultado
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name = 'posCategoryId'; 