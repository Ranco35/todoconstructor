-- DIAGNÓSTICO SIMPLE: Verificar habitaciones existentes

-- Habitaciones actuales en tabla rooms
SELECT id, number, type, price_per_night FROM rooms;

-- Productos modulares de habitaciones
SELECT id, code, name FROM products_modular WHERE category = 'alojamiento';

-- Todas las consultas relacionadas con STD, JR, MAT, PREM han sido eliminadas por obsoletas.

-- Verificar resultado final
SELECT id, number, type, price_per_night FROM rooms ORDER BY id; 