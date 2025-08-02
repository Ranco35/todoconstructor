-- Fix: Productos adicionales no deben multiplicar por cantidad de pasajeros
-- Fecha: 2025-01-15
-- Descripción: Corrige la función calculate_package_price_modular para que los productos 
-- adicionales agregados manualmente usen precio fijo en lugar de multiplicar por pasajeros

CREATE OR REPLACE FUNCTION public.calculate_package_price_modular(
  p_package_code character varying, 
  p_room_code character varying, 
  p_adults integer, 
  p_children_ages integer[], 
  p_nights integer, 
  p_additional_products character varying[] DEFAULT '{}'::character varying[]
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
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
BEGIN
  -- 1. HABITACIÓN: Precio directo de products_modular (YA ES FINAL)
  SELECT price INTO room_price
  FROM products_modular 
  WHERE code = p_room_code AND category = 'alojamiento';
  
  room_price := COALESCE(room_price, 0) * p_nights;
  
  -- 2. PRODUCTOS DEL PAQUETE: Precios directos (YA SON FINALES) - SÍ aplican per_person
  FOR product_record IN 
    SELECT pr.code, pr.name, pr.price, pr.per_person, pr.category
    FROM products_modular pr
    JOIN package_products_modular pp ON pr.id = pp.product_id
    JOIN packages_modular pk ON pp.package_id = pk.id
    WHERE pk.code = p_package_code AND pr.is_active = true
    ORDER BY pp.sort_order
  LOOP
    product_total := 0;
    adults_price := 0;
    children_price := 0;
    
    IF product_record.per_person THEN
      -- Precio por adultos (precio directo sin IVA adicional)
      adults_price := p_adults * product_record.price * 1.0;
      
      -- Precio por niños según edad (precio directo sin IVA adicional)
      FOREACH age IN ARRAY p_children_ages
      LOOP
        SELECT age_pricing_modular.multiplier INTO multiplier
        FROM age_pricing_modular
        WHERE age >= min_age AND (max_age IS NULL OR age <= max_age);
        
        children_price := children_price + (product_record.price * COALESCE(multiplier, 0));
      END LOOP;
      
      product_total := (adults_price + children_price) * p_nights;
    ELSE
      -- Precio fijo (precio directo sin IVA adicional)
      product_total := product_record.price * p_nights;
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
      'is_included', true
    );
  END LOOP;
  
  -- 3. PRODUCTOS ADICIONALES (si los hay) - 🔥 CORRECIÓN: NO aplican per_person
  IF p_additional_products IS NOT NULL AND array_length(p_additional_products, 1) > 0 THEN
    FOR product_record IN 
      SELECT pr.code, pr.name, pr.price, pr.per_person, pr.category
      FROM products_modular pr
      WHERE pr.code = ANY(p_additional_products) AND pr.is_active = true
    LOOP
      -- 🔥 CORRECCIÓN CRÍTICA: Productos adicionales usan precio fijo SIEMPRE
      -- No importa si per_person es true, porque el usuario eligió cantidad específica
      product_total := product_record.price * p_nights;
      
      additional_total := additional_total + product_total;
      
      -- Agregar al breakdown
      product_breakdown := product_breakdown || jsonb_build_object(
        'code', product_record.code,
        'name', product_record.name,
        'category', product_record.category,
        'total', product_total,
        'adults_price', 0,  -- No aplica para productos adicionales
        'children_price', 0, -- No aplica para productos adicionales  
        'per_person', false, -- Forzar false para productos adicionales
        'is_included', false
      );
    END LOOP;
  END IF;
  
  -- 4. RETORNAR RESULTADO COMPLETO
  RETURN jsonb_build_object(
    'room_total', room_price,
    'package_total', package_total,
    'additional_total', additional_total,
    'grand_total', room_price + package_total + additional_total,
    'nights', p_nights,
    'daily_average', (room_price + package_total + additional_total) / p_nights,
    'breakdown', product_breakdown
  );
END;
$function$;

-- Comentario explicativo
COMMENT ON FUNCTION public.calculate_package_price_modular(character varying, character varying, integer, integer[], integer, character varying[]) IS 
'Calcula precios de paquetes modulares. Los productos del paquete aplican lógica per_person, pero los productos adicionales usan precio fijo según cantidad especificada por el usuario.'; 