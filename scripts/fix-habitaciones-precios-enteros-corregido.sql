-- Script para corregir precios enteros de habitaciones
-- Reemplaza la función calculate_package_price_modular para usar precios enteros directos de habitaciones
-- CORREGIDO: Usa las columnas correctas de la tabla Product (saleprice, costprice, vat)

-- Eliminar función existente si existe (múltiples versiones)
DROP FUNCTION IF EXISTS calculate_package_price_modular(text, text, integer);

-- Crear función corregida que usa precios enteros para habitaciones
CREATE OR REPLACE FUNCTION calculate_package_price_modular(
  p_room_code text,
  p_package_code text,
  p_nights integer
) RETURNS TABLE (
  room_price numeric,
  total_price numeric,
  product_details jsonb
) 
LANGUAGE plpgsql
AS $$
DECLARE
  room_price numeric := 0;
  package_price numeric := 0;
  total_price numeric := 0;
  product_record RECORD;
  product_details_array jsonb := '[]'::jsonb;
  product_detail jsonb;
BEGIN
  -- ═══════════════════════════════════════════════════════════════
  -- HABITACIONES: USAR PRECIOS ENTEROS DIRECTOS DE ROOMS O PRODUCT
  -- ═══════════════════════════════════════════════════════════════
  
  -- OPCIÓN 1: Buscar precio directamente en rooms por número de habitación
  SELECT r.price_per_night INTO room_price
  FROM rooms r
  JOIN products_modular pm ON pm.code = 'habitacion_' || r.number
  WHERE pm.code = p_room_code 
    AND pm.category = 'alojamiento'
    AND r.is_active = true
    AND pm.is_active = true;
  
  -- OPCIÓN 2: Si no se encontró en rooms, usar saleprice de Product (YA ES ENTERO)
  IF room_price IS NULL THEN
    SELECT p.saleprice INTO room_price
    FROM products_modular pm
    JOIN "Product" p ON pm.original_id = p.id
    WHERE pm.code = p_room_code 
      AND pm.category = 'alojamiento'
      AND p.saleprice IS NOT NULL;
  END IF;
  
  -- OPCIÓN 3: Fallback a precio de products_modular
  IF room_price IS NULL THEN
    SELECT pm.price INTO room_price
    FROM products_modular pm
    WHERE pm.code = p_room_code AND pm.category = 'alojamiento';
  END IF;
  
  room_price := COALESCE(room_price, 0) * p_nights;
  
  -- ═══════════════════════════════════════════════════════════════
  -- PRODUCTOS DEL PAQUETE: MANTENER LÓGICA DE IVA PARA NO-HABITACIONES
  -- ═══════════════════════════════════════════════════════════════
  
  FOR product_record IN 
    SELECT 
      pr.code, 
      pr.name, 
      pr.per_person, 
      pr.category,
      -- Solo aplicar IVA a productos no-habitación que estén vinculados a productos reales
      CASE 
        WHEN pr.category = 'alojamiento' THEN
          -- Habitaciones: Usar precio directo (YA ES ENTERO)
          pr.price
        WHEN pr.original_id IS NOT NULL THEN
          -- Productos vinculados a productos reales: Aplicar IVA del producto real
          COALESCE(p.saleprice * (1 + COALESCE(p.vat, 19) / 100.0), pr.price) 
        ELSE
          -- Productos modulares puros: Usar precio directo (YA INCLUYE IVA)
          pr.price
      END as final_price
    FROM products_modular pr
    LEFT JOIN "Product" p ON pr.original_id = p.id
    JOIN package_products_modular pp ON pr.id = pp.product_id
    JOIN packages_modular pk ON pp.package_id = pk.id
    WHERE pk.code = p_package_code AND pr.is_active = true
    ORDER BY pp.sort_order
  LOOP
    package_price := package_price + product_record.final_price;
    
    -- Construir detalle del producto
    product_detail := jsonb_build_object(
      'code', product_record.code,
      'name', product_record.name,
      'category', product_record.category,
      'price', product_record.final_price,
      'per_person', product_record.per_person
    );
    
    product_details_array := product_details_array || product_detail;
  END LOOP;
  
  total_price := room_price + package_price;
  
  RETURN QUERY SELECT 
    room_price, 
    total_price, 
    product_details_array;
END;
$$;

-- Verificar que la función fue creada correctamente
SELECT 'Función calculate_package_price_modular creada exitosamente con precios enteros para habitaciones' as resultado;

-- Ejemplo de uso con datos reales del sistema
SELECT * FROM calculate_package_price_modular('habitacion_101', 'DESAYUNO', 2); 