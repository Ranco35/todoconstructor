-- Script para verificar estructura de reservas modulares
-- Ejecutar en Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar tablas existen
SELECT 'reservations' as tabla, count(*) as total_registros FROM reservations
UNION ALL
SELECT 'modular_reservations' as tabla, count(*) as total_registros FROM modular_reservations
UNION ALL
SELECT 'products_modular' as tabla, count(*) as total_registros FROM products_modular
UNION ALL
SELECT 'packages_modular' as tabla, count(*) as total_registros FROM packages_modular;

-- 2. Verificar productos de habitaciones
SELECT 'Habitaciones disponibles:' as info, '' as detalle
UNION ALL
SELECT code as info, name as detalle 
FROM products_modular 
WHERE category = 'alojamiento' AND is_active = true;

-- 3. Verificar paquetes
SELECT 'Paquetes disponibles:' as info, '' as detalle
UNION ALL
SELECT code as info, name as detalle 
FROM packages_modular 
WHERE is_active = true;

-- 4. Verificar vinculaciones paquete-producto
SELECT 'Vinculaciones paquete-producto:' as info, '' as detalle
UNION ALL
SELECT 
  CONCAT('Paquete: ', pk.code, ' → Producto: ', pr.code) as info,
  pr.name as detalle
FROM package_products_modular pp
JOIN packages_modular pk ON pp.package_id = pk.id
JOIN products_modular pr ON pp.product_id = pr.id
ORDER BY pk.code, pr.code;

-- 5. Verificar estructura de tabla reservations
SELECT 'Estructura tabla reservations:' as info, '' as detalle
UNION ALL
SELECT 
  column_name as info,
  CONCAT(data_type, ' - ', CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END) as detalle
FROM information_schema.columns 
WHERE table_name = 'reservations' AND table_schema = 'public';

-- 6. Verificar estructura de tabla modular_reservations  
SELECT 'Estructura tabla modular_reservations:' as info, '' as detalle
UNION ALL
SELECT 
  column_name as info,
  CONCAT(data_type, ' - ', CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END) as detalle
FROM information_schema.columns 
WHERE table_name = 'modular_reservations' AND table_schema = 'public';

-- 7. Verificar función calculate_package_price_modular existe
SELECT 'Función calculate_package_price_modular:' as info, '' as detalle
UNION ALL
SELECT 
  routine_name as info,
  routine_type as detalle
FROM information_schema.routines 
WHERE routine_name = 'calculate_package_price_modular' AND routine_schema = 'public';

-- 8. Probar función de cálculo (si existe)
SELECT 'Test función cálculo:' as info, '' as detalle
UNION ALL
SELECT 
  'Resultado función' as info,
  'Ver siguiente consulta' as detalle;

-- Ejecutar función de prueba (comentar si da error)
-- SELECT * FROM calculate_package_price_modular('DESAYUNO', 'suite_junior', 2, ARRAY[8, 10], 2, ARRAY[]::VARCHAR[]); 