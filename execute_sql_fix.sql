-- =====================================================
-- Script para ejecutar directamente en Supabase
-- Copiar y pegar este contenido en el SQL Editor de Supabase
-- =====================================================

-- 1. Eliminar el trigger problemático (con CASCADE para eliminar dependencias)
DROP TRIGGER IF EXISTS log_price_changes ON "Product" CASCADE;
DROP TRIGGER IF EXISTS trg_log_price_changes ON "Product" CASCADE;

-- 2. Eliminar la función del trigger (con CASCADE para eliminar dependencias)
DROP FUNCTION IF EXISTS log_price_changes() CASCADE;

-- 3. Verificar que se eliminó correctamente
SELECT 
    'Triggers eliminados correctamente' as resultado,
    COUNT(*) as triggers_restantes
FROM information_schema.triggers 
WHERE event_object_table = 'Product' 
AND trigger_name = 'log_price_changes';

-- 4. Mostrar todos los triggers restantes en Product (debería estar vacío)
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'Product';
