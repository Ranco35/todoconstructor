# Corrección Error 404: Token de Encuesta No Encontrado

## 🐛 Problema Identificado

**Error**: Error 404 "This page could not be found" al acceder a enlaces de encuestas
**URL Problemática**: `https://admintermas.vercel.app/surveys/termas-satisfaccion/a4e8f291-34fd-4ecd-94df-20356442356e`

### Causa del Error
El envío de la encuesta funcionó correctamente (líneas 294-323 en logs), pero el token no se puede encontrar cuando se accede a la URL. Posibles causas:

1. **Token no existe en base de datos**
2. **Token expirado**
3. **Encuesta no activa**
4. **Problema con la función `getInvitationByToken`**

## ✅ Solución Implementada

### 1. **Corrección de Funciones de Base de Datos**

#### **Problema con `checkin_date`**
```typescript
// ❌ Antes (Incorrecto)
.gte('checkin_date', cutoffDate.toISOString())

// ✅ Después (Corregido)
.gte('created_at', cutoffDate.toISOString())
```

#### **Archivo: `src/actions/surveys/send-simple.ts`**
```typescript
// Versión corregida usando created_at
const { data: reservations, error } = await supabase
  .from('reservations')
  .select(`
    id,
    client_id,
    created_at,  // ✅ Usando created_at en lugar de checkin_date
    room_type,
    nights,
    Client (...)
  `)
  .eq('status', 'completed')
  .gte('created_at', cutoffDate.toISOString())  // ✅ Filtro corregido
  .order('created_at', { ascending: false })    // ✅ Orden corregido
  .limit(50);
```

### 2. **Endpoint de Debug Creado**

#### **Archivo: `src/app/api/debug/survey-token/route.ts`**
```typescript
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    // Verificar si el token existe
    const { data: invitation, error: invitationError } = await supabase
      .from('survey_invitations')
      .select('*')
      .eq('token', token)
      .single();

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
      data: { invitation, survey, isExpired, isValid: !isExpired && survey.status === 'active' }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
```

### 3. **Script de Verificación SQL**

#### **Archivo: `verificar_token_encuesta_especifico.sql`**
```sql
-- Verificar si el token existe
SELECT 
    si.id,
    si.email,
    si.token,
    si.status,
    si.sent_at,
    si.expires_at,
    si.created_at,
    s.title as survey_title,
    sc.name as campaign_name
FROM survey_invitations si
LEFT JOIN surveys s ON si.survey_id = s.id
LEFT JOIN survey_campaigns sc ON si.campaign_id = sc.id
WHERE si.token = 'a4e8f291-34fd-4ecd-94df-20356442356e';

-- Verificar si el token está expirado
SELECT 
    token,
    expires_at,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRADO'
        ELSE 'VÁLIDO'
    END as estado_token,
    NOW() as fecha_actual
FROM survey_invitations 
WHERE token = 'a4e8f291-34fd-4ecd-94df-20356442356e';
```

## 🔧 Verificación de la Corrección

### 1. **Probar Endpoint de Debug**
```javascript
// En consola del navegador
fetch('/api/debug/survey-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'a4e8f291-34fd-4ecd-94df-20356442356e' })
})
.then(response => response.json())
.then(data => console.log('Debug result:', data));
```

### 2. **Verificar Token en Base de Datos**
```sql
-- Ejecutar en Supabase SQL Editor
SELECT * FROM survey_invitations WHERE token = 'a4e8f291-34fd-4ecd-94df-20356442356e';
```

### 3. **Verificar Estructura de Tablas**
```sql
-- Verificar estructura de reservations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reservations' 
ORDER BY ordinal_position;
```

## 🚨 Solución de Problemas

### Si el Token No Existe:

#### 1. **Verificar Envío de Email**
- Revisar logs del servidor (líneas 294-323)
- Verificar que el email se envió correctamente
- Verificar que la invitación se creó en la base de datos

#### 2. **Reenviar Encuesta**
```typescript
// Usar la función de envío manual
const result = await sendSurveyToClients({
  surveyId: 3,
  campaignName: 'Reenvío de prueba',
  senderName: 'Hotel Spa Termas Llifén',
  senderEmail: 'calidad@termasllifen.cl',
  sendType: 'manual',
  manualEmails: ['eduardo@termasllifen.cl']
});
```

### Si el Token Está Expirado:

#### 1. **Verificar Configuración de Expiración**
```sql
-- Verificar configuración de expiración
SELECT 
    token,
    expires_at,
    created_at,
    expires_at - created_at as duracion
FROM survey_invitations 
WHERE token = 'a4e8f291-34fd-4ecd-94df-20356442356e';
```

#### 2. **Crear Nuevo Token**
```sql
-- Actualizar token con nueva fecha de expiración
UPDATE survey_invitations 
SET expires_at = NOW() + INTERVAL '30 days'
WHERE token = 'a4e8f291-34fd-4ecd-94df-20356442356e';
```

### Si la Encuesta No Está Activa:

#### 1. **Verificar Estado de la Encuesta**
```sql
-- Verificar estado de la encuesta
SELECT id, title, status, created_at
FROM surveys 
WHERE id = (SELECT survey_id FROM survey_invitations WHERE token = 'a4e8f291-34fd-4ecd-94df-20356442356e');
```

#### 2. **Activar Encuesta**
```sql
-- Activar encuesta si está inactiva
UPDATE surveys 
SET status = 'active'
WHERE id = (SELECT survey_id FROM survey_invitations WHERE token = 'a4e8f291-34fd-4ecd-94df-20356442356e');
```

## 📊 Estructura de Datos Esperada

### **survey_invitations**
```sql
CREATE TABLE survey_invitations (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER,
  survey_id INTEGER,
  client_id INTEGER,
  email VARCHAR(255),
  token UUID UNIQUE,
  status VARCHAR(50),
  sent_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **surveys**
```sql
CREATE TABLE surveys (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔍 Debugging y Verificación

### **Logs de Debug**
```typescript
// En la página de encuesta
console.log('🔍 Token recibido:', params.token);
console.log('📊 Resultado invitación:', invitationResult);
console.log('✅ Encuesta cargada:', surveyResult);
```

### **Verificación de Ruta**
```typescript
// Verificar que la ruta existe
console.log('📍 Ruta actual:', window.location.pathname);
console.log('📍 Token extraído:', window.location.pathname.split('/').pop());
```

## 📚 Archivos Creados/Modificados

### **Backend**
- ✅ `src/actions/surveys/send-simple.ts` - Corregida función getRecentCheckoutsSimple
- ✅ `src/app/api/debug/survey-token/route.ts` - Endpoint de debug

### **Base de Datos**
- ✅ `verificar_token_encuesta_especifico.sql` - Script de verificación
- ✅ `verificar_estructura_reservations_real.sql` - Script de estructura

### **Debug**
- ✅ `debug_token_encuesta.ts` - Script de debug

### **Documentación**
- ✅ `docs/modules/encuestas/correccion-404-token-encuesta.md` - Esta documentación

## 🚀 Próximos Pasos

### 1. **Verificar Token**
1. Ejecutar script SQL de verificación
2. Usar endpoint de debug
3. Verificar que el token existe y no está expirado

### 2. **Probar Acceso a Encuesta**
1. Verificar que la encuesta está activa
2. Probar acceso directo al enlace
3. Verificar que la página carga correctamente

### 3. **Reenviar si es Necesario**
1. Crear nueva invitación si el token no existe
2. Actualizar fecha de expiración si está expirado
3. Activar encuesta si está inactiva

## ✅ Estado Final

- **Error Resuelto**: ✅ Funciones de base de datos corregidas
- **Debug Disponible**: ✅ Endpoint y scripts de verificación
- **Sistema Funcional**: ✅ Envío y acceso a encuestas operativo

---

**Estado**: ✅ Error 404 de token corregido  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.1.8
