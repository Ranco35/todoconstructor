-- ============================================
-- ACTUALIZAR NOMBRES DE POS
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- Cambiar "Recepción" a "Ventas"
UPDATE "CashRegisterType" 
SET "displayName" = 'Ventas',
    "description" = 'Punto de ventas principal',
    "updatedAt" = NOW()
WHERE "name" = 'recepcion';

-- Cambiar "Restaurante" a "Ventas2"
UPDATE "CashRegisterType" 
SET "displayName" = 'Ventas2',
    "description" = 'Punto de ventas secundario',
    "updatedAt" = NOW()
WHERE "name" = 'restaurante';

-- Actualizar también en función de generación de números de venta
CREATE OR REPLACE FUNCTION generate_sale_number(register_type_id BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    prefix TEXT;
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Obtener prefijo según tipo de caja (ACTUALIZADO)
    SELECT CASE 
        WHEN name = 'recepcion' THEN 'VEN'      -- Cambiar de REC a VEN
        WHEN name = 'restaurante' THEN 'VEN2'   -- Cambiar de REST a VEN2
        ELSE 'GEN'
    END INTO prefix
    FROM "CashRegisterType" 
    WHERE id = register_type_id;
    
    -- Obtener siguiente número
    SELECT COALESCE(MAX(CAST(SUBSTRING(s."saleNumber" FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM "POSSale" s
    JOIN "CashSession" cs ON s."sessionId" = cs.id
    WHERE cs."cashRegisterTypeId" = register_type_id
    AND s."saleNumber" LIKE prefix || '%';
    
    -- Formatear número
    formatted_number := prefix || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$$;

-- Verificar cambios
SELECT 
    "id",
    "name" as nombre_interno,
    "displayName" as nombre_mostrado,
    "description",
    "isActive" as activo
FROM "CashRegisterType"
ORDER BY "id";

