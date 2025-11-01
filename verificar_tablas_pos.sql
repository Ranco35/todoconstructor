-- ============================================
-- VERIFICAR TABLAS POS EXISTENTES
-- ============================================

-- Ver todas las tablas relacionadas con POS
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%pos%' 
    OR table_name ILIKE '%cash%'
    OR table_name ILIKE '%register%'
  )
ORDER BY table_name;

-- Ver todas las tablas públicas (para ver nombres exactos)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

