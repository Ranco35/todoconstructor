-- =====================================================
-- Script SIMPLE - Solo lo necesario
-- =====================================================

-- Eliminar trigger y función con CASCADE
DROP TRIGGER IF EXISTS trg_log_price_changes ON "Product" CASCADE;
DROP FUNCTION IF EXISTS log_price_changes() CASCADE;

-- Verificar eliminación
SELECT 'Triggers eliminados' as resultado;
