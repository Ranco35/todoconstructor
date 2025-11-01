-- ============================================
-- VERIFICAR QUÉ TABLAS POS EXISTEN
-- ============================================

SELECT 
    '=== TABLAS DEL SISTEMA POS ===' as titulo;

-- Lista de tablas esperadas del sistema POS
WITH tablas_esperadas AS (
  SELECT unnest(ARRAY[
    'CashRegisterType',
    'CashRegister', 
    'POSProductCategory',
    'POSProduct',
    'POSSale',
    'POSSaleItem',
    'POSTable',
    'POSConfig'
  ]) as tabla_esperada
)
SELECT 
    te.tabla_esperada as tabla,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as estado
FROM tablas_esperadas te
LEFT JOIN information_schema.tables t 
    ON t.table_name = te.tabla_esperada 
    AND t.table_schema = 'public'
ORDER BY 
    CASE 
        WHEN t.table_name IS NOT NULL THEN 1
        ELSE 2
    END,
    te.tabla_esperada;

-- Contar cuántas existen
SELECT 
    '=== RESUMEN ===' as titulo;

WITH tablas_esperadas AS (
  SELECT unnest(ARRAY[
    'CashRegisterType',
    'CashRegister', 
    'POSProductCategory',
    'POSProduct',
    'POSSale',
    'POSSaleItem',
    'POSTable',
    'POSConfig'
  ]) as tabla_esperada
)
SELECT 
    COUNT(*) as total_esperadas,
    COUNT(t.table_name) as total_existen,
    COUNT(*) - COUNT(t.table_name) as total_faltan,
    CASE 
        WHEN COUNT(*) = COUNT(t.table_name) THEN '✅ SISTEMA POS COMPLETO'
        WHEN COUNT(t.table_name) = 0 THEN '❌ SISTEMA POS NO INSTALADO - Ejecuta crear_sistema_pos_completo.sql'
        ELSE '⚠️ SISTEMA POS INCOMPLETO - Faltan ' || (COUNT(*) - COUNT(t.table_name))::TEXT || ' tablas'
    END as estado
FROM tablas_esperadas te
LEFT JOIN information_schema.tables t 
    ON t.table_name = te.tabla_esperada 
    AND t.table_schema = 'public';

