-- =====================================================
-- 🛠️ SOLUCIONES PARA FACTURAS DE SERVICIOS
-- =====================================================

-- 🔍 OPCIÓN 1: CREAR PRODUCTO "SERVICIO CONTROL PLAGAS" 
-- =====================================================
-- Si quieres crear un producto específico para vincular a la factura

INSERT INTO "Product" (
    name,
    description,
    type,
    sku,
    brand,
    "saleprice",
    vat,
    "isActive",
    "created_at",
    "updated_at"
) VALUES (
    'Servicio Control de Plagas',
    'Servicio integral de control de plagas (desratización, desinsectación, sanitización)',
    'SERVICIO',
    'SRV-PLAGAS-001',
    'HABILITAFOR SPA',
    0, -- Precio variable según cotización
    19,
    true,
    NOW(),
    NOW()
) 
ON CONFLICT (sku) DO NOTHING; -- No crear si ya existe

-- Obtener el ID del producto creado
-- SELECT id, name, type FROM "Product" WHERE sku = 'SRV-PLAGAS-001';

-- =====================================================
-- 🔧 OPCIÓN 2: ACTUALIZAR LÍNEA EXISTENTE CON PRODUCTO
-- =====================================================
-- Vincular la línea de factura al producto de servicio

-- Primero obtener los IDs necesarios:
WITH datos AS (
    SELECT 
        pi.id as factura_id,
        pil.id as linea_id,
        p.id as producto_servicio_id
    FROM purchase_invoices pi
    JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
    LEFT JOIN "Product" p ON p.sku = 'SRV-PLAGAS-001'
    WHERE pi.number = 'FC250801-0001'
)
UPDATE purchase_invoice_lines 
SET product_id = (SELECT producto_servicio_id FROM datos)
WHERE id = (SELECT linea_id FROM datos)
AND product_id IS NULL; -- Solo actualizar si no tiene producto

-- =====================================================
-- 🚀 OPCIÓN 3: APROBAR DIRECTAMENTE (PARA SERVICIOS)
-- =====================================================
-- Si confirmas que es servicio, aprobar sin requerir bodega

-- ⚠️ CUIDADO: Ejecutar solo si estás seguro que es servicio
/*
UPDATE purchase_invoices 
SET 
    status = 'approved',
    approved_by = 'tu-user-id-aqui', -- Cambiar por tu ID de usuario
    approved_at = NOW(),
    updated_at = NOW()
WHERE number = 'FC250801-0001'
AND status = 'draft';
*/

-- =====================================================
-- 📊 FUNCIÓN PARA VALIDAR SERVICIOS POR DESCRIPCIÓN
-- =====================================================
-- Crear función que detecte servicios automáticamente

CREATE OR REPLACE FUNCTION es_servicio_por_descripcion(descripcion TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN LOWER(descripcion) SIMILAR TO '%(servicio|service|mantenimiento|maintenance|reparacion|reparación|consultoria|consultoría|asesoría|asesoria|instalacion|instalación|limpieza|cleaning|control|fumigacion|fumigación|desinfeccion|desinfección|sanitizacion|sanitización|plaga|plagas|pest|professional|profesional)%';
END;
$$ LANGUAGE plpgsql;

-- Probar la función:
SELECT 
    description,
    es_servicio_por_descripcion(description) as es_servicio
FROM purchase_invoice_lines pil
JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
WHERE pi.number = 'FC250801-0001';

-- =====================================================
-- 🔄 MIGRACIÓN MASIVA: MARCAR SERVICIOS EXISTENTES
-- =====================================================
-- Actualizar todas las facturas de servicios sin product_id

-- 1. Crear productos de servicio genéricos si no existen
INSERT INTO "Product" (
    name,
    description,
    type,
    sku,
    brand,
    "saleprice",
    vat,
    "isActive",
    "created_at",
    "updated_at"
) VALUES 
(
    'Servicio Profesional Genérico',
    'Servicios profesionales varios',
    'SERVICIO',
    'SRV-GENERICO-001',
    'Servicios',
    0,
    19,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (sku) DO NOTHING;

-- 2. Actualizar líneas que son claramente servicios
WITH servicios_detectados AS (
    SELECT 
        pil.id as linea_id,
        p_servicio.id as producto_servicio_id
    FROM purchase_invoice_lines pil
    JOIN purchase_invoices pi ON pil.purchase_invoice_id = pi.id
    CROSS JOIN "Product" p_servicio
    WHERE pil.product_id IS NULL
    AND p_servicio.sku = 'SRV-GENERICO-001'
    AND es_servicio_por_descripcion(pil.description) = true
)
UPDATE purchase_invoice_lines 
SET product_id = servicios_detectados.producto_servicio_id
FROM servicios_detectados
WHERE purchase_invoice_lines.id = servicios_detectados.linea_id;

-- =====================================================
-- 📋 CONSULTA FINAL: VERIFICAR RESULTADOS
-- =====================================================
SELECT 
    '🎯 VERIFICACIÓN FINAL' as titulo,
    pi.number as factura,
    pi.status as estado,
    pil.description as descripcion,
    p.name as producto_vinculado,
    p.type as tipo_producto,
    CASE 
        WHEN p.type = 'SERVICIO' THEN '✅ SERVICIO DETECTADO'
        WHEN p.type IS NULL AND es_servicio_por_descripcion(pil.description) THEN '✅ SERVICIO POR DESCRIPCIÓN'
        ELSE '📦 PRODUCTO FÍSICO'
    END as clasificacion,
    CASE 
        WHEN pi.warehouse_id IS NOT NULL THEN '🏢 TIENE BODEGA'
        WHEN p.type = 'SERVICIO' OR es_servicio_por_descripcion(pil.description) THEN '✅ NO NECESITA BODEGA'
        ELSE '⚠️ NECESITA BODEGA'
    END as requiere_bodega
FROM purchase_invoices pi
JOIN purchase_invoice_lines pil ON pi.id = pil.purchase_invoice_id
LEFT JOIN "Product" p ON pil.product_id = p.id
WHERE pi.number = 'FC250801-0001';