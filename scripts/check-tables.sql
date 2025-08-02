-- Script para verificar las tablas disponibles
-- Ejecutar en Supabase SQL Editor

-- Ver todas las tablas que contengan 'client' en el nombre
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%client%';

-- Ver todas las tablas que contengan 'reservation' en el nombre
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%reservation%';

-- Ver la estructura de la tabla de reservas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
AND table_schema = 'public';

-- Ver la estructura de la tabla modular_reservations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'modular_reservations' 
AND table_schema = 'public'; 