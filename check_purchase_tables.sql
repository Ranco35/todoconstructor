-- Script para verificar tablas de compras
-- Verificar si las tablas existen
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('purchase_orders', 'purchase_invoices', 'purchase_payments')
AND table_schema = 'public';

-- Verificar estructura de purchase_orders si existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de purchase_invoices si existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_invoices' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estructura de purchase_payments si existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('purchase_orders', 'purchase_invoices', 'purchase_payments')
AND schemaname = 'public'; 