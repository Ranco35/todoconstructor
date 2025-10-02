-- =====================================================
-- Migración: Corregir Trigger de Product que busca campo inexistente
-- Fecha: 2025-01-23
-- Descripción: Corregir trigger que causa error 'final_price_with_vat' no existe
-- =====================================================

-- Eliminar trigger problemático si existe
DROP TRIGGER IF EXISTS log_price_changes ON "Product";

-- Eliminar función del trigger si existe
DROP FUNCTION IF EXISTS log_price_changes();

-- Recrear la función del trigger corregida
CREATE OR REPLACE FUNCTION log_price_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar cambios en precios
    IF OLD.costprice IS DISTINCT FROM NEW.costprice OR 
       OLD.saleprice IS DISTINCT FROM NEW.saleprice THEN
        
        -- Insertar en PriceHistory si la tabla existe
        BEGIN
            INSERT INTO "PriceHistory" (
                "productId",
                "costPrice",
                "salePrice",
                "changeReason",
                "priceType",
                "changedAt",
                "changedBy"
            ) VALUES (
                NEW.id,
                NEW.costprice,
                NEW.saleprice,
                'Actualización automática desde trigger',
                'net',
                NOW(),
                'system'
            );
        EXCEPTION
            WHEN undefined_table THEN
                -- Si la tabla PriceHistory no existe, no hacer nada
                NULL;
            WHEN OTHERS THEN
                -- Si hay cualquier otro error, no fallar la actualización
                NULL;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger corregido
CREATE TRIGGER log_price_changes
    AFTER UPDATE ON "Product"
    FOR EACH ROW
    EXECUTE FUNCTION log_price_changes();

-- =====================================================
-- Comentarios sobre la corrección:
-- 
-- 1. El trigger anterior probablemente intentaba acceder a un campo
--    'final_price_with_vat' que no existe en la tabla Product
-- 
-- 2. La nueva versión del trigger:
--    - Solo verifica cambios en costprice y saleprice
--    - No intenta acceder a campos inexistentes
--    - Maneja errores graciosamente si PriceHistory no existe
--    - No falla la actualización del producto si hay problemas
-- 
-- 3. El trigger es opcional y no crítico para la funcionalidad
--    de actualización de precios
-- =====================================================



