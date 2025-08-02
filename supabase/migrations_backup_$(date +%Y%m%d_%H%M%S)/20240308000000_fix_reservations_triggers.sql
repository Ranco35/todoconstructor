-- ================================================
-- CORRECCIÓN DE TRIGGERS PARA RESERVATIONS
-- Soluciona el error "record 'new' has no field 'updatedAt'"
-- ================================================

-- 1. ELIMINAR TRIGGERS ESPECÍFICOS PROBLEMÁTICOS
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;

-- 2. CREAR O REEMPLAZAR FUNCIÓN CORREGIDA PARA UPDATED_AT
-- Esta función funciona para todas las tablas que tengan columna updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si la columna updated_at existe en la tabla
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = TG_TABLE_NAME AND column_name = 'updated_at'
    ) THEN
        NEW.updated_at = TIMEZONE('utc'::text, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. RECREAR TRIGGERS CON VALIDACIÓN MEJORADA
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at 
    BEFORE UPDATE ON reservations
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. VERIFICAR QUE LAS COLUMNAS UPDATED_AT EXISTEN
-- Si no existen, las agregamos
DO $$
BEGIN
    -- Verificar companies.updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE companies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
    END IF;
    
    -- Verificar reservations.updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'reservations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE reservations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
    END IF;
END $$;

-- 6. ACTUALIZAR REGISTROS EXISTENTES CON UPDATED_AT ACTUAL
UPDATE companies SET updated_at = TIMEZONE('utc'::text, NOW()) WHERE updated_at IS NULL;
UPDATE reservations SET updated_at = TIMEZONE('utc'::text, NOW()) WHERE updated_at IS NULL;

-- ================================================
-- COMENTARIOS DE VERIFICACIÓN
-- ================================================
-- ✅ Triggers corregidos para evitar errores de campo inexistente
-- ✅ Función mejorada con validación de tabla
-- ✅ Verificación de existencia de columnas updated_at
-- ✅ Actualización de registros existentes
-- ================================================ 