-- Script de prueba para verificar que warehouse_id se guarde correctamente
-- en las facturas de compra

-- 1. Verificar estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_invoices' 
AND column_name = 'warehouse_id';

-- 2. Verificar datos existentes
SELECT 
    id,
    number,
    supplier_id,
    warehouse_id,
    status,
    created_at
FROM purchase_invoices 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Verificar foreign key
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'purchase_invoices'
AND kcu.column_name = 'warehouse_id';

-- 4. Verificar bodegas disponibles
SELECT 
    id,
    name,
    location
FROM "Warehouse" 
ORDER BY id;

-- 5. Insertar factura de prueba con warehouse_id
INSERT INTO purchase_invoices (
    number,
    supplier_id,
    warehouse_id,
    status,
    total,
    currency,
    created_at,
    updated_at
) VALUES (
    'TEST-WAREHOUSE-001',
    1, -- Asumiendo que existe un proveedor con ID 1
    1, -- Asumiendo que existe una bodega con ID 1
    'draft',
    100000.00,
    'CLP',
    NOW(),
    NOW()
) RETURNING id, number, warehouse_id, status;

-- 6. Verificar que se guardó correctamente
SELECT 
    id,
    number,
    supplier_id,
    warehouse_id,
    status,
    created_at
FROM purchase_invoices 
WHERE number = 'TEST-WAREHOUSE-001';

-- 7. Limpiar datos de prueba
-- DELETE FROM purchase_invoices WHERE number = 'TEST-WAREHOUSE-001'; 