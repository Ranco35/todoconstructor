-- ============================================
-- CAMBIAR NOMBRES DE POS (PERSONALIZADO)
-- Ferretería → Ventas
-- Ventas2 → Mantener
-- ============================================

-- Cambiar "Ferretería" a "Ventas" (ID 1)
UPDATE "CashRegisterType" 
SET 
    "displayName" = 'Ventas',
    "description" = 'Punto de ventas principal',
    "updatedAt" = NOW()
WHERE "id" = 1 OR "name" = 'ferreteria';

-- Asegurar que Ventas2 esté correcto (ID 2)
UPDATE "CashRegisterType" 
SET 
    "displayName" = 'Ventas2',
    "description" = 'Punto de ventas secundario',
    "updatedAt" = NOW()
WHERE "id" = 2 OR "name" = 'restaurante';

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
        WHEN name = 'ferreteria' THEN 'VEN'     -- Ferretería = Ventas
        WHEN name = 'recepcion' THEN 'VEN'      -- Por si acaso
        WHEN name = 'restaurante' THEN 'VEN2'   -- Restaurante = Ventas2
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
-- 1  | ferreteria     | Ventas          | Punto de ventas principal     | true
-- 2  | restaurante    | Ventas2         | Punto de ventas secundario    | true

SELECT 
    '✅ Próximos números de venta:' as info;

-- Probar función de numeración
SELECT 
    1 as tipo_id,
    'Ventas (Ferretería)' as pos,
    generate_sale_number(1) as proximo_numero
UNION ALL
SELECT 
    2 as tipo_id,
    'Ventas2 (Restaurante)' as pos,
    generate_sale_number(2) as proximo_numero;

-- Resultado esperado:
-- tipo_id | pos                    | proximo_numero
-- 1       | Ventas (Ferretería)    | VEN-000001
-- 2       | Ventas2 (Restaurante)  | VEN2-000001

