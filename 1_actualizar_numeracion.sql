-- ============================================
-- 1. ACTUALIZAR FUNCIÓN DE NUMERACIÓN
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

SELECT '✅ Función actualizada correctamente' as resultado;

