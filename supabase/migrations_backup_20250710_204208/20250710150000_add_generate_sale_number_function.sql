-- Función para generar números de venta únicos por tipo de POS
CREATE OR REPLACE FUNCTION generate_sale_number(register_type_id INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    prefix TEXT;
    counter INTEGER;
    sale_number TEXT;
BEGIN
    -- Obtener el prefijo según el tipo de registro
    CASE register_type_id
        WHEN 1 THEN prefix := 'REC-';
        WHEN 2 THEN prefix := 'REST-';
        ELSE prefix := 'POS-';
    END CASE;
    
    -- Obtener el próximo número secuencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
    INTO counter
    FROM "POSSale" ps
    JOIN "CashSession" cs ON ps."sessionId" = cs.id
    WHERE cs."cashRegisterTypeId" = register_type_id
    AND ps.sale_number LIKE prefix || '%';
    
    -- Formatear el número con ceros a la izquierda
    sale_number := prefix || LPAD(counter::TEXT, 6, '0');
    
    RETURN sale_number;
END;
$$; 