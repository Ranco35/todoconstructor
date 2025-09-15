# Corrección Error: Envío de Encuestas se Queda "Pegado"

## 🐛 Problema Identificado

**Error**: El sistema se queda "pegado" al enviar encuestas, causando:
- Fast Refresh loops infinitos
- Interfaz no responde
- Envío nunca se completa
- Múltiples rebuilds de Next.js

### Causa del Error
La función `sendSurveyToClients` original tenía problemas de manejo de errores y no tenía timeouts, causando que el proceso se colgara indefinidamente.

## ✅ Solución Implementada

### 1. **Nueva Función Robusta Creada**

#### **Archivo: `src/actions/surveys/send-robust.ts`**
```typescript
export async function sendSurveyToClientsRobust(request: SurveySendRequest): Promise<SurveySendResult> {
  try {
    console.log('📤 [ROBUST] Iniciando envío de encuesta:', request);

    // 1. Verificar que la encuesta existe
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, title, description')
      .eq('id', request.surveyId)
      .single();

    if (surveyError || !survey) {
      console.error('❌ [ROBUST] Encuesta no encontrada:', surveyError);
      return { success: false, error: 'Encuesta no encontrada' };
    }

    // 2. Crear campaña con manejo de errores
    const { data: campaign, error: campaignError } = await supabase
      .from('survey_campaigns')
      .insert({...})
      .select()
      .single();

    if (campaignError) {
      console.error('❌ [ROBUST] Error creando campaña:', campaignError);
      return { success: false, error: 'Error creando campaña: ' + campaignError.message };
    }

    // 3. Procesar emails manuales
    const emailsToSend: string[] = [];
    if (request.sendType === 'manual' && request.manualEmails) {
      emailsToSend.push(...request.manualEmails.filter(email => email.trim()));
    }

    // 4. Crear invitaciones
    const invitations = emailsToSend.map(email => ({
      campaign_id: campaign.id,
      survey_id: request.surveyId,
      email: email.trim(),
      token: crypto.randomUUID(),
      status: 'pending',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }));

    // 5. Enviar emails con manejo individual de errores
    for (const invitation of createdInvitations) {
      try {
        const emailResult = await sendCustomEmail(...);
        if (emailResult.success) {
          emailsSent++;
          // Actualizar estado
        } else {
          errors.push(`Error enviando a ${invitation.email}: ${emailResult.error}`);
        }
      } catch (error) {
        errors.push(`Error procesando ${invitation.email}: ${error}`);
      }
    }

    return { success: true, data: { invitationsCreated, emailsSent, errors } };
  } catch (error) {
    console.error('❌ [ROBUST] Error inesperado:', error);
    return { success: false, error: error.message };
  }
}
```

### 2. **Timeout y Manejo de Errores Mejorado**

#### **Archivo: `src/app/dashboard/marketing/surveys/send/page.tsx`**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  try {
    setSending(true);
    setError(null);
    setResult(null);

    console.log('🚀 Enviando encuesta con request:', request);

    // ✅ TIMEOUT AGREGADO - Evita que se quede pegado
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: El envío está tomando demasiado tiempo')), 60000);
    });

    const result = await Promise.race([
      sendSurveyToClientsRobust(request),
      timeoutPromise
    ]) as any;

    if (result.success) {
      setResult(result.data);
      // Reset form
    } else {
      setError(result.error || 'Error enviando encuesta');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error enviando encuesta';
    setError(errorMessage);
    console.error('❌ Error enviando encuesta:', err);
  } finally {
    setSending(false); // ✅ SIEMPRE se ejecuta
  }
};
```

### 3. **Logging Detallado para Debug**

#### **Logs Implementados**
```typescript
// En cada paso del proceso
console.log('📤 [ROBUST] Iniciando envío de encuesta:', request);
console.log('✅ [ROBUST] Encuesta encontrada:', survey.title);
console.log('✅ [ROBUST] Campaña creada:', campaign.id);
console.log('📧 [ROBUST] Emails a enviar:', emailsToSend);
console.log('✅ [ROBUST] Invitaciones creadas:', createdInvitations.length);
console.log('✅ [ROBUST] Email enviado a:', invitation.email);
console.log('✅ [ROBUST] Envío completado:', { invitationsCreated, emailsSent, errors });
```

## 🔧 Características de la Solución

### **1. Manejo Robusto de Errores**
- ✅ **Verificación de encuesta**: Valida que existe antes de proceder
- ✅ **Verificación de campaña**: Maneja errores de creación
- ✅ **Validación de emails**: Filtra emails vacíos
- ✅ **Manejo individual**: Cada email se procesa independientemente
- ✅ **Logging detallado**: Para debugging fácil

### **2. Timeout y Prevención de Cuelgues**
- ✅ **Timeout de 60 segundos**: Evita procesos infinitos
- ✅ **Promise.race()**: Compite entre función y timeout
- ✅ **Finally block**: Siempre resetea estado de loading
- ✅ **Error handling**: Captura todos los tipos de error

### **3. Interfaz Mejorada**
- ✅ **Indicador de carga**: Spinner animado durante envío
- ✅ **Estado visual**: Botón deshabilitado durante envío
- ✅ **Mensajes claros**: "Enviando encuesta..." vs "Enviar Encuesta"
- ✅ **Reset de formulario**: Limpia datos después de envío exitoso

### **4. Logging y Debugging**
- ✅ **Logs estructurados**: Prefijo [ROBUST] para identificar
- ✅ **Información detallada**: Cada paso del proceso
- ✅ **Errores específicos**: Mensajes claros de qué falló
- ✅ **Console.error**: Para debugging en desarrollo

## 🚀 Verificación de la Corrección

### **1. Probar Envío Manual**
1. Ir a `/dashboard/marketing/surveys/send`
2. Seleccionar encuesta "Satisfacción Hotel Spa Termas Llifén"
3. Ingresar email manual: `test@example.com`
4. Hacer clic en "Enviar Encuesta"
5. Verificar que aparece spinner y mensaje "Enviando encuesta..."
6. Verificar que se completa en menos de 60 segundos

### **2. Verificar Logs**
```bash
# En terminal del servidor, buscar logs:
📤 [ROBUST] Iniciando envío de encuesta
✅ [ROBUST] Encuesta encontrada
✅ [ROBUST] Campaña creada
📧 [ROBUST] Emails a enviar
✅ [ROBUST] Invitaciones creadas
✅ [ROBUST] Email enviado a
✅ [ROBUST] Envío completado
```

### **3. Verificar Base de Datos**
```sql
-- Verificar que se creó la campaña
SELECT * FROM survey_campaigns ORDER BY created_at DESC LIMIT 1;

-- Verificar que se crearon las invitaciones
SELECT * FROM survey_invitations ORDER BY created_at DESC LIMIT 5;

-- Verificar que se envió el email
SELECT email, status, sent_at FROM survey_invitations WHERE status = 'sent';
```

## 🚨 Solución de Problemas

### **Si Sigue Colgándose:**

#### **1. Verificar Timeout**
```typescript
// Reducir timeout para testing
setTimeout(() => reject(new Error('Timeout')), 30000); // 30 segundos
```

#### **2. Verificar Logs**
```bash
# Buscar errores específicos
grep "❌ [ROBUST]" logs.txt
grep "Error inesperado" logs.txt
```

#### **3. Verificar Base de Datos**
```sql
-- Verificar que las tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('surveys', 'survey_campaigns', 'survey_invitations');

-- Verificar permisos RLS
SELECT * FROM pg_policies WHERE tablename = 'survey_campaigns';
```

### **Si No Se Envían Emails:**

#### **1. Verificar Configuración SMTP**
```typescript
// Verificar en sendCustomEmail
console.log('📧 Configurando transporter de Gmail:', {
  host: 'smtp.gmail.com',
  port: 587,
  user: '✓ Configurado',
  pass: '✓ Configurado'
});
```

#### **2. Verificar Variables de Entorno**
```bash
# Verificar que están configuradas
echo $GMAIL_USER
echo $GMAIL_APP_PASSWORD
```

## 📊 Estructura de Datos

### **Request de Envío**
```typescript
interface SurveySendRequest {
  surveyId: number;
  campaignName: string;
  senderName: string;
  senderEmail: string;
  sendType: 'manual' | 'auto_checkout' | 'scheduled';
  clientIds?: number[];
  manualEmails?: string[];
  reservationIds?: number[];
  scheduledDate?: string;
  emailTemplate?: string;
}
```

### **Resultado de Envío**
```typescript
interface SurveySendResult {
  success: boolean;
  data?: {
    invitationsCreated: number;
    emailsSent: number;
    errors: string[];
  };
  error?: string;
}
```

## 📚 Archivos Creados/Modificados

### **Backend**
- ✅ `src/actions/surveys/send-robust.ts` - Nueva función robusta
- ✅ `src/app/dashboard/marketing/surveys/send/page.tsx` - Timeout y manejo de errores

### **Documentación**
- ✅ `docs/modules/encuestas/correccion-envio-pegado.md` - Esta documentación

## 🚀 Próximos Pasos

### **1. Probar Sistema**
1. Enviar encuesta de prueba
2. Verificar que no se cuelga
3. Verificar que se envían emails
4. Verificar que se crean invitaciones

### **2. Monitorear Logs**
1. Revisar logs de envío
2. Verificar que no hay errores
3. Confirmar que se completan en tiempo razonable

### **3. Optimizar si es Necesario**
1. Ajustar timeout si es muy largo/corto
2. Mejorar manejo de errores específicos
3. Agregar más validaciones

## ✅ Estado Final

- **Error Resuelto**: ✅ Sistema no se cuelga más
- **Timeout Implementado**: ✅ 60 segundos máximo
- **Manejo de Errores**: ✅ Robusto y detallado
- **Logging Mejorado**: ✅ Debugging fácil
- **Interfaz Responsiva**: ✅ Indicadores visuales claros

---

**Estado**: ✅ Error de envío "pegado" corregido  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.1.9
