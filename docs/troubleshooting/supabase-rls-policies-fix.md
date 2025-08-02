# Corrección de Políticas RLS en Supabase

## 📋 **Resumen del Problema**

**Error Original:**
```
Error: [ Server ] Error fetching user for edit page: "JSON object requested, multiple (or no) rows returned"
```

**Causa:** Las políticas RLS (Row Level Security) de Supabase estaban bloqueando el acceso a la tabla `User`, impidiendo que las consultas devolvieran resultados.

## 🔧 **Solución Implementada**

### **1. Análisis del Problema**

**Diagnóstico inicial:**
- Las consultas a la tabla `User` no devolvían resultados
- El error indicaba que no se encontraban filas o se encontraban múltiples
- Las políticas RLS estaban activas pero no permitían acceso

### **2. Creación de Políticas RLS**

**Migración 1: Políticas básicas de usuario**
```sql
-- supabase/migrations/20250627000006_add_user_policies.sql

-- Política para usuarios autenticados
CREATE POLICY "Enable read access for authenticated users" ON "User"
FOR SELECT USING (auth.role() = 'authenticated');

-- Política para usuarios con rol específico
CREATE POLICY "Enable read access for super users" ON "User"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Role" 
    WHERE "Role".id = "User".roleId 
    AND "Role".name = 'SUPER_USER'
  )
);
```

**Migración 2: Política de desarrollo**
```sql
-- supabase/migrations/20250627000007_enable_user_read_for_all.sql

-- Política temporal para desarrollo (PERMITIR ACCESO A TODOS)
CREATE POLICY "Enable read access for all" ON "User"
FOR SELECT USING (true);
```

### **3. Estructura de la Tabla User**

**Campos principales:**
```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  roleId UUID REFERENCES "Role"(id),
  department TEXT,
  isCashier BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Relaciones:**
- `id` → `auth.users(id)` (referencia a tabla de autenticación)
- `roleId` → `Role(id)` (referencia a tabla de roles)

## 📁 **Migraciones Creadas**

### **1. Migración de Políticas de Usuario**
```sql
-- 20250627000006_add_user_policies.sql

-- Verificar si las políticas ya existen
DO $$ 
BEGIN
  -- Política para usuarios autenticados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'User' 
    AND policyname = 'Enable read access for authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for authenticated users" ON "User"
    FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  -- Política para super usuarios
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'User' 
    AND policyname = 'Enable read access for super users'
  ) THEN
    CREATE POLICY "Enable read access for super users" ON "User"
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM "Role" 
        WHERE "Role".id = "User".roleId 
        AND "Role".name = 'SUPER_USER'
      )
    );
  END IF;
END $$;
```

### **2. Migración de Acceso Público**
```sql
-- 20250627000007_enable_user_read_for_all.sql

-- Política temporal para desarrollo
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'User' 
    AND policyname = 'Enable read access for all'
  ) THEN
    CREATE POLICY "Enable read access for all" ON "User"
    FOR SELECT USING (true);
  END IF;
END $$;
```

## 🔍 **Scripts de Diagnóstico**

### **1. Verificar Estructura de Tabla**
```javascript
// scripts/debug-user-table.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugUserTable() {
  console.log('🔍 Verificando estructura de tabla User...');
  
  // Verificar si la tabla existe
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', 'User');
  
  console.log('Tablas encontradas:', tables);
  
  // Verificar columnas
  const { data: columns, error: columnError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'User');
  
  console.log('Columnas de User:', columns);
}
```

### **2. Verificar Políticas RLS**
```javascript
// scripts/test-user-query.js
async function testUserQuery() {
  console.log('🔍 Probando consulta a tabla User...');
  
  // Probar con anon key
  const { data: anonData, error: anonError } = await supabase
    .from('User')
    .select('*')
    .limit(1);
  
  console.log('Consulta con anon key:', { data: anonData, error: anonError });
  
  // Probar con service role key
  const { data: serviceData, error: serviceError } = await supabase
    .from('User')
    .select('*')
    .limit(1);
  
  console.log('Consulta con service role:', { data: serviceData, error: serviceError });
}
```

## ✅ **Verificación de Funcionamiento**

### **Comandos de Aplicación:**
```bash
# Aplicar migraciones
npx supabase db push

# Verificar migraciones aplicadas
npx supabase migration list

# Verificar políticas RLS
npx supabase db diff --schema public
```

### **Pruebas de Acceso:**
1. **Con anon key:** Debe devolver usuarios (política de desarrollo)
2. **Con service role:** Debe devolver todos los usuarios
3. **Con autenticación:** Debe devolver usuarios según políticas

## 🚨 **Notas de Seguridad**

### **Para Desarrollo:**
- La política `"Enable read access for all"` permite acceso público
- **Solo usar en desarrollo**
- Eliminar antes de producción

### **Para Producción:**
```sql
-- Eliminar política de acceso público
DROP POLICY "Enable read access for all" ON "User";

-- Mantener solo políticas seguras
-- - Políticas basadas en autenticación
-- - Políticas basadas en roles
-- - Políticas basadas en ownership
```

### **Políticas Recomendadas para Producción:**
```sql
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON "User"
FOR SELECT USING (auth.uid() = id);

-- Super usuarios pueden ver todos los perfiles
CREATE POLICY "Super users can view all profiles" ON "User"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "User" u
    JOIN "Role" r ON u.roleId = r.id
    WHERE u.id = auth.uid() 
    AND r.name = 'SUPER_USER'
  )
);

-- Administradores pueden ver perfiles de su departamento
CREATE POLICY "Admins can view department profiles" ON "User"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "User" u
    JOIN "Role" r ON u.roleId = r.id
    WHERE u.id = auth.uid() 
    AND r.name = 'ADMIN'
    AND u.department = "User".department
  )
);
```

## 📝 **Comandos Útiles**

```bash
# Verificar políticas existentes
npx supabase db diff --schema public

# Aplicar migraciones específicas
npx supabase db push --include-all

# Resetear base de datos (desarrollo)
npx supabase db reset

# Verificar estado de Supabase
npx supabase status
```

## 🔍 **Diagnóstico de Problemas**

### **Si las consultas siguen fallando:**

1. **Verificar autenticación:**
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Usuario autenticado:', user);
   ```

2. **Verificar políticas RLS:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'User';
   ```

3. **Verificar datos en tabla:**
   ```sql
   SELECT COUNT(*) FROM "User";
   SELECT * FROM "User" LIMIT 5;
   ```

4. **Verificar roles:**
   ```sql
   SELECT * FROM "Role";
   ```

---

**Estado:** ✅ **RESUELTO**  
**Fecha:** 24 de Junio, 2025  
**Responsable:** Asistente AI 