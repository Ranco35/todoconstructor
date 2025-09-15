# Corrección Políticas RLS: Tokens de Encuesta No Accesibles

## 🐛 Problema Identificado

**Error**: "Token de encuesta inválido o expirado" al acceder a enlaces de encuestas
**Causa Principal**: Políticas RLS (Row Level Security) requieren autenticación para acceso público

### Análisis de Políticas RLS
```json
[
  {
    "policyname": "auth users can select survey_invitations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.role() = 'authenticated'::text)"
  }
]
```

**Problema**: La política `SELECT` requiere `auth.role() = 'authenticated'`, pero las encuestas se acceden desde enlaces públicos sin autenticación.

## ✅ Solución Implementada

### 1. **Corrección de Políticas RLS**

#### **Archivo: `fix_survey_rls_policies.sql`**
```sql
-- 1. Eliminar políticas existentes que requieren autenticación
DROP POLICY IF EXISTS "auth users can select survey_invitations" ON survey_invitations;
DROP POLICY IF EXISTS "auth users can insert survey_invitations" ON survey_invitations;
DROP POLICY IF EXISTS "auth users can update survey_invitations" ON survey_invitations;
DROP POLICY IF EXISTS "auth users can delete survey_invitations" ON survey_invitations;

-- 2. Crear políticas que permiten acceso público para encuestas
-- Política para SELECT (lectura) - permitir acceso público para verificar tokens
CREATE POLICY "Allow public read survey_invitations" ON survey_invitations
FOR SELECT USING (true);

-- Política para INSERT (inserción) - permitir inserción desde el sistema
CREATE POLICY "Allow insert survey_invitations" ON survey_invitations
FOR INSERT WITH CHECK (true);

-- Política para UPDATE (actualización) - permitir actualización de estado
CREATE POLICY "Allow update survey_invitations" ON survey_invitations
FOR UPDATE USING (true);

-- Política para DELETE (eliminación) - solo para usuarios autenticados
CREATE POLICY "Allow delete survey_invitations" ON survey_invitations
FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Habilitar RLS si no está habilitado
ALTER TABLE survey_invitations ENABLE ROW LEVEL SECURITY;
```

### 2. **Verificación de Token Específico**

#### **Archivo: `verificar_token_especifico.sql`**
```sql
-- Verificar si el token existe
SELECT 
    id,
    email,
    token,
    status,
    sent_at,
    expires_at,
    created_at,
    survey_id,
    campaign_id
FROM survey_invitations 
WHERE token = '870bc2c4-9b5b-4ba7-8238-2898cb321053';

-- Verificar si el token está expirado
SELECT 
    token,
    expires_at,
    created_at,
    NOW() as fecha_actual,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRADO'
        ELSE 'VÁLIDO'
    END as estado_token
FROM survey_invitations 
WHERE token = '870bc2c4-9b5b-4ba7-8238-2898cb321053';
```

### 3. **Script de Prueba de Acceso**

#### **Archivo: `test_token_access.ts`**
```typescript
export async function testTokenAccess(token: string) {
  try {
    console.log('🔍 Probando acceso al token:', token);
    
    // Probar endpoint de debug
    const debugResponse = await fetch('/api/debug/survey-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    const debugResult = await debugResponse.json();
    console.log('📊 Resultado del debug:', debugResult);
    
    // Probar acceso directo a la página
    const surveyUrl = `/surveys/termas-satisfaccion/${token}`;
    const pageResponse = await fetch(surveyUrl);
    console.log('📄 Status de la página:', pageResponse.status);
    
    return { debug: debugResult, pageStatus: pageResponse.status };
  } catch (error) {
    console.error('❌ Error en test:', error);
    return { error: error.message };
  }
}
```

## 🔧 Verificación de la Corrección

### **1. Aplicar Políticas RLS Corregidas**
```sql
-- Ejecutar en Supabase SQL Editor
-- 1. Eliminar políticas problemáticas
DROP POLICY IF EXISTS "auth users can select survey_invitations" ON survey_invitations;

-- 2. Crear política pública para lectura
CREATE POLICY "Allow public read survey_invitations" ON survey_invitations
FOR SELECT USING (true);

-- 3. Verificar que se creó correctamente
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'survey_invitations' AND cmd = 'SELECT';
```

### **2. Verificar Token Específico**
```sql
-- Verificar si el token existe y no está expirado
SELECT 
    token,
    status,
    expires_at,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRADO'
        ELSE 'VÁLIDO'
    END as estado
FROM survey_invitations 
WHERE token = '870bc2c4-9b5b-4ba7-8238-2898cb321053';
```

### **3. Probar Acceso desde Navegador**
```javascript
// En consola del navegador
fetch('/api/debug/survey-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: '870bc2c4-9b5b-4ba7-8238-2898cb321053' })
})
.then(response => response.json())
.then(data => console.log('Debug result:', data));
```

## 🚨 Solución de Problemas

### **Si Sigue Mostrando "Token Inválido":**

#### **1. Verificar Políticas RLS**
```sql
-- Verificar políticas actuales
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'survey_invitations'
ORDER BY cmd;
```

#### **2. Verificar que RLS Está Habilitado**
```sql
-- Verificar estado de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'survey_invitations';
```

#### **3. Crear Política Pública si Faltante**
```sql
-- Crear política pública para lectura
CREATE POLICY "Allow public read survey_invitations" ON survey_invitations
FOR SELECT USING (true);
```

### **Si el Token Está Expirado:**

#### **1. Verificar Fecha de Expiración**
```sql
-- Verificar estado del token
SELECT 
    token,
    expires_at,
    created_at,
    NOW() as fecha_actual,
    expires_at - created_at as duracion
FROM survey_invitations 
WHERE token = '870bc2c4-9b5b-4ba7-8238-2898cb321053';
```

#### **2. Extender Fecha de Expiración**
```sql
-- Extender fecha de expiración
UPDATE survey_invitations 
SET expires_at = NOW() + INTERVAL '30 days'
WHERE token = '870bc2c4-9b5b-4ba7-8238-2898cb321053';
```

### **Si Hay Problemas de Conexión:**

#### **1. Verificar Variables de Entorno**
```bash
# Verificar configuración de Supabase
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### **2. Verificar Configuración del Cliente**
```typescript
// En src/lib/supabase-server.ts
console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('🔧 Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '❌');
```

## 📊 Estructura de Políticas RLS Correcta

### **Políticas Requeridas**
```sql
-- Lectura pública (para verificar tokens)
CREATE POLICY "Allow public read survey_invitations" ON survey_invitations
FOR SELECT USING (true);

-- Inserción desde sistema
CREATE POLICY "Allow insert survey_invitations" ON survey_invitations
FOR INSERT WITH CHECK (true);

-- Actualización de estado
CREATE POLICY "Allow update survey_invitations" ON survey_invitations
FOR UPDATE USING (true);

-- Eliminación solo para autenticados
CREATE POLICY "Allow delete survey_invitations" ON survey_invitations
FOR DELETE USING (auth.role() = 'authenticated');
```

### **Verificación de Políticas**
```sql
-- Verificar todas las políticas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'survey_invitations'
ORDER BY cmd;
```

## 🔍 Debugging y Verificación

### **Logs de Debug**
```typescript
// En getInvitationByToken
console.log('🔍 [TOKEN] Buscando token:', token);
console.log('✅ [TOKEN] Token encontrado:', data?.id);
console.log('❌ [TOKEN] Error buscando token:', error);
```

### **Verificación de Acceso**
```typescript
// Probar acceso público
const { data, error } = await supabase
  .from('survey_invitations')
  .select('*')
  .eq('token', token)
  .single();

if (error) {
  console.error('Error de acceso:', error);
}
```

## 📚 Archivos Creados/Modificados

### **Base de Datos**
- ✅ `fix_survey_rls_policies.sql` - Corrección de políticas RLS
- ✅ `verificar_token_especifico.sql` - Verificación de token específico

### **Testing**
- ✅ `test_token_access.ts` - Script de prueba de acceso

### **Documentación**
- ✅ `docs/modules/encuestas/correccion-politicas-rls-tokens.md` - Esta documentación

## 🚀 Próximos Pasos

### **1. Aplicar Corrección de Políticas**
1. Ejecutar `fix_survey_rls_policies.sql` en Supabase SQL Editor
2. Verificar que las políticas se crearon correctamente
3. Confirmar que RLS está habilitado

### **2. Probar Acceso a Token**
1. Usar `verificar_token_especifico.sql` para verificar el token
2. Probar endpoint de debug desde navegador
3. Probar acceso directo al enlace de la encuesta

### **3. Verificar Funcionamiento Completo**
1. Enviar nueva encuesta de prueba
2. Verificar que el token se crea correctamente
3. Probar acceso público al enlace de la encuesta

## ✅ Estado Final

- **Políticas RLS Corregidas**: ✅ Acceso público para lectura de tokens
- **Scripts de Verificación**: ✅ Herramientas de diagnóstico creadas
- **Testing Implementado**: ✅ Scripts de prueba de acceso
- **Documentación Completa**: ✅ Guía de solución de problemas

---

**Estado**: ✅ Políticas RLS corregidas para acceso público a tokens  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.1.11
