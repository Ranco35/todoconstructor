# 📊 Módulo de Encuestas - Documentación Completa

## 📋 Índice

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Guías de Uso](#guías-de-uso)
- [Documentación Técnica](#documentación-técnica)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## 🎯 Resumen Ejecutivo

El **Módulo de Encuestas** es un sistema completo para crear, gestionar y enviar encuestas a clientes con envío masivo de correos electrónicos. Permite recopilar feedback de clientes de manera profesional y organizada.

### ✅ Características Principales

- **Creación de Encuestas**: Múltiples tipos de preguntas (texto, selección única, múltiple, rating)
- **Campañas de Envío**: Segmentación de clientes y envío masivo por correo
- **Respuestas Públicas**: Formularios accesibles por token único
- **Gestión Administrativa**: Panel completo para administrar encuestas y ver respuestas
- **Integración Email**: Usa el servicio de correo existente del sistema
- **Seguridad**: Tokens únicos, RLS habilitado, autenticación requerida

### 🎯 Casos de Uso

- **Satisfacción del Cliente**: Evaluar experiencia en hotel/spa
- **Feedback de Servicios**: Opiniones sobre masajes, restaurante, habitaciones
- **Encuestas de Mercado**: Preferencias de clientes, nuevos servicios
- **Evaluación Post-Reserva**: Seguimiento después de la estadía

---

## 🏗️ Arquitectura del Sistema

```
📊 Módulo de Encuestas
├── 🗄️ Base de Datos (7 tablas)
│   ├── surveys (encuestas principales)
│   ├── survey_questions (preguntas)
│   ├── survey_options (opciones de selección)
│   ├── survey_campaigns (campañas de envío)
│   ├── survey_invitations (invitaciones por cliente)
│   ├── survey_responses (respuestas por invitación)
│   └── survey_answers (respuestas por pregunta)
├── ⚡ Server Actions (CRUD completo)
├── 🌐 API Routes (3 endpoints)
├── 🎨 UI Administrativa (2 páginas)
├── 📧 Integración Email (envío masivo)
└── 🔗 Páginas Públicas (respuesta por token)
```

### 🔄 Flujo de Trabajo

1. **Admin crea encuesta** → Define preguntas y opciones
2. **Admin crea campaña** → Selecciona clientes y configura envío
3. **Sistema envía correos** → Invitaciones con tokens únicos
4. **Clientes responden** → Formulario público accesible por token
5. **Admin ve respuestas** → Dashboard con estadísticas y datos

---

## 📖 Guías de Uso

### 🚀 Inicio Rápido

1. **Acceder al módulo**: Dashboard → Tarjeta "Encuestas" (solo administradores)
2. **Crear primera encuesta**: Título + descripción
3. **Agregar preguntas**: Texto, selección única/múltiple, rating
4. **Crear campaña**: Nombre + remitente + clientes
5. **Enviar invitaciones**: Correos masivos automáticos

### 📝 Crear una Encuesta

**Paso 1: Crear Encuesta Base**
- Ir a `/dashboard/marketing/surveys`
- Completar título (obligatorio) y descripción
- Hacer clic en "Crear"

**Paso 2: Agregar Preguntas**
- Hacer clic en "Configurar" en la encuesta creada
- Seleccionar tipo de pregunta:
  - **Texto**: Respuesta libre
  - **Selección única**: Una opción (radio buttons)
  - **Selección múltiple**: Varias opciones (checkboxes)
  - **Rating**: Escala 1-5 (número)
- Escribir la pregunta y hacer clic en "Agregar"

**Paso 3: Crear Campaña**
- En la misma página, completar:
  - Nombre de la campaña
  - Nombre del remitente
  - Email del remitente
- Hacer clic en "Crear campaña"

### 📧 Enviar Campaña

**Método 1: API Directa**
```bash
POST /api/surveys/send
{
  "campaignId": 123
}
```

**Método 2: Desde Código**
```typescript
import { sendSurveyInvitations } from '@/actions/surveys';

const result = await sendSurveyInvitations(campaignId);
console.log(`Enviados: ${result.sent}, Fallidos: ${result.failed}`);
```

### 👥 Responder Encuesta (Cliente)

1. **Cliente recibe correo** con enlace único
2. **Hace clic en enlace** → `/surveys/{token}`
3. **Completa formulario** con preguntas
4. **Envía respuestas** → Se guardan automáticamente
5. **Ve página de gracias** → Confirmación de envío

---

## 🔧 Documentación Técnica

### 🗄️ Esquema de Base de Datos

**Tabla: `surveys`**
```sql
- id (BIGSERIAL PRIMARY KEY)
- title (VARCHAR(200) NOT NULL)
- description (TEXT)
- status (VARCHAR(20) DEFAULT 'draft')
- created_by (UUID REFERENCES auth.users)
- created_at, updated_at (TIMESTAMP)
```

**Tabla: `survey_questions`**
```sql
- id (BIGSERIAL PRIMARY KEY)
- survey_id (BIGINT REFERENCES surveys)
- question_type (VARCHAR(30): 'text'|'single_choice'|'multiple_choice'|'rating')
- question_text (TEXT NOT NULL)
- is_required (BOOLEAN DEFAULT TRUE)
- order_index (INT DEFAULT 0)
- metadata (JSONB)
```

**Tabla: `survey_campaigns`**
```sql
- id (BIGSERIAL PRIMARY KEY)
- survey_id (BIGINT REFERENCES surveys)
- name (VARCHAR(200) NOT NULL)
- status (VARCHAR(20): 'draft'|'scheduled'|'sending'|'sent'|'cancelled')
- scheduled_at, sent_at (TIMESTAMP)
- segment (JSONB) -- criterios de segmentación
- total_recipients (INT DEFAULT 0)
- sender_name, sender_email (VARCHAR)
```

**Tabla: `survey_invitations`**
```sql
- id (BIGSERIAL PRIMARY KEY)
- campaign_id (BIGINT REFERENCES survey_campaigns)
- survey_id (BIGINT REFERENCES surveys)
- client_id (BIGINT REFERENCES "Client")
- email (VARCHAR(255) NOT NULL)
- token (UUID UNIQUE DEFAULT gen_random_uuid())
- status (VARCHAR(20): 'pending'|'opened'|'responded'|'bounced'|'unsubscribed')
- sent_at, opened_at, responded_at (TIMESTAMP)
```

### ⚡ Server Actions

**Archivo**: `src/actions/surveys/index.ts`

```typescript
// Crear encuesta
createSurvey(input: CreateSurveyInput): Promise<{success: boolean; data?: Survey; error?: string}>

// Listar encuestas
listSurveys(): Promise<{success: boolean; data?: Survey[]; error?: string}>

// Agregar pregunta
addQuestion(input: AddQuestionInput): Promise<{success: boolean; data?: SurveyQuestion; error?: string}>

// Obtener encuesta con preguntas
getSurveyWithQuestions(surveyId: number): Promise<{success: boolean; data?: SurveyWithQuestions; error?: string}>

// Crear campaña
createCampaign(input: CreateCampaignInput): Promise<{success: boolean; data?: SurveyCampaign; error?: string}>

// Enviar invitaciones masivas
sendSurveyInvitations(campaignId: number): Promise<{success: boolean; sent: number; failed: number; error?: string}>

// Obtener invitación por token
getInvitationByToken(token: string): Promise<{success: boolean; data?: SurveyInvitation; error?: string}>

// Enviar respuestas
submitSurveyAnswers(input: SubmitSurveyAnswersInput): Promise<{success: boolean; data?: {response: SurveyResponse}; error?: string}>
```

### 🌐 API Routes

**POST `/api/surveys/invite`** - Crear campaña
```json
{
  "survey_id": 123,
  "name": "Campaña Q1 2025",
  "scheduled_at": "2025-01-15T10:00:00Z",
  "sender_name": "Termas Llifén",
  "sender_email": "marketing@termasllifen.cl",
  "clientIds": [1, 2, 3]
}
```

**POST `/api/surveys/send`** - Enviar invitaciones
```json
{
  "campaignId": 123
}
```

**POST `/api/surveys/respond`** - Enviar respuestas
```json
{
  "token": "uuid-token",
  "answers": [
    {
      "question_id": 1,
      "answer_text": "Muy satisfecho",
      "answer_value": "5"
    }
  ]
}
```

### 🎨 Componentes UI

**Páginas Administrativas:**
- `/dashboard/marketing/surveys` - Lista y creación de encuestas
- `/dashboard/marketing/surveys/[id]` - Configuración de encuesta específica

**Páginas Públicas:**
- `/surveys/[token]` - Formulario de respuesta por token
- `/surveys/thanks` - Página de agradecimiento

### 📧 Integración Email

**Servicio**: Usa `sendCustomEmail()` existente
**Plantilla**: HTML con enlace único por token
**Configuración**: Requiere `NEXT_PUBLIC_APP_URL` para construir enlaces

```typescript
const link = `${baseUrl}/surveys/${token}`;
const subject = `Encuesta: ${survey.title}`;
const html = `
  <h2>Hola, queremos conocer tu opinión</h2>
  <p>${survey.description}</p>
  <a href="${link}">Responder encuesta</a>
`;
```

---

## 🚨 Troubleshooting

### ❌ Problemas Comunes

**1. "No se puede crear encuesta"**
- ✅ Verificar que las tablas existen en Supabase
- ✅ Verificar autenticación del usuario
- ✅ Revisar logs en consola del navegador y terminal

**2. "No aparecen encuestas en la lista"**
- ✅ Verificar políticas RLS
- ✅ Verificar que el usuario está autenticado
- ✅ Revisar logs de `listSurveys()`

**3. "No se envían correos"**
- ✅ Verificar configuración de Gmail en `.env.local`
- ✅ Verificar `NEXT_PUBLIC_APP_URL`
- ✅ Revisar logs de `sendSurveyInvitations()`

**4. "Token inválido en respuesta"**
- ✅ Verificar que el token existe en `survey_invitations`
- ✅ Verificar que no ha expirado
- ✅ Verificar que no se ha respondido ya

**5. "Error enviando respuestas" ✅ RESUELTO**
- ✅ **SOLUCIÓN APLICADA**: Políticas RLS corregidas
- ✅ **Estado**: Sistema 100% funcional
- ✅ **Documentación**: Ver `solucion-completa-error-envio-respuestas.md`

### 🔍 Comandos de Debug

**Verificar tablas:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'survey%';
```

**Verificar políticas RLS:**
```sql
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'surveys';
```

**Verificar encuestas:**
```sql
SELECT * FROM surveys ORDER BY created_at DESC;
```

**Verificar invitaciones:**
```sql
SELECT * FROM survey_invitations WHERE status = 'pending';
```

### 🛠️ Soluciones

**Deshabilitar RLS temporalmente (solo debug):**
```sql
ALTER TABLE surveys DISABLE ROW LEVEL SECURITY;
-- ... hacer pruebas ...
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
```

**Limpiar datos de prueba:**
```sql
DELETE FROM survey_answers;
DELETE FROM survey_responses;
DELETE FROM survey_invitations;
DELETE FROM survey_campaigns;
DELETE FROM survey_questions;
DELETE FROM surveys;
```

---

## 📚 API Reference

### Tipos TypeScript

```typescript
interface Survey {
  id: number;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'closed';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface SurveyQuestion {
  id: number;
  survey_id: number;
  question_type: 'single_choice' | 'multiple_choice' | 'rating' | 'text';
  question_text: string;
  is_required: boolean;
  order_index: number;
  metadata?: Record<string, unknown>;
}

interface SurveyCampaign {
  id: number;
  survey_id: number;
  name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  scheduled_at?: string;
  sent_at?: string;
  segment?: Record<string, unknown>;
  total_recipients?: number;
  sender_name?: string;
  sender_email?: string;
}

interface SurveyInvitation {
  id: number;
  campaign_id?: number;
  survey_id: number;
  client_id?: number;
  email: string;
  token: string;
  expires_at?: string;
  status: 'pending' | 'opened' | 'responded' | 'bounced' | 'unsubscribed';
  sent_at?: string;
  opened_at?: string;
  responded_at?: string;
}
```

### Configuración Requerida

**Variables de Entorno:**
```env
# Email (ya configurado)
GMAIL_USER=reservas@termasllifen.cl
GMAIL_APP_PASSWORD=your_app_password

# URL de la aplicación (para enlaces en correos)
NEXT_PUBLIC_APP_URL=https://admintermas.vercel.app
```

**Permisos de Usuario:**
- Solo usuarios con rol `ADMINISTRADOR` pueden acceder al módulo
- Todas las operaciones requieren autenticación (`auth.role() = 'authenticated'`)

---

## 📈 Métricas y Estadísticas

### KPIs Disponibles

- **Encuestas Creadas**: Total de encuestas en el sistema
- **Campañas Enviadas**: Número de campañas ejecutadas
- **Tasa de Respuesta**: Porcentaje de invitaciones respondidas
- **Emails Enviados**: Total de correos enviados
- **Emails Fallidos**: Correos que no se pudieron entregar

### Consultas Útiles

**Estadísticas por encuesta:**
```sql
SELECT 
  s.title,
  COUNT(DISTINCT si.id) as total_invitations,
  COUNT(DISTINCT sr.id) as total_responses,
  ROUND(COUNT(DISTINCT sr.id) * 100.0 / COUNT(DISTINCT si.id), 2) as response_rate
FROM surveys s
LEFT JOIN survey_invitations si ON s.id = si.survey_id
LEFT JOIN survey_responses sr ON si.id = sr.invitation_id
GROUP BY s.id, s.title;
```

**Estado de campañas:**
```sql
SELECT 
  sc.name,
  sc.status,
  sc.total_recipients,
  COUNT(si.id) as invitations_sent,
  COUNT(CASE WHEN si.status = 'responded' THEN 1 END) as responses
FROM survey_campaigns sc
LEFT JOIN survey_invitations si ON sc.id = si.campaign_id
GROUP BY sc.id, sc.name, sc.status, sc.total_recipients;
```

---

## 🚀 Roadmap Futuro

### Mejoras Planificadas

- **Segmentación Avanzada**: Filtros por etiquetas de clientes, fecha de última compra
- **Plantillas de Email**: Múltiples diseños de correo personalizables
- **Analytics Avanzados**: Gráficos, exportación de datos, reportes
- **Programación**: Envío automático en fechas específicas
- **Integración WhatsApp**: Envío de encuestas por WhatsApp
- **Respuestas Anónimas**: Opción para encuestas sin identificación de cliente

### Integraciones Posibles

- **CRM**: Sincronización con sistema de clientes
- **Marketing**: Integración con herramientas de email marketing
- **Analytics**: Exportación a Google Analytics o similar
- **Notificaciones**: Alertas por Slack/Teams cuando se reciben respuestas

---

*Documentación actualizada: Enero 2025*
*Versión del módulo: 1.0.0*
