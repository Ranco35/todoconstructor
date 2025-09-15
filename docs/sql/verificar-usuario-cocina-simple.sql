-- Script simple para verificar el usuario cocina@termasllifen.cl
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

-- 2. Ver todos los roles disponibles
SELECT id, "roleName", description 
FROM "Role" 
ORDER BY id;
