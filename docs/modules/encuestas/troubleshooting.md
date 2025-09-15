# 🚨 Troubleshooting - Módulo de Encuestas

## 📋 Problemas Comunes y Soluciones

---

## ❌ Error: "No se puede crear encuesta"

### Síntomas
- El formulario no responde al hacer clic en "Crear"
- No aparece mensaje de error
- La página se recarga pero no se crea la encuesta

### Diagnóstico
```sql
-- 1. Verificar que las tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'survey%';

-- 2. Verificar políticas RLS
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'surveys';

-- 3. Verificar rol del usuario
SELECT auth.uid() as user_id, auth.role() as user_role;
```

### Soluciones

**Solución 1: Verificar Autenticación**
```sql
-- Deshabilitar RLS temporalmente para debug
ALTER TABLE surveys DISABLE ROW LEVEL SECURITY;

-- Probar crear encuesta desde la aplicación
-- Si funciona, el problema es de autenticación

-- Rehabilitar RLS
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
```

**Solución 2: Verificar Conexión Supabase**
```typescript
// Agregar logging en createSurvey
export async function createSurvey(input: CreateSurveyInput) {
  try {
    console.log('🔍 Debug createSurvey:', { input, timestamp: new Date() });
    const supabase = await getSupabaseServerClient();
    console.log('✅ Supabase client obtenido');
    
    const { data, error } = await supabase
      .from('surveys')
      .insert({ title: input.title, description: input.description || null, status: 'draft' })
      .select('*')
      .single();
      
    console.log('📊 Resultado insert:', { data, error });
    
    if (error) {
      console.error('❌ Error Supabase:', error);
      throw error;
    }
    
    return { success: true, data: data as Survey };
  } catch (err) {
    console.error('❌ Error completo:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error creando encuesta' };
  }
}
```

**Solución 3: Verificar Permisos**
```sql
-- Verificar que el usuario tiene permisos
SELECT 
  u.email,
  u.role,
  CASE 
    WHEN u.role = 'ADMINISTRADOR' THEN 'Puede crear encuestas'
    ELSE 'No puede crear encuestas'
  END as permiso
FROM auth.users u
WHERE u.id = auth.uid();
```

---

## ❌ Error: "No aparecen encuestas en la lista"

### Síntomas
- La página carga pero muestra "No hay encuestas creadas"
- Se crearon encuestas desde SQL pero no aparecen en la UI

### Diagnóstico
```sql
-- Verificar que existen encuestas
SELECT * FROM surveys ORDER BY created_at DESC;

-- Verificar políticas de SELECT
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'surveys' AND cmd = 'SELECT';
```

### Soluciones

**Solución 1: Verificar RLS**
```sql
-- La política SELECT requiere autenticación
-- Verificar que el usuario está autenticado
SELECT auth.role() as current_role;

-- Si es null, el usuario no está autenticado
```

**Solución 2: Debug listSurveys**
```typescript
// Agregar logging en listSurveys
export async function listSurveys() {
  try {
    console.log('🔍 Debug listSurveys iniciando...');
    const supabase = await getSupabaseServerClient();
    console.log('✅ Supabase client obtenido');
    
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });
      
    console.log('📊 Resultado select:', { data, error, count: data?.length });
    
    if (error) {
      console.error('❌ Error Supabase:', error);
      throw error;
    }
    
    return { success: true, data: (data || []) as Survey[] };
  } catch (err) {
    console.error('❌ Error completo:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error listando encuestas' };
  }
}
```

---

## ❌ Error: "No se envían correos"

### Síntomas
- La campaña se crea pero no se envían correos
- Error en el endpoint `/api/surveys/send`
- Logs muestran fallos en `sendCustomEmail`

### Diagnóstico
```typescript
// Verificar configuración de email
console.log('📧 Configuración email:', {
  GMAIL_USER: process.env.GMAIL_USER ? 'Configurado' : 'Faltante',
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? 'Configurado' : 'Faltante',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
});
```

### Soluciones

**Solución 1: Verificar Variables de Entorno**
```env
# .env.local
GMAIL_USER=reservas@termasllifen.cl
GMAIL_APP_PASSWORD=your_app_password_here
NEXT_PUBLIC_APP_URL=https://admintermas.vercel.app
```

**Solución 2: Verificar Configuración Gmail**
```typescript
// Probar configuración de email
import { testEmailConfiguration } from '@/lib/email-service';

const result = await testEmailConfiguration();
console.log('📧 Test email:', result);
```

**Solución 3: Debug sendSurveyInvitations**
```typescript
export async function sendSurveyInvitations(campaignId: number) {
  try {
    console.log('📧 Iniciando envío de invitaciones para campaña:', campaignId);
    
    // Verificar que la campaña existe
    const { data: campaign, error: e0 } = await supabase
      .from('survey_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
      
    if (e0 || !campaign) {
      throw new Error('Campaña no encontrada');
    }
    
    console.log('✅ Campaña encontrada:', campaign.name);
    
    // Verificar invitaciones pendientes
    const { data: invitations, error: e2 } = await supabase
      .from('survey_invitations')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('status', ['pending'])
      .limit(10); // Limitar para debug
      
    console.log('📊 Invitaciones pendientes:', invitations?.length || 0);
    
    if (!invitations || invitations.length === 0) {
      return { success: true, sent: 0, failed: 0 };
    }
    
    // Probar envío de una invitación
    const firstInvitation = invitations[0];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admintermas.vercel.app';
    const link = `${baseUrl}/surveys/${firstInvitation.token}`;
    
    console.log('🔗 Link generado:', link);
    
    const result = await sendCustomEmail(
      firstInvitation.email,
      `Encuesta: ${campaign.name}`,
      `<p>Prueba de envío. <a href="${link}">Responder encuesta</a></p>`,
      true
    );
    
    console.log('📧 Resultado envío:', result);
    
    return { success: true, sent: result.success ? 1 : 0, failed: result.success ? 0 : 1 };
    
  } catch (err) {
    console.error('❌ Error en sendSurveyInvitations:', err);
    return { success: false, sent: 0, failed: 0, error: err.message };
  }
}
```

---

## ❌ Error: "Token inválido en respuesta"

### Síntomas
- Cliente hace clic en enlace pero ve error 404
- Mensaje "Invitación no encontrada"
- Token no existe en la base de datos

### Diagnóstico
```sql
-- Verificar que el token existe
SELECT * FROM survey_invitations WHERE token = 'token-aqui';

-- Verificar estado de la invitación
SELECT 
  si.*,
  s.title as survey_title,
  c.nombrePrincipal as client_name
FROM survey_invitations si
JOIN surveys s ON si.survey_id = s.id
LEFT JOIN "Client" c ON si.client_id = c.id
WHERE si.token = 'token-aqui';
```

### Soluciones

**Solución 1: Verificar Token**
```typescript
// Debug getInvitationByToken
export async function getInvitationByToken(token: string) {
  try {
    console.log('🔍 Buscando invitación con token:', token);
    
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('survey_invitations')
      .select('*')
      .eq('token', token)
      .single();
      
    console.log('📊 Resultado búsqueda:', { data, error });
    
    if (error) {
      console.error('❌ Error buscando invitación:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Invitación no encontrada');
    }
    
    // Verificar si ya expiró
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error('Invitación expirada');
    }
    
    // Verificar si ya fue respondida
    if (data.status === 'responded') {
      throw new Error('Invitación ya fue respondida');
    }
    
    return { success: true, data: data as SurveyInvitation };
  } catch (err) {
    console.error('❌ Error en getInvitationByToken:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Invitación no encontrada' };
  }
}
```

**Solución 2: Regenerar Token**
```sql
-- Si el token se perdió, regenerar
UPDATE survey_invitations 
SET token = gen_random_uuid()
WHERE id = invitation_id;
```

---

## ❌ Error: "No se pueden agregar preguntas"

### Síntomas
- Se crea la encuesta pero no se pueden agregar preguntas
- Error al hacer clic en "Agregar" pregunta
- Preguntas no aparecen en la lista

### Diagnóstico
```sql
-- Verificar que la encuesta existe
SELECT * FROM surveys WHERE id = survey_id;

-- Verificar preguntas existentes
SELECT * FROM survey_questions WHERE survey_id = survey_id ORDER BY order_index;
```

### Soluciones

**Solución 1: Debug addQuestion**
```typescript
export async function addQuestion(input: AddQuestionInput) {
  try {
    console.log('🔍 Agregando pregunta:', input);
    
    const supabase = await getSupabaseServerClient();
    
    // Verificar que la encuesta existe
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, title')
      .eq('id', input.survey_id)
      .single();
      
    if (surveyError || !survey) {
      throw new Error('Encuesta no encontrada');
    }
    
    console.log('✅ Encuesta encontrada:', survey.title);
    
    // Insertar pregunta
    const { data: question, error } = await supabase
      .from('survey_questions')
      .insert({
        survey_id: input.survey_id,
        question_type: input.question_type,
        question_text: input.question_text,
        is_required: input.is_required ?? true,
        order_index: input.order_index ?? 0,
      })
      .select('*')
      .single();
      
    console.log('📊 Pregunta creada:', question);
    
    if (error) {
      console.error('❌ Error creando pregunta:', error);
      throw error;
    }
    
    // Agregar opciones si es necesario
    if (input.options && input.options.length > 0 && question?.id) {
      console.log('🔧 Agregando opciones:', input.options);
      
      const { error: optErr } = await supabase.from('survey_options').insert(
        input.options.map((o) => ({
          question_id: question.id,
          option_text: o.option_text,
          value: o.value ?? null,
          order_index: o.order_index ?? 0,
        }))
      );
      
      if (optErr) {
        console.error('❌ Error agregando opciones:', optErr);
        throw optErr;
      }
    }
    
    return { success: true, data: question as SurveyQuestion };
  } catch (err) {
    console.error('❌ Error en addQuestion:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error agregando pregunta' };
  }
}
```

---

## ❌ Error: "No se guardan las respuestas"

### Síntomas
- Cliente completa el formulario pero no se guardan las respuestas
- Error 500 en `/api/surveys/respond`
- Respuestas no aparecen en la base de datos

### Diagnóstico
```sql
-- Verificar respuestas existentes
SELECT 
  sr.*,
  si.email,
  s.title as survey_title
FROM survey_responses sr
JOIN survey_invitations si ON sr.invitation_id = si.id
JOIN surveys s ON sr.survey_id = s.id
ORDER BY sr.created_at DESC;
```

### Soluciones

**Solución 1: Debug submitSurveyAnswers**
```typescript
export async function submitSurveyAnswers(input: SubmitSurveyAnswersInput) {
  try {
    console.log('🔍 Enviando respuestas:', { token: input.token, answersCount: input.answers.length });
    
    const supabase = await getSupabaseServerClient();
    
    // Verificar invitación
    const { data: invitation, error: e1 } = await supabase
      .from('survey_invitations')
      .select('*')
      .eq('token', input.token)
      .single();
      
    console.log('📊 Invitación encontrada:', invitation);
    
    if (e1 || !invitation) {
      throw new Error('Invitación inválida');
    }
    
    // Verificar que no se haya respondido ya
    const { data: existingResponse, error: e1b } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('invitation_id', invitation.id)
      .single();
      
    if (existingResponse) {
      throw new Error('Esta encuesta ya fue respondida');
    }
    
    // Crear response
    const { data: response, error: e2 } = await supabase
      .from('survey_responses')
      .insert({
        invitation_id: invitation.id,
        survey_id: invitation.survey_id,
        client_id: invitation.client_id ?? null,
      })
      .select('*')
      .single();
      
    console.log('📊 Response creada:', response);
    
    if (e2) {
      console.error('❌ Error creando response:', e2);
      throw e2;
    }
    
    // Insertar answers
    if (input.answers && input.answers.length > 0) {
      console.log('🔧 Insertando answers:', input.answers);
      
      const payload = input.answers.map((a) => ({
        response_id: response.id,
        question_id: a.question_id,
        answer_text: a.answer_text ?? null,
        answer_value: a.answer_value ?? null,
      }));
      
      const { error: e3 } = await supabase.from('survey_answers').insert(payload);
      
      if (e3) {
        console.error('❌ Error insertando answers:', e3);
        throw e3;
      }
    }
    
    // Marcar invitación como respondida
    const { error: e4 } = await supabase
      .from('survey_invitations')
      .update({ status: 'responded', responded_at: new Date().toISOString() })
      .eq('id', invitation.id);
      
    if (e4) {
      console.error('❌ Error actualizando invitación:', e4);
      throw e4;
    }
    
    console.log('✅ Respuestas guardadas exitosamente');
    return { success: true, data: { response: response as SurveyResponse } };
    
  } catch (err) {
    console.error('❌ Error en submitSurveyAnswers:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Error enviando respuestas' };
  }
}
```

---

## 🔧 Comandos de Debug Útiles

### Verificar Estado del Sistema
```sql
-- Estado general de encuestas
SELECT 
  'Encuestas' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as activas
FROM surveys
UNION ALL
SELECT 
  'Preguntas' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN is_required THEN 1 END) as obligatorias
FROM survey_questions
UNION ALL
SELECT 
  'Campañas' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as enviadas
FROM survey_campaigns
UNION ALL
SELECT 
  'Invitaciones' as tabla,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'responded' THEN 1 END) as respondidas
FROM survey_invitations;
```

### Limpiar Datos de Prueba
```sql
-- CUIDADO: Esto borra todos los datos de encuestas
DELETE FROM survey_answers;
DELETE FROM survey_responses;
DELETE FROM survey_invitations;
DELETE FROM survey_campaigns;
DELETE FROM survey_questions;
DELETE FROM surveys;
```

### Verificar Configuración
```sql
-- Verificar extensiones
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Verificar triggers
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' AND trigger_name LIKE '%survey%';
```

---

## 📞 Contacto y Soporte

### Logs Importantes
- **Consola del navegador** (F12): Errores de frontend
- **Terminal del servidor**: Errores de server actions
- **Supabase Dashboard**: Logs de base de datos

### Información para Reportar Bugs
```typescript
// Template para reportar bugs
const bugReport = {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href,
  error: error.message,
  stack: error.stack,
  userRole: 'ADMINISTRADOR', // o el rol actual
  surveyId: surveyId, // si aplica
  campaignId: campaignId, // si aplica
  token: token // si aplica (sin exponer datos sensibles)
};
```

---

*Troubleshooting actualizado: Enero 2025*
