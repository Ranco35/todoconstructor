-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: CORREGIR FUNCIÓN PRECIO FINAL CON IVA INCLUIDO
-- ═══════════════════════════════════════════════════════════════
-- Fecha: Julio 4, 2025
-- Propósito: Corregir función calculate_package_price_modular para usar
--           precio final con IVA incluido y retornar campos correctos
-- ═══════════════════════════════════════════════════════════════

-- Primero eliminar la función existente para evitar conflictos
DROP FUNCTION IF EXISTS calculate_package_price_modular(VARCHAR, VARCHAR, INTEGER, INTEGER[], INTEGER, VARCHAR[]);

-- Función corregida que usa precio final con IVA incluido y retorna todos los campos
CREATE FUNCTION calculate_package_price_modular(
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
  -- Obtener precio de habitación con IVA incluido
  SELECT 
    CASE 
      WHEN pm.original_id IS NOT NULL THEN
        -- Si está vinculado a producto real, usar precio final con IVA desde producto real
        COALESCE(p.saleprice * (1 + COALESCE(p.vat, 19) / 100.0), pm.price)
      ELSE
        -- Si es producto modular puro, usar precio directamente (YA INCLUYE IVA)
        pm.price
    END
  INTO room_price
  FROM products_modular pm
  LEFT JOIN "Product" p ON pm.original_id = p.id
  WHERE pm.code = p_room_code AND pm.category = 'alojamiento';
  
  room_price := COALESCE(room_price, 0) * p_nights;
  
  -- Calcular productos incluidos en el paquete
  FOR product_record IN 
    SELECT 
      pr.code, 
      pr.name, 
      pr.per_person, 
      pr.category,
      -- Calcular precio final con IVA incluido CORRECTAMENTE
      CASE 
        WHEN pr.original_id IS NOT NULL THEN
          -- Si está vinculado a producto real, usar precio final con IVA desde producto real
          COALESCE(p.saleprice * (1 + COALESCE(p.vat, 19) / 100.0), pr.price) 
        ELSE
          -- Si es producto modular puro, usar precio directamente (YA INCLUYE IVA)
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
    
    -- Agregar al breakdown CON TODOS LOS CAMPOS
    product_breakdown := product_breakdown || jsonb_build_object(
      'code', product_record.code,
      'name', product_record.name,
      'category', product_record.category,
      'total', product_total,
      'adults_price', adults_price * p_nights,
      'children_price', children_price * p_nights,
      'per_person', product_record.per_person,
      'is_included', true,
      'unit_price_with_vat', final_price_with_vat
    );
  END LOOP;
  
  -- Calcular productos adicionales si los hay
  IF array_length(p_additional_products, 1) > 0 THEN
    FOR product_record IN 
      SELECT 
        pr.code, 
        pr.name, 
        pr.per_person, 
        pr.category,
        CASE 
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
        'unit_price_with_vat', final_price_with_vat
      );
    END LOOP;
  END IF;
  
  -- Retornar resultado completo CON TODOS LOS CAMPOS
  RETURN jsonb_build_object(
    'room_total', room_price,
    'package_total', package_total,
    'additional_total', additional_total,
    'grand_total', room_price + package_total + additional_total,
    'nights', p_nights,
    'daily_average', (room_price + package_total + additional_total) / p_nights,
    'breakdown', product_breakdown,
    'vat_included', true,
    'note', 'Todos los precios incluyen IVA 19%'
  );
END;
$$ LANGUAGE plpgsql;

-- Comentario explicativo
COMMENT ON FUNCTION calculate_package_price_modular IS 
'Función que usa precio final con IVA incluido correctamente.
Para productos vinculados: usa saleprice * (1 + vat/100) del producto real.
Para productos modulares: usa price directamente (YA INCLUYE IVA).
Retorna unit_price_with_vat, vat_included y note.'; 