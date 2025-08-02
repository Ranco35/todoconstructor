-- Verificación detallada de tablas de compras
-- 1. Verificar existencia de tablas
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

-- 2. Verificar estructura de purchase_orders (si existe)
SELECT 
    'purchase_orders' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'order_number') THEN 'PRIMARY KEY'
        WHEN column_name = 'supplier_id' THEN 'FOREIGN KEY -> suppliers'
        WHEN column_name = 'created_by' THEN 'FOREIGN KEY -> auth.users'
        ELSE 'REGULAR'
    END as tipo_columna
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estructura de purchase_invoices (si existe)
SELECT 
    'purchase_invoices' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'invoice_number') THEN 'PRIMARY KEY'
        WHEN column_name = 'supplier_id' THEN 'FOREIGN KEY -> suppliers'
        WHEN column_name = 'purchase_order_id' THEN 'FOREIGN KEY -> purchase_orders'
        WHEN column_name = 'created_by' THEN 'FOREIGN KEY -> auth.users'
        ELSE 'REGULAR'
    END as tipo_columna
FROM information_schema.columns 
WHERE table_name = 'purchase_invoices' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar estructura de purchase_payments (si existe)
SELECT 
    'purchase_payments' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'payment_number') THEN 'PRIMARY KEY'
        WHEN column_name = 'supplier_id' THEN 'FOREIGN KEY -> suppliers'
        WHEN column_name = 'purchase_invoice_id' THEN 'FOREIGN KEY -> purchase_invoices'
        WHEN column_name = 'created_by' THEN 'FOREIGN KEY -> auth.users'
        ELSE 'REGULAR'
    END as tipo_columna
FROM information_schema.columns 
WHERE table_name = 'purchase_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar políticas RLS
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '🔍 LECTURA'
        WHEN cmd = 'INSERT' THEN '➕ INSERCIÓN'
        WHEN cmd = 'UPDATE' THEN '✏️ ACTUALIZACIÓN'
        WHEN cmd = 'DELETE' THEN '🗑️ ELIMINACIÓN'
        ELSE cmd
    END as operacion
FROM pg_policies 
WHERE tablename IN ('purchase_orders', 'purchase_invoices', 'purchase_payments')
AND schemaname = 'public'
ORDER BY tablename, cmd;

-- 6. Verificar índices
SELECT 
    t.table_name,
    i.indexname,
    i.indexdef
FROM pg_indexes i
JOIN information_schema.tables t ON i.tablename = t.table_name
WHERE t.table_name IN ('purchase_orders', 'purchase_invoices', 'purchase_payments')
AND t.table_schema = 'public'
ORDER BY t.table_name, i.indexname; 