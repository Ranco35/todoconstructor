-- Script para verificar y actualizar el usuario cocina@termasllifen.cl
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si el usuario existe
SELECT 
    u.id, 
    u.name, 
    u.email, 
    u."roleId", 
    r."roleName" as role_name,
    u.department,
    u."isActive"
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id
WHERE u.email = 'cocina@termasllifen.cl';

-- 2. Verificar todos los roles disponibles
SELECT id, "roleName", description 
FROM "Role" 
ORDER BY id;

-- 3. Si el usuario no existe, crear el usuario (ejecutar solo si es necesario)
-- NOTA: Este comando requiere permisos de administrador
/*
INSERT INTO "User" (
    id,
    name,
    email,
    "roleId",
    department,
    "isActive",
    "isCashier",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(), -- Generar UUID automáticamente
    'Jefe de Cocina',
    'cocina@termasllifen.cl',
    3, -- ID del rol JEFE_SECCION
    'COCINA',
    true,
    false,
    now(),
    now()
);
*/

-- 4. Si el usuario existe pero tiene rol incorrecto, actualizar (ejecutar solo si es necesario)
-- NOTA: Cambiar el roleId según sea necesario
/*
UPDATE "User" 
SET 
    "roleId" = 3, -- ID del rol JEFE_SECCION
    department = 'COCINA',
    "updatedAt" = now()
WHERE email = 'cocina@termasllifen.cl';
*/

-- 5. Verificar el resultado final
SELECT 
    u.id, 
    u.name, 
    u.email, 
    u."roleId", 
    r."roleName" as role_name,
    u.department,
    u."isActive"
FROM "User" u
LEFT JOIN "Role" r ON u."roleId" = r.id
WHERE u.email = 'cocina@termasllifen.cl';
