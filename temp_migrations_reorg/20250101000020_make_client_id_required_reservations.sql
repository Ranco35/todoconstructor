-- Migración: Hacer client_id obligatorio en reservas
-- Fecha: 2025-01-01
-- Descripción: Asegurar que todas las reservas tengan un cliente principal asociado

-- 1. Verificar que no hay reservas sin client_id
DO $$
BEGIN
    -- Verificar reservas sin client_id
    IF EXISTS (SELECT 1 FROM reservations WHERE client_id IS NULL) THEN
        RAISE EXCEPTION 'Existen reservas sin client_id. Debe asignar un cliente antes de continuar.';
    END IF;
    
    -- Verificar modular_reservations sin client_id
    IF EXISTS (SELECT 1 FROM modular_reservations WHERE client_id IS NULL) THEN
        RAISE EXCEPTION 'Existen reservas modulares sin client_id. Debe asignar un cliente antes de continuar.';
    END IF;
END $$;

-- 2. Hacer client_id NOT NULL en la tabla reservations
ALTER TABLE reservations 
ALTER COLUMN client_id SET NOT NULL;

-- 3. Hacer client_id NOT NULL en la tabla modular_reservations
ALTER TABLE modular_reservations 
ALTER COLUMN client_id SET NOT NULL;

-- 4. Agregar índices para optimizar búsquedas por cliente
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_modular_reservations_client_id ON modular_reservations(client_id);

-- 5. Agregar índices para búsqueda de clientes por nombre y RUT
CREATE INDEX IF NOT EXISTS idx_client_nombre_principal ON "Client"(nombrePrincipal);
CREATE INDEX IF NOT EXISTS idx_client_rut ON "Client"(rut);

-- 6. Verificar que las restricciones se aplicaron correctamente
DO $$
BEGIN
    -- Verificar que client_id es NOT NULL en reservations
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' 
        AND column_name = 'client_id' 
        AND is_nullable = 'YES'
    ) THEN
        RAISE EXCEPTION 'La columna client_id en reservations aún permite NULL';
    END IF;
    
    -- Verificar que client_id es NOT NULL en modular_reservations
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'modular_reservations' 
        AND column_name = 'client_id' 
        AND is_nullable = 'YES'
    ) THEN
        RAISE EXCEPTION 'La columna client_id en modular_reservations aún permite NULL';
    END IF;
    
    RAISE NOTICE '✅ Migración completada exitosamente. Todas las reservas ahora requieren un cliente principal.';
END $$; 