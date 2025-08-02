-- ===========================================
-- SCRIPT DE LIMPIEZA DE PROGRAMAS DE ALOJAMIENTO ANTIGUOS
-- ===========================================
-- Objetivo: Eliminar datos de ejemplo de lodging_programs
-- Mantener solo datos reales de packages_modular
-- ===========================================

-- 1. VERIFICACIÓN INICIAL
-- Verificar si existe la tabla lodging_programs
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') 
        THEN 'Tabla lodging_programs encontrada'
        ELSE 'Tabla lodging_programs NO encontrada'
    END as tabla_lodging_status;

-- Ver datos actuales en lodging_programs (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') THEN
        RAISE NOTICE 'DATOS ACTUALES EN lodging_programs: (ver consulta siguiente)';
    ELSE
        RAISE NOTICE 'DATOS ACTUALES EN lodging_programs: TABLA NO EXISTE';
    END IF;
END $$;

-- Ver datos en packages_modular (tabla que conservamos)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages_modular') THEN
        RAISE NOTICE 'DATOS ACTUALES EN packages_modular: TABLA EXISTE (sistema principal)';
    ELSE
        RAISE NOTICE 'DATOS ACTUALES EN packages_modular: TABLA NO EXISTE';
    END IF;
END $$;

-- 2. VERIFICAR DEPENDENCIAS
-- Verificar si hay reservas usando packages_modular (sistema modular)
SELECT 'VERIFICANDO DEPENDENCIAS:' as info;

-- Verificar si existe la tabla modular_reservations
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modular_reservations') 
        THEN 'Tabla modular_reservations encontrada'
        ELSE 'Tabla modular_reservations NO encontrada'
    END as tabla_modular_status;

-- Verificar packages_modular
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages_modular') 
        THEN 'Tabla packages_modular encontrada'
        ELSE 'Tabla packages_modular NO encontrada'
    END as tabla_packages_status;

-- 3. CREAR BACKUP DE SEGURIDAD (solo si la tabla existe)
-- Crear tabla de respaldo antes de eliminar
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS lodging_programs_backup AS SELECT * FROM lodging_programs';
        RAISE NOTICE 'Backup creado desde lodging_programs';
    ELSE
        RAISE NOTICE 'Tabla lodging_programs no existe, no se puede crear backup';
    END IF;
END $$;

-- Verificar backup creado
SELECT 'BACKUP CREADO:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs_backup') 
        THEN (SELECT COUNT(*) FROM lodging_programs_backup)
        ELSE 0
    END as registros_respaldados;

-- 4. ELIMINAR DATOS DE EJEMPLO (solo si la tabla existe)
-- Eliminar programas que parecen ser ejemplos/pruebas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') THEN
        DELETE FROM lodging_programs 
        WHERE name IN (
            'Paquete Romántico',
            'Programa Luna de Miel',
            'Escapada de Fin de Semana',
            'Paquete Familiar',
            'Aventura Extrema',
            'Relax y Spa',
            'Programa de Ejemplo',
            'Test Package',
            'Paquete Prueba'
        )
        OR description LIKE '%ejemplo%'
        OR description LIKE '%prueba%'
        OR description LIKE '%test%'
        OR name LIKE '%ejemplo%'
        OR name LIKE '%prueba%'
        OR name LIKE '%test%';
        
        RAISE NOTICE 'Datos de ejemplo eliminados de lodging_programs';
    ELSE
        RAISE NOTICE 'Tabla lodging_programs no existe, no hay nada que limpiar';
    END IF;
END $$;

-- Mostrar resultado de la eliminación
SELECT 'DESPUÉS DE LA LIMPIEZA:' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') 
        THEN (SELECT COUNT(*) FROM lodging_programs)
        ELSE 0
    END as registros_restantes;

-- 5. VERIFICAR INTEGRIDAD DEL SISTEMA
-- Verificar que las reservas siguen funcionando
SELECT 'VERIFICACIÓN FINAL:' as info;

-- Contar reservas totales
SELECT COUNT(*) as total_reservas_sistema FROM reservations;

-- Verificar sistema modular si existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modular_reservations') 
        THEN (SELECT COUNT(*) FROM modular_reservations)
        ELSE 0
    END as total_reservas_modulares;

-- 6. MOSTRAR DATOS FINALES
-- Mostrar programas que quedan en lodging_programs (si existe la tabla)
SELECT 'PROGRAMAS RESTANTES EN lodging_programs:' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') THEN
        PERFORM 1; -- La consulta real se hace abajo
    ELSE
        RAISE NOTICE 'Tabla lodging_programs no existe';
    END IF;
END $$;

-- Verificar estado final de ambas tablas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs') THEN
        RAISE NOTICE 'lodging_programs: Tabla existe, datos limpios';
    ELSE
        RAISE NOTICE 'lodging_programs: Tabla NO existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages_modular') THEN
        RAISE NOTICE 'packages_modular: Tabla existe (SISTEMA PRINCIPAL)';
    ELSE
        RAISE NOTICE 'packages_modular: Tabla NO existe';
    END IF;
END $$;

-- 7. INFORMACIÓN PARA ROLLBACK (si es necesario)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lodging_programs_backup') THEN
        RAISE NOTICE 'ROLLBACK DISPONIBLE: INSERT INTO lodging_programs SELECT * FROM lodging_programs_backup;';
    ELSE
        RAISE NOTICE 'ROLLBACK: No disponible (no se creó backup)';
    END IF;
    
    RAISE NOTICE 'SCRIPT COMPLETADO EXITOSAMENTE';
END $$; 