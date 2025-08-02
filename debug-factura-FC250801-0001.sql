-- =====================================================
-- 🔍 DEBUG FACTURA FC250801-0001 - VALIDACIÓN SERVICIOS
-- =====================================================

-- 1️⃣ INFORMACIÓN BÁSICA DE LA FACTURA
-- =====================================================
SELECT 
    'DATOS BÁSICOS FACTURA' as seccion,
    id,
    number as numero_factura,
    supplier_invoice_number as numero_proveedor,
    status as estado,
    warehouse_id as bodega_id,
    total,
    created_at
FROM purchase_invoices 
WHERE number = 'FC250801-0001';

-- 2️⃣ LÍNEAS DE LA FACTURA CON PRODUCTOS
-- =====================================================
SELECT 
    'LÍNEAS CON PRODUCTOS' as seccion,
    pil.id as linea_id,
    pil.product_id,
    pil.description as descripcion,
    pil.quantity as cantidad,
    pil.unit_price as precio_unitario,
    p.name as nombre_producto,
    p.type as tipo_producto,
    p.sku
FROM purchase_invoice_lines pil
LEFT JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
LEFT JOIN "Product" p ON pil.product_id = p.id
WHERE pi.number = 'FC250801-0001';

-- 3️⃣ ANÁLISIS DE DESCRIPCIÓN PARA SERVICIOS
-- =====================================================
SELECT 
    'ANÁLISIS DESCRIPCIÓN' as seccion,
    pil.description as descripcion_original,
    LOWER(pil.description) as descripcion_minuscula,
    -- Verificar palabras clave de servicios
    CASE 
        WHEN LOWER(pil.description) LIKE '%servicio%' THEN '✅ CONTIENE: servicio'
        ELSE '❌ NO contiene: servicio'
    END as check_servicio,
    CASE 
        WHEN LOWER(pil.description) LIKE '%control%' THEN '✅ CONTIENE: control'
        ELSE '❌ NO contiene: control'
    END as check_control,
    CASE 
        WHEN LOWER(pil.description) LIKE '%plaga%' THEN '✅ CONTIENE: plaga'
        ELSE '❌ NO contiene: plaga'
    END as check_plaga,
    -- Resultado final
    CASE 
        WHEN LOWER(pil.description) SIMILAR TO '%(servicio|service|mantenimiento|maintenance|control|fumigacion|fumigación|desinfeccion|desinfección|sanitizacion|sanitización|plaga|plagas|pest)%' 
        THEN '🛠️ ES SERVICIO' 
        ELSE '📦 ES PRODUCTO FÍSICO'
    END as resultado_deteccion
FROM purchase_invoice_lines pil
LEFT JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
WHERE pi.number = 'FC250801-0001';

-- 4️⃣ VALIDACIÓN COMPLETA SIMULADA
-- =====================================================
WITH factura_analisis AS (
    SELECT 
        pi.id as invoice_id,
        pi.number as numero_factura,
        pi.warehouse_id,
        pil.product_id,
        pil.description,
        p.type as tipo_producto_bd,
        -- Detección de servicio por descripción
        CASE 
            WHEN LOWER(pil.description) SIMILAR TO '%(servicio|service|mantenimiento|maintenance|control|fumigacion|fumigación|desinfeccion|desinfección|sanitizacion|sanitización|plaga|plagas|pest)%' 
            THEN true 
            ELSE false
        END as es_servicio_por_descripcion,
        -- Detección de servicio por tipo de producto
        CASE 
            WHEN p.type = 'SERVICIO' 
            THEN true 
            ELSE false
        END as es_servicio_por_tipo
    FROM purchase_invoices pi
    LEFT JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
    LEFT JOIN "Product" p ON pil.product_id = p.id
    WHERE pi.number = 'FC250801-0001'
)
SELECT 
    'VALIDACIÓN FINAL' as seccion,
    numero_factura,
    warehouse_id as bodega_asignada,
    -- Análisis por línea
    product_id as tiene_product_id,
    tipo_producto_bd,
    es_servicio_por_descripcion,
    es_servicio_por_tipo,
    -- Resultado por línea
    CASE 
        WHEN product_id IS NOT NULL AND tipo_producto_bd = 'SERVICIO' THEN '🛠️ SERVICIO (por BD)'
        WHEN product_id IS NULL AND es_servicio_por_descripcion THEN '🛠️ SERVICIO (por descripción)'
        WHEN product_id IS NOT NULL AND tipo_producto_bd != 'SERVICIO' THEN '📦 PRODUCTO FÍSICO (por BD)'
        WHEN product_id IS NULL AND NOT es_servicio_por_descripcion THEN '📦 PRODUCTO FÍSICO (por descripción)'
        ELSE '❓ DESCONOCIDO'
    END as tipo_detectado,
    -- Conclusión
    CASE 
        WHEN (product_id IS NOT NULL AND tipo_producto_bd = 'SERVICIO') OR 
             (product_id IS NULL AND es_servicio_por_descripcion) 
        THEN '✅ NO REQUIERE BODEGA' 
        ELSE '⚠️ REQUIERE BODEGA'
    END as requiere_bodega
FROM factura_analisis;

-- 5️⃣ ESTADO ACTUAL DEL SISTEMA
-- =====================================================
SELECT 
    'ESTADO SISTEMA' as seccion,
    'Factura: ' || number as info,
    'Estado: ' || status as estado,
    'Bodega ID: ' || COALESCE(warehouse_id::text, 'NULL') as bodega,
    'Puede aprobar: ' || 
    CASE 
        WHEN status = 'approved' THEN '❌ YA APROBADA'
        WHEN warehouse_id IS NOT NULL THEN '✅ SÍ (tiene bodega)'
        ELSE '❓ DEPENDE DEL TIPO'
    END as puede_aprobar
FROM purchase_invoices 
WHERE number = 'FC250801-0001';

-- 6️⃣ RECOMENDACIÓN FINAL
-- =====================================================
SELECT 
    'RECOMENDACIÓN' as seccion,
    '🎯 PARA FACTURA FC250801-0001:' as titulo,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM purchase_invoice_lines pil
            LEFT JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
            WHERE pi.number = 'FC250801-0001'
            AND LOWER(pil.description) SIMILAR TO '%(servicio|service|mantenimiento|maintenance|control|fumigacion|fumigación|desinfeccion|desinfección|sanitizacion|sanitización|plaga|plagas|pest)%'
        ) THEN '✅ ES SERVICIO - DEBE PODER APROBARSE SIN BODEGA'
        ELSE '⚠️ NO ES SERVICIO - REQUIERE BODEGA'
    END as recomendacion;