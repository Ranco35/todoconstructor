-- ================================
-- SCRIPT: Verificar y Crear Etiquetas
-- PROPÓSITO: Resolver problema de importación de clientes
-- FECHA: $(date)
-- ================================

-- 1. VERIFICAR ETIQUETAS EXISTENTES
SELECT 'ETIQUETAS EXISTENTES:' as info;
SELECT id, nombre, descripcion, "fechaCreacion" 
FROM "ClientTag" 
ORDER BY id;

-- 2. VERIFICAR SI EXISTE ID 36
SELECT 'VERIFICAR ID 36:' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM "ClientTag" WHERE id = 36) 
    THEN '✅ ID 36 EXISTE' 
    ELSE '❌ ID 36 NO EXISTE' 
  END as resultado;

-- 3. CONTAR TOTAL DE ETIQUETAS
SELECT 'TOTAL ETIQUETAS:' as info;
SELECT COUNT(*) as total_etiquetas FROM "ClientTag";

-- 4. CREAR ETIQUETA ID 36 SI NO EXISTE
-- (Esto creará la etiqueta "Agrupación Adultos Mayores" con ID 36)
INSERT INTO "ClientTag" (id, nombre, descripcion, "fechaCreacion")
SELECT 36, 'Agrupación Adultos Mayores', 'Etiqueta para agrupaciones de adultos mayores', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "ClientTag" WHERE id = 36);

-- 5. VERIFICAR CREACIÓN
SELECT 'DESPUÉS DE CREAR:' as info;
SELECT id, nombre, descripcion, "fechaCreacion" 
FROM "ClientTag" 
WHERE id = 36;

-- 6. RESETEAR SECUENCIA DE ID (importante para futuras inserciones)
SELECT 'AJUSTANDO SECUENCIA:' as info;
SELECT setval(pg_get_serial_sequence('"ClientTag"', 'id'), COALESCE(MAX(id), 1)) 
FROM "ClientTag";

-- 7. RESULTADO FINAL
SELECT 'RESUMEN FINAL:' as info;
SELECT 
  COUNT(*) as total_etiquetas,
  CASE 
    WHEN EXISTS (SELECT 1 FROM "ClientTag" WHERE id = 36) 
    THEN '✅ ID 36 LISTO PARA IMPORTACIÓN' 
    ELSE '❌ PROBLEMA PERSISTE' 
  END as estado_id_36
FROM "ClientTag"; 