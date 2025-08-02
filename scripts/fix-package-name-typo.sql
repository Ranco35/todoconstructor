-- ================================================
-- CORREGIR ERROR TIPOGRÁFICO EN NOMBRE DE PAQUETE
-- ================================================

-- Corregir el error tipográfico en el nombre del paquete
UPDATE packages_modular 
SET name = 'Media Pensión'
WHERE name = 'Media Pensióm';

-- Verificar que se corrigió correctamente
SELECT 
    id,
    name,
    code
FROM packages_modular 
WHERE name ILIKE '%pensión%'
ORDER BY name;

-- Verificar que las reservas ahora muestran el nombre correcto
SELECT
    r.id AS reservation_id,
    CONCAT(c."nombrePrincipal", ' ', COALESCE(c."apellido", '')) AS client_full_name,
    p.name AS package_name
FROM modular_reservations r
LEFT JOIN "Client" c ON r.client_id = c.id
LEFT JOIN packages_modular p ON r.package_modular_id = p.id
WHERE r.id IN (29, 28, 27, 26, 25, 24, 16, 13)
ORDER BY r.id; 