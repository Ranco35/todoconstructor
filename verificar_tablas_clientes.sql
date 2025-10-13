-- =====================================================
-- Script: Verificar Tablas del Módulo de Clientes
-- Fecha: 2025-10-06
-- Descripción: Verificar qué tablas existen en la base de datos
-- =====================================================

-- Ver todas las tablas relacionadas con clientes
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
    AND (
        table_name ILIKE '%client%'
        OR table_name ILIKE '%country%'
        OR table_name ILIKE '%economic%'
        OR table_name ILIKE '%relationship%'
    )
ORDER BY 
    table_name;

-- Ver TODAS las tablas en el esquema public
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name;




