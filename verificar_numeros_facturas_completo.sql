-- ===================================
-- VERIFICAR NÚMEROS DE FACTURAS COMPLETO
-- Después de agregar el campo supplier_invoice_number
-- ===================================

-- 1. MOSTRAR AMBOS NÚMEROS (interno y oficial del proveedor)
SELECT 
    'FACTURAS DE COMPRAS - COMPLETO' as info,
    id,
    number as numero_interno_sistema,
    supplier_invoice_number as numero_oficial_proveedor,
    supplier_id,
    total_amount,
    status,
    created_at,
    CASE 
        WHEN supplier_invoice_number IS NULL THEN '❌ Falta número oficial'
        WHEN supplier_invoice_number = number THEN '⚠️ Números iguales'
        ELSE '✅ Números diferentes (correcto)'
    END as validacion
FROM purchase_invoices
ORDER BY id DESC
LIMIT 10;

-- 2. ESTADÍSTICAS de números oficiales
SELECT 
    'ESTADÍSTICAS NÚMEROS OFICIALES' as info,
    COUNT(*) as total_facturas,
    SUM(CASE WHEN supplier_invoice_number IS NOT NULL THEN 1 ELSE 0 END) as con_numero_oficial,
    SUM(CASE WHEN supplier_invoice_number IS NULL THEN 1 ELSE 0 END) as sin_numero_oficial,
    SUM(CASE WHEN supplier_invoice_number = number THEN 1 ELSE 0 END) as numeros_iguales_problematico
FROM purchase_invoices;

-- 3. BUSCAR FACTURA 2906383 específica
SELECT 
    'BÚSQUEDA FACTURA 2906383' as info,
    id,
    number as numero_interno,
    supplier_invoice_number as numero_oficial,
    supplier_id,
    total_amount,
    status
FROM purchase_invoices 
WHERE supplier_invoice_number = '2906383'
   OR number = '2906383'
   OR supplier_invoice_number LIKE '%2906383%'
   OR number LIKE '%2906383%';

-- 4. FACTURAS que necesitan actualización
SELECT 
    'FACTURAS QUE NECESITAN NÚMERO OFICIAL' as info,
    id,
    number as numero_interno,
    supplier_id,
    total_amount,
    'Agregar número oficial del proveedor' as accion_requerida
FROM purchase_invoices 
WHERE supplier_invoice_number IS NULL
ORDER BY id DESC
LIMIT 5;

-- 5. EJEMPLO de cómo debería verse una factura correcta
SELECT 
    'EJEMPLO FACTURA IDEAL' as info,
    'Debería tener:' as estructura,
    'ID: 6' as id_interno,
    'number: FC250719-2089' as numero_sistema,
    'supplier_invoice_number: 2906383' as numero_oficial_proveedor,
    'supplier_id: ID_del_proveedor' as proveedor; 