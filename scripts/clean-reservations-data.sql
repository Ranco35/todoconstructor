-- ================================================
-- SCRIPT DE LIMPIEZA COMPLETA - MÓDULO RESERVAS
-- Admin Termas - Limpiar datos y empezar desde cero
-- ================================================

-- IMPORTANTE: Este script elimina TODOS los datos de reservas
-- pero mantiene la estructura de las tablas intacta.

BEGIN;

-- 1. ELIMINAR DATOS RELACIONADOS (orden de dependencias)
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE reservation_comments CASCADE;
TRUNCATE TABLE reservation_products CASCADE;
TRUNCATE TABLE reservations CASCADE;

-- 2. ELIMINAR DATOS DE EMPRESAS
TRUNCATE TABLE company_contacts CASCADE;
TRUNCATE TABLE companies CASCADE;

-- 3. ELIMINAR PRODUCTOS DEL SPA (ejemplos)
TRUNCATE TABLE spa_products CASCADE;

-- 4. REINICIAR SECUENCIAS DE AUTO-INCREMENTO
-- Para que los próximos IDs empiecen desde 1
ALTER SEQUENCE IF EXISTS reservations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reservation_products_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reservation_comments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS companies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS company_contacts_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS spa_products_id_seq RESTART WITH 1;

-- 5. VERIFICAR LIMPIEZA (opcional)
SELECT 
  'reservations' as tabla, COUNT(*) as registros FROM reservations
UNION ALL
SELECT 
  'reservation_products' as tabla, COUNT(*) as registros FROM reservation_products
UNION ALL
SELECT 
  'reservation_comments' as tabla, COUNT(*) as registros FROM reservation_comments
UNION ALL
SELECT 
  'payments' as tabla, COUNT(*) as registros FROM payments
UNION ALL
SELECT 
  'companies' as tabla, COUNT(*) as registros FROM companies
UNION ALL
SELECT 
  'company_contacts' as tabla, COUNT(*) as registros FROM company_contacts
UNION ALL
SELECT 
  'spa_products' as tabla, COUNT(*) as registros FROM spa_products;

COMMIT;

-- ================================================
-- RESUMEN DE LIMPIEZA:
-- ================================================
-- ✅ Reservas: ELIMINADAS
-- ✅ Productos de reservas: ELIMINADOS
-- ✅ Comentarios de reservas: ELIMINADOS
-- ✅ Pagos: ELIMINADOS
-- ✅ Empresas: ELIMINADAS
-- ✅ Contactos de empresas: ELIMINADOS
-- ✅ Productos del spa: ELIMINADOS
-- ✅ Secuencias: REINICIADAS
-- 
-- ❌ Habitaciones: MANTENIDAS (no afectadas)
-- ❌ Usuarios: MANTENIDOS (no afectados)
-- ❌ Estructura de tablas: MANTENIDA
--
-- 🎉 Sistema listo para empezar desde cero!
-- ================================================ 