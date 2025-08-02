-- =====================================================
-- 🔍 MANEJO DE FACTURAS ANTIGUAS - SERVICIOS vs PRODUCTOS
-- =====================================================

-- 1️⃣ IDENTIFICAR FACTURAS ANTIGUAS SIN BODEGA QUE PODRÍAN SER SERVICIOS
-- =====================================================
SELECT 
    'FACTURAS ANTIGUAS CANDIDATAS A SERVICIOS' as seccion,
    pi.id,
    pi.number as factura,
    pi.status as estado,
    pi.warehouse_id as bodega,
    pi.total,
    pi.created_at as fecha_creacion,
    pil.description as descripcion,
    -- Análisis de servicios
    CASE 
        WHEN LOWER(pil.description) SIMILAR TO '%(servicio|service|mantenimiento|maintenance|control|fumigacion|fumigación|desinfeccion|desinfección|sanitizacion|sanitización|plaga|plagas|pest|limpieza|cleaning|reparacion|reparación|consultoria|consultoría|asesoría|asesoria|instalacion|instalación)%' 
        THEN '🛠️ PROBABLE SERVICIO' 
        ELSE '📦 PROBABLE PRODUCTO'
    END as tipo_detectado
FROM purchase_invoices pi
LEFT JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
WHERE pi.status = 'draft' 
  AND pi.warehouse_id IS NULL
  AND pi.created_at < CURRENT_DATE - INTERVAL '30 days'  -- Facturas de más de 30 días
ORDER BY pi.created_at DESC;

-- 2️⃣ ESTADÍSTICAS DE FACTURAS ANTIGUAS
-- =====================================================
SELECT 
    'ESTADÍSTICAS FACTURAS ANTIGUAS' as seccion,
    COUNT(*) as total_facturas_sin_bodega,
    COUNT(CASE WHEN LOWER(pil.description) SIMILAR TO '%(servicio|service|mantenimiento|maintenance|control|fumigacion|fumigación|desinfeccion|desinfección|sanitizacion|sanitización|plaga|plagas|pest|limpieza|cleaning|reparacion|reparación|consultoria|consultoría|asesoría|asesoria|instalacion|instalación)%' THEN 1 END) as probables_servicios,
    COUNT(CASE WHEN NOT LOWER(pil.description) SIMILAR TO '%(servicio|service|mantenimiento|maintenance|control|fumigacion|fumigación|desinfeccion|desinfección|sanitizacion|sanitización|plaga|plagas|pest|limpieza|cleaning|reparacion|reparación|consultoria|consultoría|asesoría|asesoria|instalacion|instalación)%' THEN 1 END) as probables_productos
FROM purchase_invoices pi
LEFT JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
WHERE pi.status = 'draft' 
  AND pi.warehouse_id IS NULL
  AND pi.created_at < CURRENT_DATE - INTERVAL '30 days';

-- 3️⃣ APROBAR FACTURAS ANTIGUAS DE SERVICIOS (EJECUTAR CON CUIDADO)
-- =====================================================
-- ⚠️ SOLO EJECUTAR DESPUÉS DE REVISAR LOS RESULTADOS ANTERIORES

-- Versión SEGURA: Solo mostrar lo que se aprobaría
SELECT 
    'FACTURAS QUE SE APROBARÍAN COMO SERVICIOS' as seccion,
    pi.id,
    pi.number as factura,
    pi.total,
    pil.description as descripcion
FROM purchase_invoices pi
LEFT JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
WHERE pi.status = 'draft' 
  AND pi.warehouse_id IS NULL
  AND pi.created_at < CURRENT_DATE - INTERVAL '30 days'
  AND LOWER(pil.description) SIMILAR TO '%(servicio|service|mantenimiento|maintenance|control|fumigacion|fumigación|desinfeccion|desinfección|sanitizacion|sanitización|plaga|plagas|pest|limpieza|cleaning|reparacion|reparación|consultoria|consultoría|asesoría|asesoria|instalacion|instalación)%';

-- 4️⃣ SCRIPT DE APROBACIÓN MASIVA (SOLO PARA SERVICIOS CONFIRMADOS)
-- =====================================================
-- ⚠️ DESCOMENTA Y EJECUTA SOLO SI ESTÁS SEGURO

/*
-- APROBAR SOLO FACTURAS QUE CLARAMENTE SON SERVICIOS
UPDATE purchase_invoices 
SET 
    status = 'approved',
    approved_at = NOW(),
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT pi.id
    FROM purchase_invoices pi
    LEFT JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
    WHERE pi.status = 'draft' 
      AND pi.warehouse_id IS NULL
      AND pi.created_at < CURRENT_DATE - INTERVAL '30 days'
      AND LOWER(pil.description) SIMILAR TO '%(servicio|service|mantenimiento|maintenance|control|fumigacion|fumigación|desinfeccion|desinfección|sanitizacion|sanitización|plaga|plagas|pest|limpieza|cleaning)%'
);
*/

-- 5️⃣ VERIFICAR FACTURAS APROBADAS
-- =====================================================
SELECT 
    'FACTURAS RECIÉN APROBADAS' as seccion,
    pi.number as factura,
    pi.status as estado,
    pi.approved_at as fecha_aprobacion,
    pi.total
FROM purchase_invoices pi
WHERE pi.status = 'approved' 
  AND pi.approved_at > CURRENT_DATE
  AND pi.warehouse_id IS NULL
ORDER BY pi.approved_at DESC;

-- 6️⃣ RECOMENDACIONES PARA FACTURAS MIXTAS
-- =====================================================
SELECT 
    'FACTURAS MIXTAS - REVISAR MANUALMENTE' as seccion,
    pi.id,
    pi.number as factura,
    pi.total,
    string_agg(pil.description, ' | ') as todas_las_lineas
FROM purchase_invoices pi
LEFT JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
WHERE pi.status = 'draft' 
  AND pi.warehouse_id IS NULL
  AND pi.created_at < CURRENT_DATE - INTERVAL '30 days'
GROUP BY pi.id, pi.number, pi.total
HAVING COUNT(pil.id) > 1  -- Facturas con múltiples líneas
ORDER BY pi.created_at DESC;