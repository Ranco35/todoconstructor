-- Verificación simple de tablas de compras
SELECT 
    'purchase_orders' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'purchase_invoices' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_invoices' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado
UNION ALL
SELECT 
    'purchase_payments' as tabla,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_payments' AND table_schema = 'public') 
        THEN '✅ EXISTE' 
        ELSE '❌ NO EXISTE' 
    END as estado; 