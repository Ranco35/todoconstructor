# 📧 Módulo de Emails - Hotel Termas Llifén

## 🚀 Inicio Rápido

Este módulo proporciona un sistema inteligente de gestión de correos electrónicos con análisis automático mediante IA, identificación de clientes y tracking completo de comunicaciones.

### ✨ Características Principales

- 🤖 **Análisis automático con ChatGPT** - Procesa correos 4 veces al día
- 👤 **Identificación de clientes** - Busca automáticamente en la BD
- 💰 **Detección de pagos** - Reconoce confirmaciones de transferencias
- 📊 **Dashboard en tiempo real** - Métricas y estadísticas visuales
- 📤 **Tracking de enviados** - Seguimiento completo de correos salientes
- 🔔 **Modal de bienvenida** - Resumen diario de actividad

---

## 📁 Estructura del Proyecto

```
src/
├── actions/emails/
│   ├── analysis-actions.ts          # Análisis con ChatGPT
│   ├── client-analysis-actions.ts   # Identificación de clientes
│   └── sent-email-actions.ts        # Tracking de enviados
├── components/emails/
│   ├── EmailDashboard.tsx           # Dashboard principal
│   ├── EmailAnalysisPopup.tsx       # Modal de bienvenida
│   ├── ClientEmailAssociations.tsx  # Asociaciones cliente-email
│   ├── SentEmailsSummary.tsx        # Resumen de enviados
│   └── SendEmailForm.tsx            # Formulario de registro
├── app/
│   ├── dashboard/emails/page.tsx    # Página principal
│   └── api/emails/                  # APIs REST
└── utils/
    └── email-client-utils.ts        # Utilidades generales

supabase/migrations/
├── 20250118000000_create_email_analysis_table.sql
├── 20250118000001_create_email_client_association.sql
└── 20250118000002_create_sent_emails_tracking.sql
```

---

## ⚡ Instalación y Configuración

### 1. Variables de Entorno

```bash
# .env.local
OPENAI_API_KEY=sk-...
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
```

### 2. Migraciones de Base de Datos

```bash
# Aplicar migraciones
supabase db push

# Verificar funciones SQL
supabase db functions deploy
```

### 3. Verificar Instalación

```typescript
// Ir a /dashboard/emails y verificar que aparezcan:
// ✅ Dashboard principal carga correctamente
// ✅ Botón "Analizar Ahora" funciona
// ✅ Estadísticas se muestran
// ✅ Modal de bienvenida aparece al entrar al dashboard
```

---

## 🔧 Uso Básico

### Análisis Manual de Correos

```typescript
import { analyzeEmailsWithAI } from '@/actions/emails/analysis-actions'

// Analizar correos manualmente
const result = await analyzeEmailsWithAI()
if (result.success) {
  console.log(`${result.data.processedEmails} correos procesados`)
}
```

### Identificar Cliente por Email

```typescript
import { findClientByEmail } from '@/actions/emails/client-analysis-actions'

// Buscar cliente en la BD
const client = await findClientByEmail('cliente@example.com')
if (client.success && client.data) {
  console.log('Cliente encontrado:', client.data.client.nombrePrincipal)
}
```

### Registrar Email Enviado

```typescript
import { trackSentEmail } from '@/actions/emails/sent-email-actions'

// Registrar email enviado
await trackSentEmail({
  recipientEmail: 'cliente@example.com',
  subject: 'Confirmación de Reserva',
  bodyContent: 'Su reserva ha sido confirmada...',
  emailType: 'confirmation',
  clientId: 123,
  reservationId: 456
})
```

---

## 📊 API Reference

### Server Actions

| Función | Descripción | Retorno |
|---------|-------------|---------|
| `analyzeEmailsWithAI()` | Analiza correos con ChatGPT | `{success, data, error}` |
| `findClientByEmail(email)` | Busca cliente por email | `{success, data, error}` |
| `trackSentEmail(data)` | Registra email enviado | `{success, data, error}` |
| `getEmailAnalysisReports()` | Obtiene reportes de análisis | `{success, data, error}` |
| `getTodayEmailAnalysis()` | Obtiene análisis del día | `{success, data, error}` |

### REST APIs

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/emails/analysis-scheduler` | POST | Scheduler automático |
| `/api/emails/client-associations` | GET | Asociaciones cliente-email |
| `/api/emails/sent-emails` | GET | Lista de correos enviados |
| `/api/emails/sent-emails-stats` | GET | Estadísticas de correos |

---

## 🎨 Componentes Principales

### EmailDashboard

```typescript
import EmailDashboard from '@/app/dashboard/emails/page'

// Dashboard principal con estadísticas y reportes
<EmailDashboard />
```

### EmailAnalysisPopup

```typescript
import { EmailAnalysisPopup } from '@/components/emails/EmailAnalysisPopup'

// Modal que se muestra automáticamente con el resumen del día
<EmailAnalysisPopup />
```

### ClientEmailAssociations

```typescript
import { ClientEmailAssociations } from '@/components/emails/ClientEmailAssociations'

// Muestra asociaciones entre emails y clientes
<ClientEmailAssociations limit={10} />
```

---

## 🤖 Integración con ChatGPT

### Prompts Optimizados

El sistema usa prompts específicamente diseñados para el contexto hotelero:

```typescript
// Prompt principal para análisis
const HOTEL_ANALYSIS_PROMPT = `
Como experto en atención al cliente de Hotel Termas Llifén, analiza los correos.

CONTEXTO DEL HOTEL:
- Hotel & Spa de lujo en Chile
- Servicios: alojamiento, spa, termas, gastronomía

INSTRUCCIONES:
1. Identifica correos importantes (pagos, quejas, urgencias)
2. Detecta confirmaciones de transferencias
3. Clasifica por urgencia (Alta/Media/Baja)
4. Sugiere acciones específicas
`
```

### Configuración de Modelos

```typescript
// Configuración recomendada
const completion = await openai.chat.completions.create({
  model: "gpt-4",           // Mejor calidad de análisis
  max_tokens: 1000,         // Respuestas completas
  temperature: 0.3,         // Respuestas consistentes
  presence_penalty: 0,      // Sin penalización
  frequency_penalty: 0      // Sin penalización
})
```

---

## 📈 Monitoreo y Métricas

### Dashboard Principal

El dashboard muestra métricas en tiempo real:

- **Correos analizados hoy** - Total procesados
- **Clientes identificados** - Reconocidos automáticamente  
- **Correos urgentes** - Requieren atención inmediata
- **Confirmaciones de pago** - Detectadas automáticamente

### Logging y Debugging

```typescript
// Logs estructurados para seguimiento
console.log('📧 [EMAIL-ANALYSIS] Iniciando análisis...')
console.log('👤 [CLIENT-ID] Cliente encontrado:', clientData)
console.log('📤 [EMAIL-TRACKING] Email registrado:', emailId)
console.error('❌ [EMAIL-ERROR] Error en análisis:', error)
```

---

## 🔄 Scheduler Automático

### Configuración

El sistema ejecuta análisis automático 4 veces al día:

- **06:00** - Análisis matutino
- **12:00** - Análisis mediodía  
- **18:00** - Análisis tarde
- **00:00** - Análisis nocturno

### Webhook Manual

```bash
# Trigger manual del scheduler
curl -X POST https://your-domain.com/api/emails/analysis-scheduler
```

---

## 🐛 Problemas Comunes

### 1. "No hay correos para analizar"
```typescript
// Verificar configuración Gmail API
// Comprobar tokens de acceso
// Revisar permisos de la aplicación
```

### 2. "Error de conexión OpenAI"
```typescript
// Verificar OPENAI_API_KEY en .env.local
// Comprobar límites de rate limiting
// Revisar créditos disponibles
```

### 3. "Cliente no encontrado"
```typescript
// Verificar que el email existe en la tabla Client
// Comprobar formato del email (minúsculas)
// Revisar políticas RLS de Supabase
```

### 4. "Modal no aparece"
```typescript
// Verificar que hay análisis del día actual
// Comprobar estado del componente EmailAnalysisPopup
// Revisar configuración de Dialog
```

---

## 📚 Documentación Completa

- 📖 **[Resumen Ejecutivo](./resumen-ejecutivo-modulo-emails.md)** - Visión general del proyecto
- 🛠️ **[Guía Técnica](./guia-tecnica-implementacion-emails.md)** - Implementación detallada
- 🔧 **[Troubleshooting](./troubleshooting-modulo-emails.md)** - Solución de problemas
- 📊 **[Sistema de Identificación](./sistema-identificacion-clientes-completo.md)** - Análisis de clientes
- 📤 **[Sistema de Tracking](./sistema-correos-enviados-completo.md)** - Correos enviados

---

## 🤝 Contribución

### Reportar Problemas

1. Crear issue en el repositorio
2. Incluir logs de consola
3. Describir pasos para reproducir
4. Agregar screenshots si aplica

### Desarrollo

```bash
# Setup entorno de desarrollo
git clone [repository]
cd admintermas
npm install
cp .env.example .env.local
# Configurar variables de entorno
npm run dev
```

### Testing

```bash
# Tests unitarios
npm run test

# Tests de integración  
npm run test:integration

# Tests de componentes
npm run test:components
```

---

## 📞 Soporte

**Desarrollado por:** IA Assistant (Claude)  
**Cliente:** Hotel Termas Llifén  
**Contacto:** Eduardo Probost  
**Email:** eduardo@termasllifen.cl  

### Estado del Sistema: ✅ **100% OPERATIVO**

---

## ⏰ **NUEVO: Sistema de Timer Modal de Bienvenida**

**Implementado**: 18 de Enero 2025 🎉  
**Estado**: ✅ **100% Funcional**

### **🎯 Documentación Completa Disponible**

- 📊 **[Resumen Ejecutivo](./RESUMEN-EJECUTIVO-MODAL-TIMER.md)** - Para management y stakeholders
- 👤 **[Guía de Usuario](./GUIA-USUARIO-MODAL-BIENVENIDA.md)** - Para usuarios finales del sistema
- 🔧 **[Documentación Técnica](./DOCUMENTACION-TECNICA-MODAL-TIMER.md)** - Para desarrolladores
- 📚 **[Índice Completo](./README-MODAL-TIMER-COMPLETO.md)** - Navegación de toda la documentación

### **✨ Características Principales**
- ⏰ **Timer configurable** (6 horas por defecto)
- 🔍 **Detección inteligente** de nueva información
- ⚙️ **Configuración visual** desde el modal
- 🚫 **Control de aparición** sin repeticiones innecesarias
- 🐛 **Sistema de debug** completo para IT

### **🚀 Inicio Rápido**
1. **Usuario final**: Ver [Guía de Usuario](./GUIA-USUARIO-MODAL-BIENVENIDA.md)
2. **Management**: Ver [Resumen Ejecutivo](./RESUMEN-EJECUTIVO-MODAL-TIMER.md)
3. **Desarrollador**: Ver [Documentación Técnica](./DOCUMENTACION-TECNICA-MODAL-TIMER.md)

---

## 🏷️ Changelog

### v1.1.0 (18/01/2025) - **NUEVA FUNCIONALIDAD** 🎉
- 🆕 **Sistema de Timer Modal de Bienvenida**
  - ⏰ Timer configurable para controlar apariciones
  - 🔍 Verificación inteligente de nueva información
  - ⚙️ Interface de configuración visual
  - 📚 Documentación completa para todos los roles
  - 🐛 Sistema de debug integrado

### v1.0.0 (18/01/2025)
- ✅ Sistema de análisis automático con ChatGPT
- ✅ Identificación de clientes por email
- ✅ Tracking completo de correos enviados
- ✅ Dashboard visual con métricas en tiempo real
- ✅ Modal de bienvenida con resumen diario
- ✅ APIs REST para integración externa
- ✅ Documentación técnica completa

---

*Este módulo representa un avance significativo en la automatización y gestión inteligente de comunicaciones para Hotel Termas Llifén, proporcionando herramientas avanzadas de análisis, seguimiento y optimización de la experiencia del huésped.* 