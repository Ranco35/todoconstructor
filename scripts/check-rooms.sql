-- Verificar habitaciones existentes en tabla rooms:
SELECT id, number, type, price_per_night FROM rooms ORDER BY id;

-- Verificar productos modulares de habitaciones:
SELECT id, code, name, category FROM products_modular WHERE category = 'alojamiento' ORDER BY id;

-- Todas las consultas relacionadas con STD, JR, MAT, PREM han sido eliminadas por obsoletas. 