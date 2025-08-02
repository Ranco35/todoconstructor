-- ================================================
-- SCRIPT DE VERIFICACIÓN DE ESTADO DE MIGRACIONES
-- Admintermas - Verificación de Sincronización
-- ================================================

-- 1. VERIFICAR TABLAS EXISTENTES
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. VERIFICAR FUNCIONES EXISTENTES
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    t.typname as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 3. VERIFICAR POLÍTICAS RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. VERIFICAR TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. VERIFICAR ÍNDICES
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. VERIFICAR SECUENCIAS
SELECT 
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- 7. VERIFICAR VISTAS
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 8. VERIFICAR RESTRICCIONES
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 9. VERIFICAR STORAGE BUCKETS
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- 10. VERIFICAR POLÍTICAS DE STORAGE
SELECT 
    policyname,
    tablename,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- 11. RESUMEN DE ESTADO
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
    trigger_count INTEGER;
    index_count INTEGER;
    sequence_count INTEGER;
    view_count INTEGER;
    bucket_count INTEGER;
BEGIN
    -- Contar tablas
    SELECT COUNT(*) INTO table_count
    FROM pg_tables 
    WHERE schemaname = 'public';
    
    -- Contar funciones
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    
    -- Contar políticas
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    -- Contar triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    -- Contar índices
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Contar secuencias
    SELECT COUNT(*) INTO sequence_count
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public';
    
    -- Contar vistas
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views 
    WHERE table_schema = 'public';
    
    -- Contar buckets
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets;
    
    RAISE NOTICE '=== RESUMEN DEL ESTADO DE LA BASE DE DATOS ===';
    RAISE NOTICE 'Tablas: %', table_count;
    RAISE NOTICE 'Funciones: %', function_count;
    RAISE NOTICE 'Políticas RLS: %', policy_count;
    RAISE NOTICE 'Triggers: %', trigger_count;
    RAISE NOTICE 'Índices: %', index_count;
    RAISE NOTICE 'Secuencias: %', sequence_count;
    RAISE NOTICE 'Vistas: %', view_count;
    RAISE NOTICE 'Buckets de Storage: %', bucket_count;
    RAISE NOTICE '===============================================';
END $$; 