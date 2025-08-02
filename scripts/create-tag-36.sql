-- ================================
-- SCRIPT SIMPLE: Crear Etiqueta ID 36
-- ================================

-- Crear la etiqueta que necesita la importación
INSERT INTO "ClientTag" (id, nombre, descripcion, "fechaCreacion")
VALUES (36, 'Agrupación Adultos Mayores', 'Etiqueta para agrupaciones de adultos mayores', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó
SELECT id, nombre, descripcion, "fechaCreacion" 
FROM "ClientTag" 
WHERE id = 36; 