-- Script para crear o actualizar el usuario cocina@termasllifen.cl
-- Ejecutar en Supabase SQL Editor

-- OPCIÓN 1: Si el usuario NO existe, crear nuevo usuario
-- Descomenta las siguientes líneas si necesitas crear el usuario:

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
    gen_random_uuid(),
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

-- OPCIÓN 2: Si el usuario YA existe pero tiene rol incorrecto, actualizar
-- Descomenta las siguientes líneas si necesitas actualizar el rol:

/*
UPDATE "User" 
SET 
    "roleId" = 3, -- ID del rol JEFE_SECCION
    department = 'COCINA',
    "updatedAt" = now()
WHERE email = 'cocina@termasllifen.cl';
*/

-- Verificar el resultado
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
