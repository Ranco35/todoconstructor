-- =====================================================
-- Script: Corregir Error de Trigger 'final_price_with_vat'
-- Fecha: 2025-01-23
-- Descripción: Deshabilitar trigger problemático que causa error
-- =====================================================

-- Deshabilitar el trigger problemático
DROP TRIGGER IF EXISTS log_price_changes ON "Product";

-- Eliminar la función del trigger
DROP FUNCTION IF EXISTS log_price_changes();

-- Verificar que el trigger ha sido eliminado
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'Product' 
AND trigger_name = 'log_price_changes';

-- Si la consulta anterior no devuelve resultados, el trigger ha sido eliminado correctamente
