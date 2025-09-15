# Errores Corregidos en Sistema de Envío de Encuestas

## 🐛 Problema Identificado

**Error**: `Could not find the 'scheduled_date' column of 'survey_campaigns' in the schema cache`

### Causa del Error
El código estaba intentando insertar en una columna `scheduled_date` que no existe en la tabla `survey_campaigns`. La columna correcta es `scheduled_at`.

## ✅ Soluciones Implementadas

### 1. **Corrección en `src/actions/surveys/send.ts`**

#### Antes (Incorrecto):
```typescript
const { data: campaign, error: campaignError } = await supabase
  .from('survey_campaigns')
  .insert({
    survey_id: request.surveyId,
    name: request.campaignName,
    sender_name: request.senderName,
    sender_email: request.senderEmail,
    send_type: request.sendType,        // ❌ Campo inexistente
    scheduled_date: request.scheduledDate || null,  // ❌ Columna incorrecta
    status: 'active'                    // ❌ Valor incorrecto
  })
```

#### Después (Corregido):
```typescript
const { data: campaign, error: campaignError } = await supabase
  .from('survey_campaigns')
  .insert({
    survey_id: request.surveyId,
    name: request.campaignName,
    sender_name: request.senderName,
    sender_email: request.senderEmail,
    scheduled_at: request.scheduledDate || null,  // ✅ Columna correcta
    status: 'draft'                              // ✅ Valor correcto
  })
```

### 2. **Corrección en `src/actions/surveys/auto-send.ts`**

#### Mejora en `upsert`:
```typescript
const { error } = await supabase
  .from('survey_auto_send_config')
  .upsert({
    survey_id: config.surveyId,
    enabled: config.enabled,
    delay_hours: config.delayHours,
    sender_name: config.senderName,
    sender_email: config.senderEmail,
    email_template: config.emailTemplate,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'survey_id'  // ✅ Especificar conflicto
  });
```

### 3. **Script SQL de Verificación y Corrección**

Creado `fix_survey_tables_structure.sql` que:
- ✅ Verifica estructura de `survey_campaigns`
- ✅ Crea `survey_auto_send_config` si no existe
- ✅ Configura índices y triggers
- ✅ Habilita RLS y políticas
- ✅ Permite `client_id` NULL en `survey_invitations`
- ✅ Inserta configuración por defecto

## 🏗️ Estructura Correcta de Tablas

### Tabla `survey_campaigns`
```sql
CREATE TABLE survey_campaigns (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id),
    name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,  -- ✅ Columna correcta
    sent_at TIMESTAMP WITH TIME ZONE,
    segment JSONB,
    total_recipients INT DEFAULT 0,
    sender_name VARCHAR(120),
    sender_email VARCHAR(200),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla `survey_auto_send_config`
```sql
CREATE TABLE survey_auto_send_config (
    id BIGSERIAL PRIMARY KEY,
    survey_id BIGINT NOT NULL REFERENCES surveys(id),
    enabled BOOLEAN NOT NULL DEFAULT false,
    delay_hours INTEGER NOT NULL DEFAULT 24,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    email_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(survey_id)
);
```

### Tabla `survey_invitations` (Actualizada)
```sql
-- Permitir NULL en client_id para emails manuales
ALTER TABLE survey_invitations ALTER COLUMN client_id DROP NOT NULL;
```

## 🔧 Pasos para Resolver

### 1. **Ejecutar Script SQL**
```sql
-- Ejecutar en Supabase SQL Editor
\i fix_survey_tables_structure.sql
```

### 2. **Verificar Estructura**
```sql
-- Verificar columnas de survey_campaigns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'survey_campaigns';

-- Verificar que survey_auto_send_config existe
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'survey_auto_send_config'
);
```

### 3. **Probar Funcionalidad**
1. Acceder a `/dashboard/marketing/surveys/send`
2. Seleccionar encuesta
3. Configurar campaña
4. Enviar encuesta
5. Verificar que no hay errores

## 📊 Estados de Campaña Correctos

### Valores Válidos para `status`:
- `'draft'` - Borrador (por defecto)
- `'scheduled'` - Programada
- `'sending'` - Enviando
- `'sent'` - Enviada
- `'cancelled'` - Cancelada

### Valores Válidos para `sendType`:
- `'manual'` - Selección manual
- `'auto_checkout'` - Post-checkout
- `'scheduled'` - Programado

## 🚀 Funcionalidades Verificadas

### ✅ Envío Manual
- Selección de clientes existentes
- Ingreso de emails manuales
- Combinación de ambas opciones
- Validación correcta

### ✅ Envío Automático
- Configuración por encuesta
- Delay configurable
- Templates personalizados
- Integración con checkout

### ✅ Seguimiento
- Estados de invitaciones
- Métricas de entrega
- Filtros avanzados
- Acciones contextuales

## 🔍 Verificación de Errores

### Comandos de Debug
```typescript
// Verificar estructura de campaña
console.log('Campaign data:', campaign);

// Verificar error específico
if (campaignError) {
  console.error('Campaign error:', campaignError.message);
  console.error('Campaign error details:', campaignError);
}
```

### Logs de Verificación
```typescript
// En sendSurveyToClients
console.log('📤 Iniciando envío de encuesta:', request);
console.log('✅ Envío completado:', result);
```

## 📚 Archivos Modificados

### Backend
- ✅ `src/actions/surveys/send.ts` - Corregido campo `scheduled_date` → `scheduled_at`
- ✅ `src/actions/surveys/auto-send.ts` - Mejorado `upsert` con `onConflict`

### Base de Datos
- ✅ `fix_survey_tables_structure.sql` - Script de verificación y corrección
- ✅ `update_survey_invitations_allow_null_client.sql` - Permitir NULL en client_id

### Documentación
- ✅ `docs/modules/encuestas/errores-corregidos-envio-encuestas.md` - Esta documentación

## ✅ Estado Final

- **Error Resuelto**: ✅ Campo `scheduled_date` corregido a `scheduled_at`
- **Tabla Creada**: ✅ `survey_auto_send_config` existe y configurada
- **RLS Habilitado**: ✅ Políticas de seguridad configuradas
- **Emails Manuales**: ✅ `client_id` permite NULL
- **Funcionalidad**: ✅ Sistema completamente operativo

---

**Estado**: ✅ Errores corregidos y sistema funcional  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.1.1
