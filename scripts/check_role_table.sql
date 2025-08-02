-- Verificar estructura de la tabla Role
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Role'
ORDER BY ordinal_position;

-- Ver datos de la tabla Role
SELECT * FROM "Role" LIMIT 10; 