-- ========================================
-- CORRECCIÓN DE POLÍTICAS RLS - MÓDULO DE RESERVAS
-- ========================================
-- Script para resolver error: "Could not find a relationship between 'reservation_products' and 'spa_products'"
-- Patrón estándar del proyecto: 2 políticas por tabla (authenticated + service_role)

-- 1. TABLA RESERVATIONS
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on reservations" ON reservations;
DROP POLICY IF EXISTS "Enable all for service role on reservations" ON reservations;

-- Crear políticas permisivas para reservations
CREATE POLICY "Allow all operations on reservations" ON reservations
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on reservations" ON reservations
    FOR ALL USING (true);

-- 2. TABLA RESERVATION_PRODUCTS
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on reservation_products" ON reservation_products;
DROP POLICY IF EXISTS "Enable all for service role on reservation_products" ON reservation_products;

-- Crear políticas permisivas para reservation_products
CREATE POLICY "Allow all operations on reservation_products" ON reservation_products
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on reservation_products" ON reservation_products
    FOR ALL USING (true);

-- 3. TABLA RESERVATION_COMMENTS
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on reservation_comments" ON reservation_comments;
DROP POLICY IF EXISTS "Enable all for service role on reservation_comments" ON reservation_comments;

-- Crear políticas permisivas para reservation_comments
CREATE POLICY "Allow all operations on reservation_comments" ON reservation_comments
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on reservation_comments" ON reservation_comments
    FOR ALL USING (true);

-- 4. TABLA PAYMENTS
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on payments" ON payments;
DROP POLICY IF EXISTS "Enable all for service role on payments" ON payments;

-- Crear políticas permisivas para payments
CREATE POLICY "Allow all operations on payments" ON payments
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on payments" ON payments
    FOR ALL USING (true);

-- 5. TABLA COMPANIES
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on companies" ON companies;
DROP POLICY IF EXISTS "Enable all for service role on companies" ON companies;

-- Crear políticas permisivas para companies
CREATE POLICY "Allow all operations on companies" ON companies
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on companies" ON companies
    FOR ALL USING (true);

-- 6. TABLA COMPANY_CONTACTS
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on company_contacts" ON company_contacts;
DROP POLICY IF EXISTS "Enable all for service role on company_contacts" ON company_contacts;

-- Crear políticas permisivas para company_contacts
CREATE POLICY "Allow all operations on company_contacts" ON company_contacts
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on company_contacts" ON company_contacts
    FOR ALL USING (true);

-- 7. TABLA ROOMS
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on rooms" ON rooms;
DROP POLICY IF EXISTS "Enable all for service role on rooms" ON rooms;

-- Crear políticas permisivas para rooms
CREATE POLICY "Allow all operations on rooms" ON rooms
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on rooms" ON rooms
    FOR ALL USING (true);

-- 8. TABLA SPA_PRODUCTS
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on spa_products" ON spa_products;
DROP POLICY IF EXISTS "Enable all for service role on spa_products" ON spa_products;

-- Crear políticas permisivas para spa_products
CREATE POLICY "Allow all operations on spa_products" ON spa_products
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on spa_products" ON spa_products
    FOR ALL USING (true);

-- 9. TABLA MODULAR_RESERVATIONS
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on modular_reservations" ON modular_reservations;
DROP POLICY IF EXISTS "Enable all for service role on modular_reservations" ON modular_reservations;

-- Crear políticas permisivas para modular_reservations
CREATE POLICY "Allow all operations on modular_reservations" ON modular_reservations
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on modular_reservations" ON modular_reservations
    FOR ALL USING (true);

-- 10. TABLA PACKAGES_MODULAR
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on packages_modular" ON packages_modular;
DROP POLICY IF EXISTS "Enable all for service role on packages_modular" ON packages_modular;

-- Crear políticas permisivas para packages_modular
CREATE POLICY "Allow all operations on packages_modular" ON packages_modular
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on packages_modular" ON packages_modular
    FOR ALL USING (true);

-- 11. TABLA PRODUCTS_MODULAR
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on products_modular" ON products_modular;
DROP POLICY IF EXISTS "Enable all for service role on products_modular" ON products_modular;

-- Crear políticas permisivas para products_modular
CREATE POLICY "Allow all operations on products_modular" ON products_modular
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on products_modular" ON products_modular
    FOR ALL USING (true);

-- 12. TABLA PACKAGE_PRODUCTS_MODULAR
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on package_products_modular" ON package_products_modular;
DROP POLICY IF EXISTS "Enable all for service role on package_products_modular" ON package_products_modular;

-- Crear políticas permisivas para package_products_modular
CREATE POLICY "Allow all operations on package_products_modular" ON package_products_modular
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on package_products_modular" ON package_products_modular
    FOR ALL USING (true);

-- 13. TABLA AGE_PRICING_MODULAR
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow all operations on age_pricing_modular" ON age_pricing_modular;
DROP POLICY IF EXISTS "Enable all for service role on age_pricing_modular" ON age_pricing_modular;

-- Crear políticas permisivas para age_pricing_modular
CREATE POLICY "Allow all operations on age_pricing_modular" ON age_pricing_modular
    FOR ALL USING (true);

CREATE POLICY "Enable all for service role on age_pricing_modular" ON age_pricing_modular
    FOR ALL USING (true);

-- ========================================
-- VERIFICACIÓN DE POLÍTICAS CREADAS
-- ========================================

-- Verificar que todas las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN (
    'reservations',
    'reservation_products', 
    'reservation_comments',
    'payments',
    'companies',
    'company_contacts',
    'rooms',
    'spa_products',
    'modular_reservations',
    'packages_modular',
    'products_modular',
    'package_products_modular',
    'age_pricing_modular'
)
ORDER BY tablename, policyname;

-- ========================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ========================================

COMMENT ON TABLE reservations IS 'Tabla principal de reservas del hotel';
COMMENT ON TABLE reservation_products IS 'Productos asociados a cada reserva';
COMMENT ON TABLE reservation_comments IS 'Comentarios y observaciones de reservas';
COMMENT ON TABLE payments IS 'Pagos realizados por reservas';
COMMENT ON TABLE companies IS 'Empresas corporativas que realizan reservas';
COMMENT ON TABLE company_contacts IS 'Contactos de empresas corporativas';
COMMENT ON TABLE rooms IS 'Habitaciones disponibles del hotel';
COMMENT ON TABLE spa_products IS 'Productos y servicios del spa';
COMMENT ON TABLE modular_reservations IS 'Reservas del sistema modular con precios congelados';
COMMENT ON TABLE packages_modular IS 'Paquetes de servicios modulares';
COMMENT ON TABLE products_modular IS 'Productos del sistema modular';
COMMENT ON TABLE package_products_modular IS 'Relación entre paquetes y productos modulares';
COMMENT ON TABLE age_pricing_modular IS 'Multiplicadores de precio por edad';

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
-- Ejecutar este script en Supabase SQL Editor para resolver el error de relaciones
-- entre reservation_products y spa_products en el esquema cache 