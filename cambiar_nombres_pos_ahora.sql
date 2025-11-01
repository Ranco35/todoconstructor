-- ============================================
-- CAMBIAR NOMBRES DE POS
-- Recepción → Ventas
-- Restaurante → Ventas2
-- ============================================

-- Cambiar "Recepción" a "Ventas"
UPDATE "CashRegisterType" 
SET 
    "displayName" = 'Ventas',
    "description" = 'Punto de ventas principal',
    "updatedAt" = NOW()
WHERE "name" = 'recepcion';

-- Cambiar "Restaurante" a "Ventas2"
UPDATE "CashRegisterType" 
SET 
    "displayName" = 'Ventas2',
    "description" = 'Punto de ventas secundario',
    "updatedAt" = NOW()
WHERE "name" = 'restaurante';

-- Actualizar función de numeración de ventas
CREATE OR REPLACE FUNCTION generate_sale_number(register_type_id BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    prefix TEXT;
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    -- Obtener prefijo según tipo de caja
    SELECT CASE 
        WHEN name = 'recepcion' THEN 'VEN'      -- Nuevo prefijo para Ventas
        WHEN name = 'restaurante' THEN 'VEN2'   -- Nuevo prefijo para Ventas2
        ELSE 'GEN'
    END INTO prefix
    FROM "CashRegisterType" 
    WHERE id = register_type_id;
    
    -- Obtener siguiente número
    SELECT COALESCE(MAX(CAST(SUBSTRING(s."saleNumber" FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM "POSSale" s
    LEFT JOIN "CashSession" cs ON s."sessionId" = cs.id
    WHERE (cs."cashRegisterTypeId" = register_type_id OR s."sessionId" IS NULL)
    AND s."saleNumber" LIKE prefix || '%';
    
    -- Formatear número
    formatted_number := prefix || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$$;

-- ============================================
-- VERIFICAR CAMBIOS
-- ============================================

SELECT 
    '✅ CAMBIOS APLICADOS - Verificación:' as resultado;

SELECT 
    "id",
    "name" as nombre_interno,
    "displayName" as nombre_mostrado,
    "description" as descripcion,
    "isActive" as activo
FROM "CashRegisterType"
ORDER BY "id";

-- Resultado esperado:
-- id | nombre_interno | nombre_mostrado | descripcion                   | activo
-- 1  | recepcion      | Ventas          | Punto de ventas principal     | true
-- 2  | restaurante    | Ventas2         | Punto de ventas secundario    | true

