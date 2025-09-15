# Corrección Error: `reservation_id` en `survey_invitations`

## 🐛 Problema Identificado

**Error**: `Could not find the 'reservation_id' column of 'survey_invitations' in the schema cache`

### Causa del Error
El código estaba intentando insertar en una columna `reservation_id` que **NO EXISTE** en la tabla `survey_invitations`. La tabla solo tiene las siguientes columnas:

```sql
survey_invitations {
    id BIGSERIAL PRIMARY KEY
    campaign_id BIGINT REFERENCES survey_campaigns(id)
    survey_id BIGINT NOT NULL REFERENCES surveys(id)
    client_id BIGINT REFERENCES "Client"(id)  -- ✅ Esta columna SÍ existe
    email VARCHAR(255) NOT NULL
    token UUID NOT NULL
    expires_at TIMESTAMP WITH TIME ZONE
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
    sent_at TIMESTAMP WITH TIME ZONE
    opened_at TIMESTAMP WITH TIME ZONE
    responded_at TIMESTAMP WITH TIME ZONE
    created_at TIMESTAMP WITH TIME ZONE
    updated_at TIMESTAMP WITH TIME ZONE
}
```

## ✅ Soluciones Implementadas

### 1. **Corrección en `src/actions/surveys/send.ts`**

#### Antes (Incorrecto):
```typescript
const invitations = clientsToSend.map(client => ({
  campaign_id: campaign.id,
  survey_id: request.surveyId,
  client_id: client.id > 0 ? client.id : null,
  email: client.email,
  token: crypto.randomUUID(),
  status: 'pending',
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  reservation_id: client.reservation_id || null  // ❌ Columna inexistente
}));
```

#### Después (Corregido):
```typescript
const invitations = clientsToSend.map(client => ({
  campaign_id: campaign.id,
  survey_id: request.surveyId,
  client_id: client.id > 0 ? client.id : null,
  email: client.email,
  token: crypto.randomUUID(),
  status: 'pending',
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  // ✅ Eliminado reservation_id
}));
```

### 2. **Corrección en `src/actions/surveys/auto-send.ts`**

#### Función `triggerCheckoutSurvey`:
```typescript
// ❌ Antes (Incorrecto)
const { data: existingInvitation, error: existingError } = await supabase
  .from('survey_invitations')
  .select('id')
  .eq('survey_id', config.survey_id)
  .eq('reservation_id', reservationId)  // ❌ Columna inexistente
  .single();

// ✅ Después (Corregido)
const { data: existingInvitation, error: existingError } = await supabase
  .from('survey_invitations')
  .select('id')
  .eq('survey_id', config.survey_id)
  .eq('client_id', reservation.Client.id)  // ✅ Usar client_id
  .single();
```

#### Función `processAutoSend`:
```typescript
// ❌ Antes (Incorrecto)
.not('id', 'in', `(
  SELECT reservation_id 
  FROM survey_invitations 
  WHERE survey_id = ${config.survey_id} 
  AND reservation_id IS NOT NULL
)`);

// ✅ Después (Corregido)
.not('client_id', 'in', `(
  SELECT client_id 
  FROM survey_invitations 
  WHERE survey_id = ${config.survey_id} 
  AND client_id IS NOT NULL
)`);
```

### 3. **Corrección en `src/app/dashboard/marketing/surveys/tracking/page.tsx`**

#### Interface actualizada:
```typescript
// ❌ Antes (Incorrecto)
interface SurveyInvitation {
  // ... otros campos
  reservation_id: number | null;  // ❌ Campo inexistente
}

// ✅ Después (Corregido)
interface SurveyInvitation {
  // ... otros campos
  client_id: number | null;  // ✅ Campo correcto
}
```

#### Datos mock actualizados:
```typescript
// ❌ Antes
reservation_id: 123,

// ✅ Después
client_id: 123,
```

#### Tabla de seguimiento:
```typescript
// ❌ Antes
{invitation.reservation_id && (
  <div className="text-sm text-gray-500">
    Reserva #{invitation.reservation_id}
  </div>
)}

// ✅ Después
{invitation.client_id && (
  <div className="text-sm text-gray-500">
    Cliente ID: {invitation.client_id}
  </div>
)}
```

## 🏗️ Estructura Correcta de `survey_invitations`

### Columnas Existentes
```sql
CREATE TABLE survey_invitations (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT REFERENCES survey_campaigns(id),
    survey_id BIGINT NOT NULL REFERENCES surveys(id),
    client_id BIGINT REFERENCES "Client"(id),  -- ✅ Para vincular con clientes
    email VARCHAR(255) NOT NULL,               -- ✅ Email del destinatario
    token UUID NOT NULL,                       -- ✅ Token único para acceso
    expires_at TIMESTAMP WITH TIME ZONE,       -- ✅ Fecha de expiración
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- ✅ Estado de la invitación
    sent_at TIMESTAMP WITH TIME ZONE,          -- ✅ Fecha de envío
    opened_at TIMESTAMP WITH TIME ZONE,        -- ✅ Fecha de apertura
    responded_at TIMESTAMP WITH TIME ZONE,     -- ✅ Fecha de respuesta
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(token)
);
```

### Columnas NO Existentes
- ❌ `reservation_id` - **NO EXISTE** en la tabla
- ❌ `send_type` - **NO EXISTE** en la tabla
- ❌ `scheduled_date` - **NO EXISTE** en la tabla

## 🔧 Lógica de Vinculación Corregida

### Para Emails Manuales
```typescript
// Emails manuales no tienen client_id válido
const manualClients = (request.manualEmails || []).map((email, index) => ({
  id: -1 - index, // ID negativo para emails manuales
  email: email,
  name: email.split('@')[0]
}));

// En la invitación
client_id: client.id > 0 ? client.id : null  // null para emails manuales
```

### Para Clientes Existentes
```typescript
// Clientes de la base de datos tienen ID válido
const selectedClients = clients.map(client => ({
  id: client.id,        // ID positivo de la tabla Client
  email: client.email,
  name: `${client.nombrePrincipal} ${client.apellido}`
}));

// En la invitación
client_id: client.id  // ID real del cliente
```

### Para Verificación de Duplicados
```typescript
// Verificar por client_id en lugar de reservation_id
const { data: existingInvitation } = await supabase
  .from('survey_invitations')
  .select('id')
  .eq('survey_id', surveyId)
  .eq('client_id', clientId)  // ✅ Usar client_id
  .single();
```

## 📊 Estados de Invitación

### Valores Válidos para `status`:
- `'pending'` - Pendiente de envío
- `'opened'` - Email abierto por el destinatario
- `'responded'` - Encuesta completada
- `'bounced'` - Email rebotado
- `'unsubscribed'` - Usuario se desuscribió

### Campos de Timestamp:
- `sent_at` - Cuando se envió el email
- `opened_at` - Cuando se abrió el email
- `responded_at` - Cuando se completó la encuesta
- `expires_at` - Fecha de expiración (30 días por defecto)

## 🚀 Funcionalidades Verificadas

### ✅ Envío Manual
- Emails manuales: `client_id = null`
- Clientes existentes: `client_id = ID real`
- Combinación de ambos tipos

### ✅ Envío Automático
- Verificación por `client_id` en lugar de `reservation_id`
- Prevención de duplicados por cliente
- Integración con sistema de reservas

### ✅ Seguimiento
- Estados correctos de invitaciones
- Timestamps de envío, apertura y respuesta
- Filtros por estado y período

## 🔍 Script de Verificación

Creado `verify_survey_invitations_structure.sql` para:
- ✅ Verificar estructura actual de `survey_invitations`
- ✅ Confirmar que `reservation_id` NO existe
- ✅ Verificar que `client_id` permite NULL
- ✅ Mostrar estructura completa de tablas

## 📚 Archivos Modificados

### Backend
- ✅ `src/actions/surveys/send.ts` - Eliminado `reservation_id`
- ✅ `src/actions/surveys/auto-send.ts` - Corregido verificación por `client_id`

### Frontend
- ✅ `src/app/dashboard/marketing/surveys/tracking/page.tsx` - Interface y datos corregidos

### Base de Datos
- ✅ `verify_survey_invitations_structure.sql` - Script de verificación

### Documentación
- ✅ `docs/modules/encuestas/correccion-reservation-id-error.md` - Esta documentación

## ✅ Estado Final

- **Error Resuelto**: ✅ Eliminado `reservation_id` inexistente
- **Lógica Corregida**: ✅ Usar `client_id` para vinculación
- **Verificación Duplicados**: ✅ Por `client_id` en lugar de `reservation_id`
- **Emails Manuales**: ✅ `client_id = null` funciona correctamente
- **Sistema Funcional**: ✅ Envío de encuestas operativo

---

**Estado**: ✅ Error corregido y sistema funcional  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.1.2
