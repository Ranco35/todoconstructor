-- ================================================
-- SCRIPT DE PRUEBA PARA FUNCIONALIDAD DE COMENTARIOS
-- Fecha: 2025-01-27
-- Descripción: Verificar que la tabla reservation_comments funciona correctamente
-- ================================================

-- 1. Verificar estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'reservation_comments' 
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS
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
WHERE tablename = 'reservation_comments';

-- 3. Verificar si hay comentarios existentes
SELECT 
    COUNT(*) as total_comments,
    COUNT(DISTINCT reservation_id) as reservations_with_comments
FROM reservation_comments;

-- 4. Verificar una reserva específica (usar ID de una reserva existente)
SELECT 
    r.id as reservation_id,
    r.guest_name,
    r.guest_email,
    COUNT(rc.id) as comment_count
FROM reservations r
LEFT JOIN reservation_comments rc ON r.id = rc.reservation_id
WHERE r.id IN (SELECT id FROM reservations LIMIT 5)
GROUP BY r.id, r.guest_name, r.guest_email
ORDER BY r.id;

-- 5. Intentar insertar un comentario de prueba (comentar si no se quiere ejecutar)
/*
INSERT INTO reservation_comments (reservation_id, text, author)
VALUES (
    (SELECT id FROM reservations LIMIT 1), 
    'Comentario de prueba - ' || NOW()::text, 
    'Sistema de Prueba'
);
*/

-- 6. Verificar permisos del usuario actual
SELECT 
    current_user as usuario_actual,
    session_user as usuario_sesion,
    current_setting('role') as rol_actual;

-- 7. Verificar triggers existentes
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'reservation_comments';