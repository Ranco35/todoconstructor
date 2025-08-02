# Fix: Error "column u.roleid does not exist" en Actualización de Proveedores

## 🚨 **Problema**

Error al actualizar proveedores:
```
Error: Error actualizando proveedor: column u.roleid does not exist
```

## 🔍 **Causa Raíz**

La función `get_user_role()` en PostgreSQL estaba usando nombres de columna sin comillas dobles, lo que causaba que PostgreSQL las interpretara en minúsculas:

### **Función Original (Problemática)**
```sql
SELECT r.roleName 
INTO user_role
FROM "User" u
JOIN "Role" r ON u.roleId = r.id  -- ❌ Sin comillas = se convierte a minúsculas
WHERE u.id = auth.uid()
AND u.isActive = true;
```

### **Resultado en PostgreSQL**
- `u.roleId` se convertía a `u.roleid` (minúsculas)
- La columna real es `u."roleId"` (con I mayúscula)
- Error: "column u.roleid does not exist"

## 🛠️ **Solución Implementada**

### **1. Migración Correctiva: `20250628000004_fix_user_role_function_properly.sql`**

```sql
-- 1. Eliminar políticas que dependen de la función
DROP POLICY IF EXISTS "Allow insert suppliers for admin and jefe" ON "Supplier";
DROP POLICY IF EXISTS "Allow update suppliers for admin and jefe" ON "Supplier";  
DROP POLICY IF EXISTS "Allow delete suppliers for admin only" ON "Supplier";

-- 2. Eliminar función existente
DROP FUNCTION IF EXISTS get_user_role();

-- 3. Recrear función con nombres de columna correctos (con comillas dobles)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT r."roleName" 
  INTO user_role
  FROM "User" u
  JOIN "Role" r ON u."roleId" = r."id"  -- ✅ Con comillas dobles
  WHERE u."id" = auth.uid()
  AND u."isActive" = true;
  
  RETURN COALESCE(user_role, 'USUARIO_FINAL');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear políticas usando la función corregida
-- [... recreación de todas las políticas RLS]
```

### **2. Cambios Clave**

| Antes | Después | Motivo |
|-------|---------|--------|
| `u.roleId` | `u."roleId"` | Preservar case-sensitive |
| `r.id` | `r."id"` | Preservar case-sensitive |
| `r.roleName` | `r."roleName"` | Preservar case-sensitive |
| `u.id` | `u."id"` | Preservar case-sensitive |
| `u.isActive` | `u."isActive"` | Preservar case-sensitive |

## ✅ **Proceso de Corrección**

### **Paso 1: Manejo de Dependencias**
- Eliminar políticas RLS que dependen de la función
- Evitar el error "cannot drop function because other objects depend on it"

### **Paso 2: Recreación de Función**
- Usar comillas dobles en todos los nombres de columna
- Mantener la misma lógica pero con sintaxis correcta

### **Paso 3: Restauración de Políticas**
- Recrear todas las políticas RLS
- Mantener los mismos permisos granulares

## 🎯 **Resultado**

### **Antes (Error)**
```
❌ Error actualizando proveedor: column u.roleid does not exist
```

### **Después (Funcionando)**
```
✅ Proveedor actualizado correctamente
✅ Políticas RLS funcionando
✅ Permisos granulares operativos
```

## 📝 **Lección Aprendida**

En PostgreSQL, cuando se usan nombres de tabla/columna con CamelCase o caracteres especiales:

- **✅ CORRECTO**: `"User"."roleId"` - Preserva el case original
- **❌ INCORRECTO**: `User.roleId` - Se convierte a minúsculas automáticamente

## 🔧 **Verificación**

Para verificar que la función funciona correctamente:

```sql
-- Probar la función
SELECT get_user_role();

-- Verificar políticas
\d+ "Supplier"  -- Ver políticas en la tabla

-- Probar operaciones
SELECT * FROM "Supplier" LIMIT 1;  -- Debe funcionar
UPDATE "Supplier" SET name = name WHERE id = 1;  -- Debe respetar permisos
```

## 📁 **Archivos Afectados**

- `supabase/migrations/20250628000004_fix_user_role_function_properly.sql` - Nueva migración correctiva
- Función `get_user_role()` - Corregida con comillas dobles
- Políticas RLS en tabla `Supplier` - Recreadas correctamente

---

**✅ PROBLEMA RESUELTO - Actualización de proveedores funcionando correctamente** 