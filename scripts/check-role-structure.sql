-- Verificar estructura de la tabla Role
SELECT 'COLUMNAS DE LA TABLA ROLE:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Role' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver contenido actual de Role si existe
SELECT 'CONTENIDO ACTUAL DE ROLE:' as info;
SELECT * FROM public."Role" LIMIT 5;

-- Verificar si existe alguna tabla relacionada con roles
SELECT 'TABLAS QUE CONTIENEN ROLE:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%role%'; 