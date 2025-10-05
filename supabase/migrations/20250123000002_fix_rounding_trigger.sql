-- =====================================================
-- Migración: Corregir Trigger para Aplicar Reglas de Redondeo
-- Fecha: 2025-01-23
-- Descripción: Corregir trigger para que aplique reglas de redondeo al precio final
-- =====================================================

-- Eliminar trigger existente
DROP TRIGGER IF EXISTS trg_update_final_price_with_vat ON "Product";

-- Eliminar función existente
DROP FUNCTION IF EXISTS update_final_price_with_vat();

-- Crear nueva función que aplica reglas de redondeo
CREATE OR REPLACE FUNCTION update_final_price_with_vat()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  rounding_rule VARCHAR(20) := 'hundreds'; -- Por defecto
  final_price DECIMAL(12,2);
BEGIN
  -- Obtener regla de redondeo de la categoría
  SELECT cpc."roundingRule" INTO rounding_rule
  FROM "CategoryProfitConfig" cpc
  WHERE cpc."categoryId" = NEW."categoryid"
    AND cpc."isActive" = true;
  
  -- Si no hay configuración de categoría, usar por defecto
  IF rounding_rule IS NULL THEN
    rounding_rule := 'hundreds';
  END IF;
  
  -- Calcular precio base con IVA
  final_price := COALESCE(NEW."saleprice", 0) * (1 + COALESCE(NEW."vat", 0)/100);
  
  -- Aplicar regla de redondeo
  CASE rounding_rule
    WHEN 'tens' THEN
      final_price := ROUND(final_price / 10) * 10;
    WHEN 'hundreds' THEN
      final_price := ROUND(final_price / 100) * 100;
    WHEN 'thousands' THEN
      final_price := ROUND(final_price / 1000) * 1000;
    WHEN 'none' THEN
      final_price := ROUND(final_price);
    ELSE
      final_price := ROUND(final_price / 100) * 100; -- Por defecto centenas
  END CASE;
  
  NEW."final_price_with_vat" := final_price;
  RETURN NEW;
END;
$$;

-- Recrear trigger
CREATE TRIGGER trg_update_final_price_with_vat 
BEFORE INSERT OR UPDATE ON "Product" 
FOR EACH ROW EXECUTE FUNCTION update_final_price_with_vat();

-- Comentarios sobre la corrección:
-- 
-- 1. El trigger anterior solo aplicaba IVA sin redondeo
-- 
-- 2. La nueva versión del trigger:
--    - Obtiene la regla de redondeo de la categoría del producto
--    - Aplica el IVA al precio de venta
--    - Aplica la regla de redondeo correspondiente
--    - Actualiza el campo final_price_with_vat correctamente
-- 
-- 3. Esto asegura que los precios mostrados respeten las reglas
--    de redondeo configuradas por categoría
-- =====================================================
