-- ═══════════════════════════════════════════════════════════════
-- SCRIPT: Agregar columna SKU faltante a products_modular
-- PROPÓSITO: Corregir error "Could not find the 'sku' column"
-- FECHA: 2025-01-02
-- ═══════════════════════════════════════════════════════════════

-- Agregar columna sku si no existe
ALTER TABLE products_modular 
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products_modular' 
ORDER BY ordinal_position; 