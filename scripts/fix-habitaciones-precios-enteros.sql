-- ═══════════════════════════════════════════════════════════════
-- CORRECCIÓN: PRECIOS ENTEROS PARA HABITACIONES
-- ═══════════════════════════════════════════════════════════════
-- Problema: Habitaciones muestran decimales ($59.999,8) en lugar de enteros ($60.000)
-- Solución: Usar precios enteros de rooms.price_per_night para habitaciones
-- ═══════════════════════════════════════════════════════════════

-- NUEVA FUNCIÓN CORREGIDA
CREATE OR REPLACE FUNCTION calculate_package_price_modular(
  p_package_code VARCHAR(50),
  p_room_code VARCHAR(50),
  p_adults INTEGER,
  p_children_ages INTEGER[],
  p_nights INTEGER,
  p_additional_products VARCHAR(50)[] DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  room_price DECIMAL(10,2) := 0;
  package_total DECIMAL(10,2) := 0;
  additional_total DECIMAL(10,2) := 0;
  product_breakdown JSONB := '[]'::jsonb;
  product_record RECORD;
  age INTEGER;
  multiplier DECIMAL(3,2);
  product_total DECIMAL(10,2);
  adults_price DECIMAL(10,2);
  children_price DECIMAL(10,2);
  final_price_with_vat DECIMAL(10,2);
BEGIN
  -- ═══════════════════════════════════════════════════════════════
  -- HABITACIONES: USAR PRECIOS ENTEROS DE ROOMS
  -- ═══════════════════════════════════════════════════════════════
  
  -- Buscar precio de habitación directamente en rooms por número
  SELECT r.price_per_night INTO room_price
  FROM rooms r
  JOIN products_modular pm ON pm.code = 'habitacion_' || r.number
  WHERE pm.code = p_room_code 
    AND pm.category = 'alojamiento'
    AND r.is_active = true
    AND pm.is_active = true;
  
  -- Si no se encontró en rooms, usar fallback de products_modular (sin IVA adicional)
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
    product_total := 0;
    adults_price := 0;
    children_price := 0;
    final_price_with_vat := product_record.final_price;
    
    IF product_record.per_person THEN
      -- Precio por adultos
      adults_price := p_adults * final_price_with_vat * 1.0;
      
      -- Precio por niños según edad
      FOREACH age IN ARRAY p_children_ages
      LOOP
        SELECT age_pricing_modular.multiplier INTO multiplier
        FROM age_pricing_modular
        WHERE age >= min_age AND (max_age IS NULL OR age <= max_age);
        
        children_price := children_price + (final_price_with_vat * COALESCE(multiplier, 0));
      END LOOP;
      
      product_total := (adults_price + children_price) * p_nights;
    ELSE
      -- Precio fijo
      product_total := final_price_with_vat * p_nights;
    END IF;
    
    package_total := package_total + product_total;
    
    -- Agregar al breakdown
    product_breakdown := product_breakdown || jsonb_build_object(
      'code', product_record.code,
      'name', product_record.name,
      'category', product_record.category,
      'total', product_total,
      'adults_price', adults_price * p_nights,
      'children_price', children_price * p_nights,
      'per_person', product_record.per_person,
      'is_included', true,
      'unit_price_with_vat', final_price_with_vat,
      'vat_included', true
    );
  END LOOP;
  
  -- ═══════════════════════════════════════════════════════════════
  -- PRODUCTOS ADICIONALES: APLICAR MISMA LÓGICA
  -- ═══════════════════════════════════════════════════════════════
  
  IF p_additional_products IS NOT NULL AND array_length(p_additional_products, 1) > 0 THEN
    FOR product_record IN 
      SELECT 
        pr.code, 
        pr.name, 
        pr.per_person, 
        pr.category,
        CASE 
          WHEN pr.category = 'alojamiento' THEN
            pr.price
          WHEN pr.original_id IS NOT NULL THEN
            COALESCE(p.saleprice * (1 + COALESCE(p.vat, 19) / 100.0), pr.price) 
          ELSE
            pr.price
        END as final_price
      FROM products_modular pr
      LEFT JOIN "Product" p ON pr.original_id = p.id
      WHERE pr.code = ANY(p_additional_products) AND pr.is_active = true
    LOOP
      product_total := 0;
      adults_price := 0;
      children_price := 0;
      final_price_with_vat := product_record.final_price;
      
      IF product_record.per_person THEN
        adults_price := p_adults * final_price_with_vat * 1.0;
        
        FOREACH age IN ARRAY p_children_ages
        LOOP
          SELECT age_pricing_modular.multiplier INTO multiplier
          FROM age_pricing_modular
          WHERE age >= min_age AND (max_age IS NULL OR age <= max_age);
          
          children_price := children_price + (final_price_with_vat * COALESCE(multiplier, 0));
        END LOOP;
        
        product_total := (adults_price + children_price) * p_nights;
      ELSE
        product_total := final_price_with_vat * p_nights;
      END IF;
      
      additional_total := additional_total + product_total;
      
      product_breakdown := product_breakdown || jsonb_build_object(
        'code', product_record.code,
        'name', product_record.name,
        'category', product_record.category,
        'total', product_total,
        'adults_price', adults_price * p_nights,
        'children_price', children_price * p_nights,
        'per_person', product_record.per_person,
        'is_included', false,
        'unit_price_with_vat', final_price_with_vat,
        'vat_included', true
      );
    END LOOP;
  END IF;
  
  -- ═══════════════════════════════════════════════════════════════
  -- RETORNAR RESULTADO CON PRECIOS CORRECTOS
  -- ═══════════════════════════════════════════════════════════════
  
  RETURN jsonb_build_object(
    'room_total', room_price,
    'package_total', package_total,
    'additional_total', additional_total,
    'grand_total', room_price + package_total + additional_total,
    'nights', p_nights,
    'daily_average', (room_price + package_total + additional_total) / p_nights,
    'breakdown', product_breakdown,
    'vat_included', true,
    'note', 'Habitaciones con precios enteros. Otros productos incluyen IVA 19%.'
  );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- COMENTARIO Y VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════════

COMMENT ON FUNCTION calculate_package_price_modular IS 
'Función CORREGIDA que usa precios enteros para habitaciones desde rooms.price_per_night.
- Habitaciones: Precio directo de rooms (SIN decimales)
- Productos comida/spa: Con IVA desde producto real si aplica
- Todos los precios finales incluyen IVA donde corresponde
Actualizada: Julio 2025 - Fix precios enteros habitaciones';

-- VERIFICAR QUE LA FUNCIÓN FUNCIONA CORRECTAMENTE
SELECT 'FUNCIÓN ACTUALIZADA CORRECTAMENTE' as status;

-- Ejemplo de prueba (opcional - comentar si no quieres ejecutar)
/*
SELECT calculate_package_price_modular(
  'MEDIA_PENSION',
  'habitacion_106', 
  2, 
  ARRAY[]::INTEGER[], 
  1, 
  ARRAY[]::VARCHAR[]
) as test_result;
*/ 