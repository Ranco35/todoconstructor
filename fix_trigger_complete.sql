-- =====================================================
-- Script COMPLETO para eliminar triggers problemáticos
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Eliminar TODOS los triggers posibles en la tabla Product
DROP TRIGGER IF EXISTS log_price_changes ON "Product" CASCADE;
DROP TRIGGER IF EXISTS trg_log_price_changes ON "Product" CASCADE;
DROP TRIGGER IF EXISTS price_change_trigger ON "Product" CASCADE;
DROP TRIGGER IF EXISTS product_price_trigger ON "Product" CASCADE;

-- 2. Eliminar TODAS las funciones posibles relacionadas con precios
DROP FUNCTION IF EXISTS log_price_changes() CASCADE;
DROP FUNCTION IF EXISTS log_price_changes() CASCADE;
DROP FUNCTION IF EXISTS price_change_logger() CASCADE;
DROP FUNCTION IF EXISTS product_price_logger() CASCADE;

-- 3. Verificar que NO quedan triggers en la tabla Product
SELECT 
    'Triggers restantes en tabla Product:' as estado,
    COUNT(*) as cantidad
FROM information_schema.triggers 
WHERE event_object_table = 'Product';

-- 4. Mostrar lista de triggers restantes (debería estar vacía)
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'Product';

-- 5. Mensaje de confirmación
SELECT '✅ Triggers problemáticos eliminados correctamente' as resultado;



