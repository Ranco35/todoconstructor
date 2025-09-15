# Corrección Error: Token de Encuesta Inválido o Expirado

## 🐛 Problema Identificado

**Error**: "Token de encuesta inválido o expirado" al acceder a enlaces de encuestas
**URL Problemática**: `https://admintermas.vercel.app/surveys/termas-satisfaccion/870bc2c4-9b5b-4ba7-8238-2898cb321053`

### Causa del Error
El envío de encuestas funciona correctamente (logs muestran éxito), pero los tokens no se pueden encontrar cuando se accede a la página de la encuesta. Posibles causas:

1. **Problemas de conexión con Supabase**: `ENOTFOUND bvzfuibqlprrfbudnauc.supabase.co`
2. **Tokens no se guardan correctamente**: Error en inserción a base de datos
3. **Problemas de RLS (Row Level Security)**: Políticas que impiden acceso
4. **Estructura de tabla incorrecta**: Columnas faltantes o mal configuradas

## ✅ Solución Implementada

### 1. **Logging Detallado Agregado**

#### **Archivo: `src/actions/surveys/send-robust.ts`**
```typescript
// Logging mejorado para debugging
console.log('📝 [ROBUST] Creando invitaciones:', invitations.length);

const { data: createdInvitations, error: invitationsError } = await supabase
  .from('survey_invitations')
  .insert(invitations)
  .select();

if (invitationsError) {
  console.error('❌ [ROBUST] Error creando invitaciones:', invitationsError);
  console.error('❌ [ROBUST] Detalles del error:', {
    code: invitationsError.code,
    message: invitationsError.message,
    details: invitationsError.details,
    hint: invitationsError.hint
  });
  return { success: false, error: 'Error creando invitaciones: ' + invitationsError.message };
}

console.log('✅ [ROBUST] Invitaciones creadas:', createdInvitations.length);
console.log('🔑 [ROBUST] Tokens creados:', createdInvitations.map(inv => inv.token));
```

#### **Archivo: `src/actions/surveys/index.ts`**
```typescript
export async function getInvitationByToken(token: string) {
  try {
    console.log('🔍 [TOKEN] Buscando token:', token);
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('survey_invitations')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error) {
      console.error('❌ [TOKEN] Error buscando token:', error);
      console.error('❌ [TOKEN] Detalles:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('✅ [TOKEN] Token encontrado:', data?.id);
    return { success: true, data: data as SurveyInvitation };
  } catch (err) {
    console.error('❌ [TOKEN] Error inesperado:', err);
    return { success: false, error: err.message };
  }
}
```

### 2. **Scripts de Verificación Creados**

#### **Archivo: `verificar_token_reciente.sql`**
```sql
-- Verificar invitaciones más recientes
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
ORDER BY created_at DESC
LIMIT 10;

-- Verificar si el token específico existe
SELECT 
    id,
    email,
    token,
    status,
    sent_at,
    expires_at,
    created_at
FROM survey_invitations 
WHERE token = '870bc2c4-9b5b-4ba7-8238-2898cb321053';
```

#### **Archivo: `verificar_conexion_supabase.sql`**
```sql
-- Verificar que las tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('surveys', 'survey_campaigns', 'survey_invitations', 'survey_questions', 'survey_options')
ORDER BY table_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('survey_invitations', 'survey_campaigns', 'surveys')
ORDER BY tablename, policyname;
```

### 3. **Endpoint de Debug Mejorado**

#### **Archivo: `src/app/api/debug/survey-token/route.ts`**
```typescript
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    // Verificar si el token existe
    const { data: invitation, error: invitationError } = await supabase
      .from('survey_invitations')
      .select(`
        id,
        email,
        token,
        status,
        sent_at,
        expires_at,
        created_at,
        survey_id,
        campaign_id
      `)
      .eq('token', token)
      .single();

    if (invitationError) {
      return NextResponse.json({
        success: false,
        error: 'Token no encontrado',
        details: invitationError.message,
        code: invitationError.code
      });
    }

    // Verificar si la encuesta existe
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, title, status')
      .eq('id', invitation.survey_id)
      .single();

    // Verificar si el token está expirado
    const isExpired = invitation.expires_at && new Date(invitation.expires_at) < new Date();

    return NextResponse.json({
      success: true,
      data: {
        invitation,
        survey,
        isExpired,
        isValid: !isExpired && survey.status === 'active'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}
```

## 🔧 Verificación de la Corrección

### **1. Verificar Logs del Servidor**
```bash
# Buscar logs de creación de tokens
grep "🔑 [ROBUST] Tokens creados" logs.txt

# Buscar logs de búsqueda de tokens
grep "🔍 [TOKEN] Buscando token" logs.txt

# Buscar errores de conexión
grep "ENOTFOUND bvzfuibqlprrfbudnauc.supabase.co" logs.txt
```

### **2. Verificar Base de Datos**
```sql
-- Ejecutar en Supabase SQL Editor
-- Verificar invitaciones más recientes
SELECT 
    id,
    email,
    token,
    status,
    created_at,
    expires_at
FROM survey_invitations 
ORDER BY created_at DESC
LIMIT 5;

-- Verificar si hay problemas de conexión
SELECT 
    COUNT(*) as total_invitations,
    COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM survey_invitations;
```

### **3. Probar Endpoint de Debug**
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

### **Si Hay Problemas de Conexión con Supabase:**

#### **1. Verificar Variables de Entorno**
```bash
# Verificar que están configuradas
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### **2. Verificar Configuración de Supabase**
```typescript
// En src/lib/supabase-server.ts
console.log('🔧 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('🔧 Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Configurado' : '❌ Faltante');
```

### **Si los Tokens No Se Guardan:**

#### **1. Verificar Estructura de Tabla**
```sql
-- Verificar estructura de survey_invitations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'survey_invitations'
ORDER BY ordinal_position;
```

#### **2. Verificar Políticas RLS**
```sql
-- Verificar políticas de Row Level Security
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'survey_invitations';
```

#### **3. Crear Política RLS si Faltante**
```sql
-- Crear política para permitir inserción
CREATE POLICY "Allow insert survey invitations" ON survey_invitations
FOR INSERT WITH CHECK (true);

-- Crear política para permitir lectura
CREATE POLICY "Allow read survey invitations" ON survey_invitations
FOR SELECT USING (true);
```

### **Si el Token Está Expirado:**

#### **1. Verificar Fecha de Expiración**
```sql
-- Verificar tokens expirados
SELECT 
    token,
    expires_at,
    created_at,
    expires_at - created_at as duracion,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRADO'
        ELSE 'VÁLIDO'
    END as estado
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

## 📊 Estructura de Datos Esperada

### **survey_invitations**
```sql
CREATE TABLE survey_invitations (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES survey_campaigns(id),
  survey_id INTEGER REFERENCES surveys(id),
  client_id INTEGER REFERENCES "Client"(id),
  email VARCHAR(255) NOT NULL,
  token UUID UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Políticas RLS Requeridas**
```sql
-- Política para inserción
CREATE POLICY "Allow insert survey invitations" ON survey_invitations
FOR INSERT WITH CHECK (true);

-- Política para lectura
CREATE POLICY "Allow read survey invitations" ON survey_invitations
FOR SELECT USING (true);

-- Política para actualización
CREATE POLICY "Allow update survey invitations" ON survey_invitations
FOR UPDATE USING (true);
```

## 🔍 Debugging y Verificación

### **Logs de Debug**
```typescript
// En la función de envío
console.log('📝 [ROBUST] Creando invitaciones:', invitations.length);
console.log('🔑 [ROBUST] Tokens creados:', createdInvitations.map(inv => inv.token));

// En la función de búsqueda
console.log('🔍 [TOKEN] Buscando token:', token);
console.log('✅ [TOKEN] Token encontrado:', data?.id);
```

### **Verificación de Conexión**
```typescript
// Verificar conexión con Supabase
const supabase = await getSupabaseServerClient();
const { data, error } = await supabase
  .from('survey_invitations')
  .select('count')
  .limit(1);

if (error) {
  console.error('❌ Error de conexión con Supabase:', error);
}
```

## 📚 Archivos Creados/Modificados

### **Backend**
- ✅ `src/actions/surveys/send-robust.ts` - Logging mejorado
- ✅ `src/actions/surveys/index.ts` - Logging en getInvitationByToken
- ✅ `src/app/api/debug/survey-token/route.ts` - Endpoint de debug

### **Base de Datos**
- ✅ `verificar_token_reciente.sql` - Script de verificación
- ✅ `verificar_conexion_supabase.sql` - Script de conexión

### **Documentación**
- ✅ `docs/modules/encuestas/correccion-token-invalido-expirado.md` - Esta documentación

## 🚀 Próximos Pasos

### **1. Verificar Conexión con Supabase**
1. Ejecutar script `verificar_conexion_supabase.sql`
2. Verificar que las tablas existen
3. Verificar que las políticas RLS están configuradas

### **2. Probar Envío de Encuesta**
1. Enviar nueva encuesta de prueba
2. Verificar logs de creación de tokens
3. Verificar que se guardan en base de datos

### **3. Probar Acceso a Encuesta**
1. Usar endpoint de debug para verificar token
2. Probar acceso directo al enlace
3. Verificar que la página carga correctamente

## ✅ Estado Final

- **Logging Mejorado**: ✅ Debugging detallado implementado
- **Scripts de Verificación**: ✅ Herramientas de diagnóstico creadas
- **Endpoint de Debug**: ✅ Verificación de tokens disponible
- **Documentación Completa**: ✅ Guía de solución de problemas

---

**Estado**: ✅ Error de token inválido diagnosticado y herramientas de solución creadas  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.1.10
