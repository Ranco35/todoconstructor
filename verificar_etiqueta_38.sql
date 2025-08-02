-- Verificar si existe la etiqueta ID 38
SELECT id, nombre, descripcion, "fechaCreacion" 
FROM "ClientTag" 
WHERE id = 38;

-- Si no existe, crearla
INSERT INTO "ClientTag" (id, nombre, descripcion, "fechaCreacion")
VALUES (38, 'Autocuidado', 'Etiqueta para clientes enfocados en autocuidado', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó correctamente
SELECT id, nombre, descripcion, "fechaCreacion" 
FROM "ClientTag" 
WHERE id = 38;

-- Ver todas las etiquetas para contexto
SELECT id, nombre, descripcion 
FROM "ClientTag" 
ORDER BY id; 