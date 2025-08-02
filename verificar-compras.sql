-- VERIFICAR MÓDULO DE COMPRAS ACTIVADO

SELECT 
    'purchase_orders' as tabla,
    COUNT(*) as registros,
    COALESCE(SUM(total), 0) as total_monto
FROM public.purchase_orders
UNION ALL
SELECT 
    'purchase_invoices',
    COUNT(*),
    COALESCE(SUM(total), 0)
FROM public.purchase_invoices
UNION ALL
SELECT 
    'purchase_payments',
    COUNT(*),
    COALESCE(SUM(amount), 0)
FROM public.purchase_payments; 