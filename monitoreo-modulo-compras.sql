-- ================================================================
-- SCRIPT DE MONITOREO MÓDULO DE COMPRAS
-- Ejecutar periódicamente para verificar estado del módulo
-- ================================================================

-- 📋 INFORMACIÓN DEL SCRIPT
SELECT 
    '🔍 MONITOREO MÓDULO COMPRAS' as titulo,
    NOW() as fecha_verificacion,
    'v1.0' as version_script,
    'Verificación automática de estado' as proposito;

-- 🚨 PASO 1: VERIFICAR EXISTENCIA DE TABLAS CRÍTICAS
SELECT 
    '🚨 VERIFICACIÓN TABLAS CRÍTICAS' as verificacion,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders' AND table_schema = 'public')
        THEN '✅ purchase_orders'
        ELSE '❌ purchase_orders FALTA'
    END as tabla_orders,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_invoices' AND table_schema = 'public')
        THEN '✅ purchase_invoices'
        ELSE '❌ purchase_invoices FALTA'
    END as tabla_invoices,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_payments' AND table_schema = 'public')
        THEN '✅ purchase_payments'
        ELSE '❌ purchase_payments FALTA'
    END as tabla_payments,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_lines' AND table_schema = 'public')
        THEN '✅ purchase_order_lines'
        ELSE '❌ purchase_order_lines FALTA'
    END as tabla_order_lines;

-- 📊 PASO 2: CONTEO DE REGISTROS POR TABLA
SELECT 
    '📊 CONTEO DE REGISTROS' as seccion,
    'purchase_orders' as tabla,
    COUNT(*) as total_registros,
    COALESCE(SUM(total), 0) as suma_montos,
    MIN(created_at) as primer_registro,
    MAX(created_at) as ultimo_registro
FROM public.purchase_orders
UNION ALL
SELECT 
    '',
    'purchase_invoices',
    COUNT(*),
    COALESCE(SUM(total), 0),
    MIN(created_at),
    MAX(created_at)
FROM public.purchase_invoices
UNION ALL
SELECT 
    '',
    'purchase_payments',
    COUNT(*),
    COALESCE(SUM(amount), 0),
    MIN(created_at),
    MAX(created_at)
FROM public.purchase_payments;

-- 🎯 PASO 3: ESTADO DE SALUD GENERAL
SELECT 
    '🎯 ESTADO DE SALUD GENERAL' as diagnostico,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.purchase_orders) > 0 
        AND (SELECT COUNT(*) FROM public.purchase_invoices) > 0
        AND (SELECT COUNT(*) FROM public.purchase_payments) > 0
        AND (SELECT COALESCE(SUM(total), 0) FROM public.purchase_invoices) > 0
        THEN '✅ MÓDULO SALUDABLE'
        WHEN (SELECT COUNT(*) FROM public.purchase_orders) = 0 
        AND (SELECT COUNT(*) FROM public.purchase_invoices) = 0
        AND (SELECT COUNT(*) FROM public.purchase_payments) = 0
        THEN '🚨 MÓDULO SIN DATOS - EJECUTAR SCRIPT DE ACTIVACIÓN'
        ELSE '⚠️ MÓDULO PARCIALMENTE FUNCIONAL - REVISAR DATOS'
    END as estado_general,
    CONCAT(
        'Órdenes: ', (SELECT COUNT(*) FROM public.purchase_orders),
        ' | Facturas: ', (SELECT COUNT(*) FROM public.purchase_invoices),
        ' | Pagos: ', (SELECT COUNT(*) FROM public.purchase_payments),
        ' | Total: $', (SELECT COALESCE(SUM(total), 0) FROM public.purchase_invoices)
    ) as resumen_datos;

-- 💰 PASO 4: MÉTRICAS FINANCIERAS
SELECT 
    '💰 MÉTRICAS FINANCIERAS' as seccion,
    'Total gastado (facturas)' as metrica,
    COALESCE(SUM(total), 0) as valor,
    'CLP' as moneda
FROM public.purchase_invoices
UNION ALL
SELECT 
    '',
    'Total pagado (pagos)',
    COALESCE(SUM(amount), 0),
    'CLP'
FROM public.purchase_payments
UNION ALL
SELECT 
    '',
    'Total en órdenes',
    COALESCE(SUM(total), 0),
    'CLP'
FROM public.purchase_orders
UNION ALL
SELECT 
    '',
    'Saldo pendiente',
    COALESCE((SELECT SUM(total) FROM public.purchase_invoices), 0) - 
    COALESCE((SELECT SUM(amount) FROM public.purchase_payments), 0),
    'CLP';

-- 🔗 PASO 5: VERIFICAR INTEGRIDAD REFERENCIAL
SELECT 
    '🔗 INTEGRIDAD REFERENCIAL' as verificacion,
    'Órdenes con proveedores inexistentes' as problema,
    COUNT(*) as casos_detectados
FROM public.purchase_orders po
LEFT JOIN public."Supplier" s ON po.supplier_id = s.id
WHERE s.id IS NULL
UNION ALL
SELECT 
    '',
    'Facturas con órdenes inexistentes',
    COUNT(*)
FROM public.purchase_invoices pi
LEFT JOIN public.purchase_orders po ON pi.order_id = po.id
WHERE pi.order_id IS NOT NULL AND po.id IS NULL
UNION ALL
SELECT 
    '',
    'Pagos con facturas inexistentes',
    COUNT(*)
FROM public.purchase_payments pp
LEFT JOIN public.purchase_invoices pi ON pp.invoice_id = pi.id
WHERE pi.id IS NULL;

-- 📈 PASO 6: DISTRIBUCIÓN POR ESTADOS
SELECT 
    '📈 DISTRIBUCIÓN POR ESTADOS' as analisis,
    'purchase_orders' as tabla,
    status,
    COUNT(*) as cantidad,
    COALESCE(SUM(total), 0) as monto_total
FROM public.purchase_orders
GROUP BY status
UNION ALL
SELECT 
    '',
    'purchase_invoices',
    status,
    COUNT(*),
    COALESCE(SUM(total), 0)
FROM public.purchase_invoices
GROUP BY status
ORDER BY tabla, cantidad DESC;

-- ⏰ PASO 7: ACTIVIDAD RECIENTE (últimos 7 días)
SELECT 
    '⏰ ACTIVIDAD RECIENTE (7 días)' as analisis,
    'Órdenes creadas' as tipo,
    COUNT(*) as cantidad
FROM public.purchase_orders
WHERE created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    '',
    'Facturas creadas',
    COUNT(*)
FROM public.purchase_invoices
WHERE created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    '',
    'Pagos registrados',
    COUNT(*)
FROM public.purchase_payments
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 🚨 PASO 8: ALERTAS Y RECOMENDACIONES
SELECT 
    '🚨 ALERTAS Y RECOMENDACIONES' as seccion,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.purchase_payments) = 0 
        THEN '🚨 CRÍTICO: Sin pagos registrados - Dashboard mostrará $0'
        WHEN (SELECT COUNT(*) FROM public.purchase_invoices) = 0
        THEN '🚨 CRÍTICO: Sin facturas registradas - Sin datos financieros'
        WHEN (SELECT COUNT(*) FROM public.purchase_orders) = 0
        THEN '⚠️ ADVERTENCIA: Sin órdenes registradas - Módulo vacío'
        WHEN (SELECT COUNT(*) FROM public.purchase_orders po LEFT JOIN public."Supplier" s ON po.supplier_id = s.id WHERE s.id IS NULL) > 0
        THEN '⚠️ ADVERTENCIA: Órdenes con proveedores inexistentes detectadas'
        WHEN (SELECT COALESCE(SUM(total), 0) FROM public.purchase_invoices) = 0
        THEN '⚠️ ADVERTENCIA: Total gastado es $0 - Verificar datos'
        ELSE '✅ TODO CORRECTO: No se detectaron problemas críticos'
    END as alerta_principal,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.purchase_payments) = 0 
        THEN 'Ejecutar: crear-tablas-compras-faltantes.sql'
        WHEN (SELECT COUNT(*) FROM public.purchase_invoices) = 0
        THEN 'Insertar datos de prueba mínimos'
        WHEN (SELECT COUNT(*) FROM public.purchase_orders) = 0
        THEN 'Activar módulo con datos iniciales'
        ELSE 'Ninguna acción requerida'
    END as accion_recomendada;

-- 📋 PASO 9: RESUMEN EJECUTIVO FINAL
SELECT 
    '📋 RESUMEN EJECUTIVO' as titulo,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_payments')
        AND (SELECT COUNT(*) FROM public.purchase_orders) > 0
        AND (SELECT COUNT(*) FROM public.purchase_invoices) > 0  
        AND (SELECT COUNT(*) FROM public.purchase_payments) > 0
        AND (SELECT COALESCE(SUM(total), 0) FROM public.purchase_invoices) > 0
        THEN '✅ MÓDULO 100% FUNCIONAL'
        ELSE '❌ MÓDULO REQUIERE ATENCIÓN'
    END as estado_final,
    CONCAT(
        'URL: http://localhost:3000/dashboard/purchases | ',
        'Última verificación: ', NOW()
    ) as informacion_adicional,
    'Ejecutar este script periódicamente para monitoreo continuo' as nota;

-- 💡 INFORMACIÓN ADICIONAL
SELECT 
    '💡 INFORMACIÓN ADICIONAL' as seccion,
    'Script de monitoreo ejecutado exitosamente' as resultado,
    'Si hay alertas críticas, consultar docs/modules/purchases/' as documentacion,
    'Para reparación rápida usar: docs/modules/purchases/referencia-rapida-desarrollador.md' as referencia_rapida; 