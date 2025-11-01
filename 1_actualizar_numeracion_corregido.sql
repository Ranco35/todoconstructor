-- ============================================
-- 1. ACTUALIZAR FUNCIÓN DE NUMERACIÓN (CORREGIDO)
-- Sin dependencia de CashSession
-- ============================================

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
        WHEN "displayName" ILIKE '%ferreteria2%' THEN 'FER2'
        WHEN "displayName" ILIKE '%ferreteria%' THEN 'FER'
        WHEN name = 'ferreteria' AND id = 1 THEN 'FER'
        WHEN name = 'restaurante' AND id = 2 THEN 'FER2'
        ELSE 'GEN'
    END INTO prefix
    FROM "CashRegisterType" 
    WHERE id = register_type_id;
    
    -- Obtener siguiente número (SIN usar CashSession)
    SELECT COALESCE(MAX(CAST(SUBSTRING(s."saleNumber" FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM "POSSale" s
    WHERE s."saleNumber" LIKE prefix || '%';
    
    -- Formatear número
    formatted_number := prefix || '-' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN formatted_number;
END;
$$;

SELECT '✅ Función actualizada correctamente (sin CashSession)' as resultado;

-- Probar la función
SELECT 
    "id" as tipo_id,
    "displayName" as pos,
    generate_sale_number("id") as proximo_numero
FROM "CashRegisterType"
ORDER BY "id";

