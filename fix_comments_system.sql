-- ================================================
-- CORRECCIÓN DEL SISTEMA DE COMENTARIOS DE RESERVAS
-- Fecha: 2025-01-27
-- Descripción: Unificar el manejo de comentarios entre formulario y visualización
-- ================================================

-- 1. Verificar estructura actual de comentarios
SELECT 
    'modular_reservations' as tabla,
    COUNT(*) as total_registros,
    COUNT(comments) as con_comentarios,
    COUNT(CASE WHEN comments IS NOT NULL AND comments != '' THEN 1 END) as comentarios_no_vacios
FROM modular_reservations

UNION ALL

SELECT 
    'reservation_comments' as tabla,
    COUNT(*) as total_registros,
    COUNT(text) as con_comentarios,
    COUNT(CASE WHEN text IS NOT NULL AND text != '' THEN 1 END) as comentarios_no_vacios
FROM reservation_comments;

-- 2. Migrar comentarios principales a la tabla reservation_comments
-- (Solo si no existen ya como comentarios adicionales)
INSERT INTO reservation_comments (reservation_id, text, author, created_at, is_edited)
SELECT 
    mr.reservation_id,
    mr.comments as text,
    'Sistema - Migración' as author,
    mr.created_at,
    false as is_edited
FROM modular_reservations mr
WHERE mr.comments IS NOT NULL 
    AND mr.comments != ''
    AND NOT EXISTS (
        SELECT 1 FROM reservation_comments rc 
        WHERE rc.reservation_id = mr.reservation_id 
        AND rc.text = mr.comments
    );

-- 3. Verificar la migración
SELECT 
    'Después de migración' as estado,
    COUNT(*) as total_comentarios_tabla
FROM reservation_comments;

-- 4. Mostrar algunos ejemplos de comentarios migrados
SELECT 
    rc.reservation_id,
    r.guest_name,
    rc.text,
    rc.author,
    rc.created_at
FROM reservation_comments rc
JOIN reservations r ON rc.reservation_id = r.id
WHERE rc.author = 'Sistema - Migración'
LIMIT 5;