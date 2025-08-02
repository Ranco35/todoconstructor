-- Insertar roles si no existen
INSERT INTO public."Role" (name, permissions) VALUES
('SUPER_USER', 'ALL'),
('ADMINISTRADOR', 'CREATE,READ,UPDATE,DELETE'),
('JEFE_SECCION', 'CREATE,READ,UPDATE'),
('USUARIO_FINAL', 'READ')
ON CONFLICT (name) DO NOTHING;

-- Verificar que se insertaron
SELECT 'ROLES DESPUÉS DE LA INSERCIÓN:' as info;
SELECT id, name, permissions FROM public."Role" ORDER BY name; 