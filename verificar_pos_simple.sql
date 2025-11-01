-- ============================================
-- VERIFICACIÓN SIMPLE: ¿EXISTEN LOS 2 POS?
-- ============================================

-- Verificar si la tabla existe
SELECT 
    table_name,
    'EXISTE' as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'CashRegisterType';

-- Si sale vacío = NO EXISTE, ejecuta crear_sistema_pos_completo.sql
-- Si sale con resultado = EXISTE, continúa abajo

-- Ver los tipos de POS (fallará si la tabla no existe)
SELECT 
    "id",
    "displayName" as nombre,
    "isActive" as activo
FROM "CashRegisterType"
ORDER BY "id";

-- Resultado esperado:
-- id | nombre  | activo
-- 1  | Ventas  | true
-- 2  | Ventas2 | true

