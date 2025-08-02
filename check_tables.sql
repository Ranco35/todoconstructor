-- Script para verificar las tablas existentes en la base de datos

-- Listar todas las tablas en el esquema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Buscar tablas que contengan "product" en el nombre (case insensitive)
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%product%'
ORDER BY table_name;

-- Verificar si existe la tabla Product con diferentes casos
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('Product', 'product', 'PRODUCT')
ORDER BY table_name;

-- Verificar la estructura de la tabla si existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name ILIKE '%product%'
ORDER BY ordinal_position; 