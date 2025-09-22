-- =====================================================
-- Migración: Deshabilitar Trigger Problemático
-- Fecha: 2025-01-23
-- Descripción: Deshabilitar trigger que causa error 'final_price_with_vat'
-- =====================================================

-- Deshabilitar el trigger problemático
DROP TRIGGER IF EXISTS log_price_changes ON "Product";

-- Eliminar la función del trigger
DROP FUNCTION IF EXISTS log_price_changes();

-- Comentario: El trigger ha sido deshabilitado porque causaba errores
-- al intentar acceder a campos inexistentes. La funcionalidad de 
-- actualización de precios funciona correctamente sin este trigger.
-- El historial de cambios se puede implementar de otra manera si es necesario.
