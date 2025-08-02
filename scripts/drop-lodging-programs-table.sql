-- ===========================================
-- SCRIPT PARA ELIMINAR TABLA lodging_programs
-- ===========================================
-- La tabla lodging_programs ya no se usa en el sistema
-- El código migró a packages_modular y Product (categoría 26)
-- ===========================================

-- 1. VERIFICAR ESTADO ACTUAL
SELECT 'VERIFICANDO ESTADO ACTUAL:' as info;

-- Verificar si existe la tabla
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') 
        THEN 'Tabla lodging_programs EXISTE'
        ELSE 'Tabla lodging_programs NO EXISTE'
    END as estado_tabla;

-- Verificar si tiene datos
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') 
        THEN (SELECT COUNT(*) FROM lodging_programs)
        ELSE 0
    END as registros_en_tabla;

-- 2. VERIFICAR FOREIGN KEYS
SELECT 'VERIFICANDO DEPENDENCIAS:' as info;

-- Buscar foreign keys que apunten a lodging_programs
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'lodging_programs';

-- 3. VERIFICAR SISTEMA ACTUAL (packages_modular)
SELECT 'VERIFICANDO SISTEMA ACTUAL:' as info;

-- Verificar packages_modular activos
SELECT 
    COUNT(*) as total_packages_modular,
    COUNT(CASE WHEN is_active = true THEN 1 END) as packages_activos
FROM packages_modular;

-- Verificar productos de categoría 26 (Programas Alojamiento)
SELECT 
    COUNT(*) as total_productos_categoria_26
FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
WHERE c.name = 'Programas Alojamiento';

-- 4. ELIMINAR FUNCIONES Y TRIGGERS (si existen)
SELECT 'ELIMINANDO FUNCIONES Y TRIGGERS:' as info;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS update_lodging_programs_updated_at ON lodging_programs;

-- Eliminar función si existe
DROP FUNCTION IF EXISTS update_lodging_programs_updated_at();

-- 5. ELIMINAR TABLA PRINCIPAL
SELECT 'ELIMINANDO TABLA lodging_programs:' as info;

-- Eliminar la tabla completamente
DROP TABLE IF EXISTS lodging_programs CASCADE;

-- 6. ELIMINAR TABLA DE BACKUP (opcional)
SELECT 'LIMPIANDO BACKUPS:' as info;

-- Eliminar backup también (descomenta si deseas)
-- DROP TABLE IF EXISTS lodging_programs_backup;

-- 7. VERIFICAR ELIMINACIÓN
SELECT 'VERIFICANDO ELIMINACIÓN:' as info;

-- Verificar que la tabla fue eliminada
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') 
        THEN '❌ ERROR: Tabla lodging_programs AÚN EXISTE'
        ELSE '✅ SUCCESS: Tabla lodging_programs ELIMINADA'
    END as resultado_eliminacion;

-- 8. MOSTRAR ESTADO FINAL DEL SISTEMA
SELECT 'ESTADO FINAL DEL SISTEMA:' as info;

-- Mostrar packages_modular activos
SELECT 
    id, 
    code, 
    name, 
    description, 
    is_active,
    created_at
FROM packages_modular 
WHERE is_active = true 
ORDER BY sort_order, name;

-- Mostrar productos de categoría Programas Alojamiento
SELECT 
    'PRODUCTOS CATEGORIA PROGRAMAS ALOJAMIENTO:' as info;

SELECT 
    p.id,
    p.name,
    p.saleprice,
    p.sku,
    c.name as categoria
FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
WHERE c.name = 'Programas Alojamiento'
ORDER BY p.saleprice;

-- 9. INFORMACIÓN FINAL
SELECT 'INFORMACIÓN FINAL:' as info;

DO $$
BEGIN
    RAISE NOTICE '✅ TABLA lodging_programs ELIMINADA COMPLETAMENTE';
    RAISE NOTICE '✅ SISTEMA USANDO: packages_modular + Product (categoría 26)';
    RAISE NOTICE '✅ CÓDIGO ACTUALIZADO: real-lodging-programs.ts';
    RAISE NOTICE '✅ LIMPIEZA COMPLETADA EXITOSAMENTE';
END $$; 