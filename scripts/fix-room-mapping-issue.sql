-- DIAGNÓSTICO Y CORRECCIÓN: Problema room_id_fkey en reservas modulares

-- 1. VERIFICAR ESTADO ACTUAL
SELECT 'HABITACIONES EN TABLA ROOMS' as seccion;
SELECT id, number, type, price_per_night FROM rooms ORDER BY id;

SELECT 'PRODUCTOS MODULARES DE HABITACIONES' as seccion;
SELECT id, code, name, category FROM products_modular WHERE category = 'alojamiento' ORDER BY id;

-- 2. VERIFICAR MAPEO DE CÓDIGOS
SELECT 'MAPEO DE CÓDIGOS' as seccion;
SELECT 
  'suite_junior' as codigo_modular, 
  'JR' as codigo_room_esperado,
  (SELECT id FROM rooms WHERE number = 'JR') as room_id_real,
  CASE 
    WHEN (SELECT id FROM rooms WHERE number = 'JR') IS NOT NULL THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as estado
UNION ALL
SELECT 
  'habitacion_estandar' as codigo_modular, 
  'STD' as codigo_room_esperado,
  (SELECT id FROM rooms WHERE number = 'STD') as room_id_real,
  CASE 
    WHEN (SELECT id FROM rooms WHERE number = 'STD') IS NOT NULL THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as estado
UNION ALL
SELECT 
  'suite_matrimonial' as codigo_modular, 
  'MAT' as codigo_room_esperado,
  (SELECT id FROM rooms WHERE number = 'MAT') as room_id_real,
  CASE 
    WHEN (SELECT id FROM rooms WHERE number = 'MAT') IS NOT NULL THEN '✅ EXISTE'
    ELSE '❌ NO EXISTE'
  END as estado;

-- 3. CREAR HABITACIONES FALTANTES SI NO EXISTEN
-- Solo ejecutar este bloque si las habitaciones no existen

-- Crear habitaciones con códigos cortos si no existen
INSERT INTO rooms (number, type, capacity, floor, price_per_night)
SELECT 'STD', 'Habitación Estándar', 2, 1, 50000
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE number = 'STD');

INSERT INTO rooms (number, type, capacity, floor, price_per_night)
SELECT 'JR', 'Suite Junior', 2, 2, 60000
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE number = 'JR');

INSERT INTO rooms (number, type, capacity, floor, price_per_night)
SELECT 'MAT', 'Suite Matrimonial', 2, 3, 70000
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE number = 'MAT');

INSERT INTO rooms (number, type, capacity, floor, price_per_night)
SELECT 'PREM', 'Suite Premium', 4, 3, 85000
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE number = 'PREM');

-- 4. VERIFICAR RESULTADO FINAL
SELECT 'HABITACIONES DESPUÉS DE CORRECCIÓN' as seccion;
SELECT id, number, type, price_per_night FROM rooms ORDER BY id;

-- 5. VERIFICAR MAPEO FINAL
SELECT 'MAPEO FINAL VERIFICADO' as seccion;
SELECT 
  codigo_modular,
  codigo_room_esperado,
  room_id_real,
  CASE 
    WHEN room_id_real IS NOT NULL THEN '✅ LISTO PARA USAR'
    ELSE '❌ PROBLEMA PERSISTENTE'
  END as estado_final
FROM (
  SELECT 
    'suite_junior' as codigo_modular, 
    'JR' as codigo_room_esperado,
    (SELECT id FROM rooms WHERE number = 'JR') as room_id_real
  UNION ALL
  SELECT 
    'habitacion_estandar' as codigo_modular, 
    'STD' as codigo_room_esperado,
    (SELECT id FROM rooms WHERE number = 'STD') as room_id_real
  UNION ALL
  SELECT 
    'suite_matrimonial' as codigo_modular, 
    'MAT' as codigo_room_esperado,
    (SELECT id FROM rooms WHERE number = 'MAT') as room_id_real
) as mapeo_final; 