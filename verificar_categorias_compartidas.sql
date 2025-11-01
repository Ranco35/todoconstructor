-- ============================================
-- VERIFICAR QUE AMBOS POS COMPARTAN CATEGORÍAS
-- ============================================

-- 1. Ver cuántas categorías tiene cada POS
SELECT 
    '=== CATEGORÍAS POR POS ===' as titulo;

SELECT 
    CASE 
        WHEN "cashRegisterTypeId" = 1 THEN 'Ferretería (ID 1)'
        WHEN "cashRegisterTypeId" = 2 THEN 'Ferreteria2 (ID 2)'
        ELSE 'Otro'
    END as pos,
    COUNT(*) as total_categorias,
    COUNT(CASE WHEN "isActive" = true THEN 1 END) as categorias_activas
FROM "POSProductCategory"
GROUP BY "cashRegisterTypeId"
ORDER BY "cashRegisterTypeId";

-- 2. Ver todas las categorías de cada POS
SELECT 
    '=== DETALLE DE CATEGORÍAS POR POS ===' as titulo;

SELECT 
    "cashRegisterTypeId" as pos_id,
    CASE 
        WHEN "cashRegisterTypeId" = 1 THEN 'Ferretería'
        WHEN "cashRegisterTypeId" = 2 THEN 'Ferreteria2'
    END as pos,
    "id" as categoria_id,
    "displayName" as categoria,
    "icon",
    "isActive" as activa
FROM "POSProductCategory"
ORDER BY "cashRegisterTypeId", "sortOrder", "displayName";

-- 3. Verificar si comparten categorías (mismo nombre)
SELECT 
    '=== ANÁLISIS: ¿COMPARTEN CATEGORÍAS? ===' as titulo;

SELECT 
    "displayName" as nombre_categoria,
    COUNT(DISTINCT "cashRegisterTypeId") as cuantos_pos_la_tienen,
    STRING_AGG(
        DISTINCT CASE 
            WHEN "cashRegisterTypeId" = 1 THEN 'Ferretería'
            WHEN "cashRegisterTypeId" = 2 THEN 'Ferreteria2'
        END, 
        ', '
    ) as en_que_pos,
    STRING_AGG("id"::TEXT, ', ') as ids_categorias,
    CASE 
        WHEN COUNT(DISTINCT "cashRegisterTypeId") = 2 THEN '✅ Compartida'
        WHEN COUNT(DISTINCT "cashRegisterTypeId") = 1 THEN '❌ Solo en 1 POS'
        ELSE '⚠️ Error'
    END as estado
FROM "POSProductCategory"
WHERE "isActive" = true
GROUP BY "displayName"
ORDER BY cuantos_pos_la_tienen DESC, "displayName";

-- 4. Resumen final
SELECT 
    '=== RESUMEN ===' as titulo;

SELECT 
    CASE 
        WHEN COUNT(DISTINCT "cashRegisterTypeId") = 1 THEN 
            '✅ CONFIRMADO: Ambos POS usan las MISMAS categorías (están duplicadas con el mismo nombre)'
        WHEN COUNT(DISTINCT "cashRegisterTypeId") = 2 THEN 
            '⚠️ Los POS tienen categorías SEPARADAS (cada uno tiene sus propias categorías)'
        ELSE 
            '❌ Estado inconsistente'
    END as conclusion
FROM "POSProductCategory"
WHERE "isActive" = true
GROUP BY "displayName"
HAVING COUNT(DISTINCT "cashRegisterTypeId") = 2
LIMIT 1;

-- Si la consulta anterior está vacía, entonces NO comparten
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 
            FROM "POSProductCategory" 
            WHERE "isActive" = true 
            GROUP BY "displayName" 
            HAVING COUNT(DISTINCT "cashRegisterTypeId") = 2
        ) THEN '❌ NO COMPARTEN: Cada POS tiene sus propias categorías (categorías separadas por POS)'
        ELSE '✅ SÍ COMPARTEN: Las categorías están duplicadas para ambos POS'
    END as resultado_real;

