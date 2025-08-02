-- VERIFICAR MAPEO DE HABITACIONES ESPECÍFICO

-- Verificar IDs exactas que debería encontrar el sistema
SELECT 
  'suite_junior' as codigo_modular,
  'JR' as codigo_room,
  (SELECT id FROM rooms WHERE number = 'JR') as room_id_encontrado,
  (SELECT type FROM rooms WHERE number = 'JR') as tipo_habitacion
UNION ALL
SELECT 
  'habitacion_estandar' as codigo_modular,
  'STD' as codigo_room,
  (SELECT id FROM rooms WHERE number = 'STD') as room_id_encontrado,
  (SELECT type FROM rooms WHERE number = 'STD') as tipo_habitacion
UNION ALL
SELECT 
  'suite_matrimonial' as codigo_modular,
  'MAT' as codigo_room,
  (SELECT id FROM rooms WHERE number = 'MAT') as room_id_encontrado,
  (SELECT type FROM rooms WHERE number = 'MAT') as tipo_habitacion;

-- Verificar que estos IDs son válidos para foreign key
SELECT 
  'Habitaciones con códigos cortos' as seccion,
  id, 
  number, 
  type,
  CASE 
    WHEN id IN (23, 24, 25, 26) THEN '✅ VÁLIDO PARA RESERVAS'
    ELSE '❓ OTRO'
  END as estado
FROM rooms 
WHERE number IN ('STD', 'JR', 'MAT', 'PREM')
ORDER BY id; 