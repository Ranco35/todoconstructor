# Sistema de Tracking de Correos Enviados - Documentación Técnica Completa

## Resumen Ejecutivo

Se implementó un sistema completo de **tracking de correos enviados** que se asocia automáticamente con clientes, reservas y presupuestos, proporcionando un historial completo de comunicaciones para mejorar el servicio al cliente.

## 🎯 Objetivos Principales

1. **Historial Completo**: Registrar todos los correos enviados a clientes
2. **Asociación Automática**: Vincular correos con clientes, reservas y presupuestos
3. **Estadísticas de Comunicación**: Métricas de envío, entrega y apertura
4. **Resumen por Cliente**: Historial unificado de comunicaciones
5. **Análisis de Engagement**: Tasas de respuesta y tiempo de respuesta

## 🗂️ Arquitectura de Base de Datos

### Tabla Principal: `SentEmailTracking`

```sql
CREATE TABLE "SentEmailTracking" (
    "id" BIGSERIAL PRIMARY KEY,
    "clientId" BIGINT REFERENCES "Client"("id") ON DELETE CASCADE,
    "reservationId" BIGINT REFERENCES "reservations"("id") ON DELETE SET NULL,
    "budgetId" BIGINT REFERENCES "sales_quote"("id") ON DELETE SET NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "senderEmail" TEXT NOT NULL,
    "senderName" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "emailType" TEXT NOT NULL, -- 'confirmation', 'reminder', 'payment_request', 'follow_up', 'marketing', 'custom'
    "status" TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
    "isAutomated" BOOLEAN DEFAULT false,
    "templateUsed" TEXT,
    "attachments" JSONB,
    "metadata" JSONB,
    "sentAt" TIMESTAMPTZ DEFAULT NOW(),
    "deliveredAt" TIMESTAMPTZ,
    "openedAt" TIMESTAMPTZ,
    "clickedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla de Resumen: `ClientCommunicationSummary`

```sql
CREATE TABLE "ClientCommunicationSummary" (
    "id" BIGSERIAL PRIMARY KEY,
    "clientId" BIGINT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
    "totalEmailsSent" INTEGER DEFAULT 0,
    "totalEmailsReceived" INTEGER DEFAULT 0,
    "lastEmailSent" TIMESTAMPTZ,
    "lastEmailReceived" TIMESTAMPTZ,
    "totalReservationEmails" INTEGER DEFAULT 0,
    "totalBudgetEmails" INTEGER DEFAULT 0,
    "totalPaymentEmails" INTEGER DEFAULT 0,
    "communicationScore" INTEGER DEFAULT 0, -- 1-10 basado en frecuencia y respuesta
    "preferredContactMethod" TEXT, -- 'email', 'phone', 'whatsapp'
    "responseRate" DECIMAL(5,2) DEFAULT 0, -- Porcentaje de emails que reciben respuesta
    "avgResponseTime" INTERVAL, -- Tiempo promedio de respuesta
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("clientId")
);
```

## 🔧 Funciones SQL Principales

### 1. Registrar Correo Enviado

```sql
CREATE OR REPLACE FUNCTION track_sent_email(
    p_client_id BIGINT,
    p_recipient_email TEXT,
    p_recipient_name TEXT DEFAULT NULL,
    p_sender_email TEXT DEFAULT 'info@admintermas.com',
    p_sender_name TEXT DEFAULT 'Hotel Termas Llifén',
    p_subject TEXT DEFAULT '',
    p_body TEXT DEFAULT '',
    p_email_type TEXT DEFAULT 'custom',
    p_reservation_id BIGINT DEFAULT NULL,
    p_budget_id BIGINT DEFAULT NULL,
    p_template_used TEXT DEFAULT NULL,
    p_is_automated BOOLEAN DEFAULT false,
    p_attachments JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS JSON;
```

### 2. Obtener Resumen de Comunicaciones

```sql
CREATE OR REPLACE FUNCTION get_client_communication_summary(p_client_id BIGINT)
RETURNS JSON;
```

### 3. Estadísticas Globales

```sql
CREATE OR REPLACE FUNCTION get_sent_emails_stats(p_days INTEGER DEFAULT 30)
RETURNS JSON;
```

## 📧 Tipos de Correos Soportados

| Tipo | Descripción | Icono | Uso |
|------|-------------|-------|-----|
| `confirmation` | Confirmación de reserva | ✅ | Reservas confirmadas |
| `reminder` | Recordatorio | ⏰ | Recordatorios de check-in/pago |
| `payment_request` | Solicitud de pago | 💰 | Solicitudes de pago pendiente |
| `follow_up` | Seguimiento | 📞 | Seguimiento post-estadía |
| `marketing` | Marketing | 📢 | Promociones y ofertas |
| `custom` | Personalizado | 📧 | Correos personalizados |

## 🚀 Server Actions

### Archivo: `src/actions/emails/sent-email-actions.ts`

#### Principales Funciones:

1. **`trackSentEmail(emailData: SentEmailData)`**
   - Registra un correo enviado
   - Actualiza automáticamente el resumen del cliente
   - Retorna confirmación de éxito

2. **`getClientCommunicationSummary(clientId: number)`**
   - Obtiene resumen completo de comunicaciones
   - Incluye correos enviados y recibidos
   - Calcula métricas de engagement

3. **`getSentEmailsStats(days: number)`**
   - Estadísticas globales de correos enviados
   - Breakdown por tipo y estado
   - Actividad reciente

4. **`getRecentSentEmails(limit: number)`**
   - Lista de correos enviados recientes
   - Incluye información del cliente
   - Ordenados por fecha

5. **`updateSentEmailStatus(emailId: number, status: string)`**
   - Actualiza estado del correo
   - Marcas de tiempo automáticas
   - Estados: delivered, opened, clicked, bounced, failed

## 🎨 Componentes Frontend

### 1. SentEmailsSummary.tsx

**Características:**
- Estadísticas visuales de correos enviados
- Lista de correos recientes con estado
- Breakdown por tipo de correo
- Métricas de entrega y apertura

**Props:**
```typescript
interface SentEmailsSummaryProps {
  showRecent?: boolean;
  maxResults?: number;
}
```

### 2. SendEmailForm.tsx

**Características:**
- Formulario para registrar correos enviados manualmente
- Selección de tipo de correo
- Asociación automática con cliente/reserva/presupuesto
- Validaciones y feedback

**Props:**
```typescript
interface SendEmailFormProps {
  clientId?: number;
  clientEmail?: string;
  clientName?: string;
  reservationId?: number;
  budgetId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

## 🔌 APIs REST

### 1. GET `/api/emails/sent-emails`

**Parámetros:**
- `limit` (opcional): Número máximo de emails a retornar

**Respuesta:**
```json
{
  "success": true,
  "emails": [...],
  "total": 25
}
```

### 2. GET `/api/emails/sent-emails-stats`

**Parámetros:**
- `days` (opcional): Número de días para estadísticas (default: 30)

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "totalSent": 150,
    "byType": {
      "confirmation": 45,
      "payment_request": 30,
      "follow_up": 25
    },
    "byStatus": {
      "sent": 120,
      "delivered": 100,
      "opened": 75
    }
  }
}
```

## 🔄 Estados de Correos

| Estado | Descripción | Badge Color |
|--------|-------------|-------------|
| `sent` | Enviado | Azul |
| `delivered` | Entregado | Verde |
| `opened` | Abierto/Leído | Púrpura |
| `clicked` | Click en enlace | Naranja |
| `bounced` | Rebotado | Rojo |
| `failed` | Fallido | Rojo |

## 📊 Métricas y Análisis

### Métricas por Cliente:
- **Total de correos enviados/recibidos**
- **Fecha del último correo enviado/recibido**
- **Correos por categoría** (reservas, presupuestos, pagos)
- **Tasa de respuesta** (% de emails que reciben respuesta)
- **Tiempo promedio de respuesta**
- **Puntuación de comunicación** (1-10)

### Métricas Globales:
- **Correos enviados por período**
- **Breakdown por tipo de correo**
- **Tasas de entrega y apertura**
- **Actividad reciente**

## 🔗 Integración con Sistema Existente

### Con Módulo de Correos Recibidos:
- **Trigger automático**: Actualiza resumen cuando llegan correos
- **Historial unificado**: Combina enviados + recibidos
- **Identificación de clientes**: Asocia automáticamente

### Con Módulo de Reservas:
- **Registro automático**: Al enviar confirmaciones
- **Asociación directa**: `reservationId` en el correo
- **Seguimiento completo**: Todo el flujo de comunicación

### Con Módulo de Presupuestos:
- **Tracking de cotizaciones**: Envío de presupuestos
- **Seguimiento de ventas**: Correos de seguimiento
- **Asociación directa**: `budgetId` en el correo

## 📱 Interfaz de Usuario

### Dashboard Principal:
1. **Estadísticas rápidas**:
   - Total enviados últimos 30 días
   - Correos entregados/abiertos
   - Confirmaciones enviadas

2. **Lista de correos recientes**:
   - Información del cliente
   - Tipo de correo con icono
   - Estado con badge colorido
   - Fecha y hora de envío

3. **Breakdown por tipo**:
   - Gráfico visual de tipos
   - Contadores por categoría

### Formulario de Registro:
1. **Información del destinatario**:
   - Email del cliente (requerido)
   - Nombre del cliente

2. **Detalles del correo**:
   - Tipo de correo (selector)
   - Asunto (requerido)
   - Contenido (opcional)
   - Template utilizado

3. **Asociaciones automáticas**:
   - Cliente ID
   - Reserva ID (si aplica)
   - Presupuesto ID (si aplica)

## 🎛️ Configuración y Personalización

### Variables de Entorno:
```env
# Default para correos enviados
DEFAULT_SENDER_EMAIL=info@admintermas.com
DEFAULT_SENDER_NAME=Hotel Termas Llifén
```

### Configuración de Templates:
```typescript
const emailTypes = [
  { value: 'confirmation', label: 'Confirmación de Reserva', icon: '✅' },
  { value: 'reminder', label: 'Recordatorio', icon: '⏰' },
  { value: 'payment_request', label: 'Solicitud de Pago', icon: '💰' },
  { value: 'follow_up', label: 'Seguimiento', icon: '📞' },
  { value: 'marketing', label: 'Marketing', icon: '📢' },
  { value: 'custom', label: 'Personalizado', icon: '📧' }
];
```

## 🔐 Seguridad y Permisos

### Políticas RLS:
- **Tabla SentEmailTracking**: Acceso completo para authenticated
- **Tabla ClientCommunicationSummary**: Acceso completo para authenticated
- **Service Role**: Permisos completos para funciones automatizadas

### Validaciones:
- **Cliente requerido**: No se puede registrar correo sin cliente
- **Email válido**: Validación de formato de email
- **Asunto requerido**: Obligatorio para tracking

## 📈 Beneficios del Sistema

### Para el Negocio:
1. **Historial completo**: Nunca perder track de comunicaciones
2. **Mejor servicio**: Conocer todo el historial al atender clientes
3. **Métricas de comunicación**: Analizar efectividad de correos
4. **Seguimiento de ventas**: Track completo del proceso de venta

### Para el Personal:
1. **Contexto completo**: Ver todas las comunicaciones previas
2. **Seguimiento automático**: No olvidar seguimientos importantes
3. **Métricas personales**: Ver efectividad de comunicaciones
4. **Automatización**: Registros automáticos cuando sea posible

### Para los Clientes:
1. **Comunicación coherente**: Evitar repetir información
2. **Respuestas rápidas**: Personal informado del historial
3. **Seguimiento proactivo**: Recordatorios y seguimientos oportunos

## 🚀 Implementación y Testing

### Migración SQL:
```bash
# Aplicar migración
supabase migration up 20250118000002_create_sent_emails_tracking
```

### Testing Manual:
1. **Registrar correo enviado**:
   ```typescript
   await trackSentEmail({
     clientId: 1,
     recipientEmail: 'cliente@email.com',
     subject: 'Confirmación de Reserva',
     emailType: 'confirmation'
   });
   ```

2. **Verificar resumen**:
   ```typescript
   const summary = await getClientCommunicationSummary(1);
   console.log(summary.summary.totalEmailsSent); // Debe incrementar
   ```

3. **Comprobar estadísticas**:
   ```typescript
   const stats = await getSentEmailsStats(30);
   console.log(stats.totalSent); // Debe incluir nuevo correo
   ```

## 📝 Casos de Uso Reales

### 1. Confirmación de Reserva:
```typescript
// Al confirmar una reserva
await trackSentEmail({
  clientId: reserva.clientId,
  reservationId: reserva.id,
  recipientEmail: cliente.email,
  subject: `Confirmación de Reserva #${reserva.id}`,
  emailType: 'confirmation',
  templateUsed: 'reservation_confirmation',
  isAutomated: true
});
```

### 2. Seguimiento de Presupuesto:
```typescript
// Al enviar presupuesto
await trackSentEmail({
  clientId: presupuesto.clientId,
  budgetId: presupuesto.id,
  recipientEmail: cliente.email,
  subject: `Presupuesto #${presupuesto.number}`,
  emailType: 'custom',
  body: 'Presupuesto detallado adjunto'
});
```

### 3. Recordatorio de Pago:
```typescript
// Recordatorio automático
await trackSentEmail({
  clientId: cliente.id,
  reservationId: reserva.id,
  recipientEmail: cliente.email,
  subject: 'Recordatorio de Pago - Reserva Pendiente',
  emailType: 'payment_request',
  isAutomated: true
});
```

## 🔮 Roadmap Futuro

### Fase 1 (Actual):
- ✅ Tracking básico de correos enviados
- ✅ Asociación con clientes/reservas/presupuestos
- ✅ Estadísticas básicas
- ✅ Interfaz de usuario

### Fase 2 (Próximo):
- 📧 Integración con servicios de email (SendGrid, Mailgun)
- 📊 Webhooks para tracking automático de estados
- 🤖 Templates de correo automáticos
- 📈 Analytics avanzados

### Fase 3 (Futuro):
- 🎯 Segmentación de clientes por comunicación
- 🔄 Campaigns de email marketing
- 📱 Notificaciones push
- 🤖 IA para optimización de subject lines

## 📞 Soporte y Mantenimiento

### Logs y Debugging:
- Todos los server actions incluyen logging detallado
- Console.log para debugging en desarrollo
- Error handling robusto con mensajes descriptivos

### Monitoreo:
- Verificar crecimiento de tabla `SentEmailTracking`
- Monitorear performance de consultas
- Revisar logs de errores en funciones SQL

### Backup y Recuperación:
- Incluir tablas en backup regular de Supabase
- Políticas de retención de datos
- Procedimientos de recuperación

---

## ✅ Estado del Sistema

**✅ SISTEMA 100% FUNCIONAL**

- Migración SQL aplicada exitosamente
- Server actions implementadas y testeadas
- Componentes frontend completamente funcionales
- APIs REST operativas
- Integración con dashboard principal
- Documentación completa

**Listo para uso en producción** - El sistema registrará automáticamente correos enviados y mantendrá un historial completo de comunicaciones con clientes para optimizar el servicio al cliente del Hotel Termas Llifén. 