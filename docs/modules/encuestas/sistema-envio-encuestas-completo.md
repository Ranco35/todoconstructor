# Sistema de Envío de Encuestas - Hotel Spa Termas Llifén

## 📧 Resumen Ejecutivo

El sistema de envío de encuestas proporciona una interfaz robusta y completa para enviar encuestas de satisfacción a clientes alojados en las termas. Incluye envío automático post-checkout, selección manual de clientes, configuración de campañas y seguimiento detallado de entregas.

## 🎯 Características Principales

### 1. **Envío Manual de Encuestas**
- **Selección de Clientes**: Lista completa de clientes activos con historial de reservas
- **Selección por Checkout**: Clientes que hicieron checkout recientemente
- **Configuración de Campaña**: Nombre, remitente, template personalizado
- **Envío Masivo**: Procesamiento de múltiples destinatarios simultáneamente

### 2. **Envío Automático Post-Checkout**
- **Integración con Reservas**: Activación automática al realizar checkout
- **Configuración Flexible**: Delay configurable (1-48 horas)
- **Prevención de Duplicados**: Verificación automática de encuestas ya enviadas
- **Templates Personalizables**: Email templates con variables dinámicas

### 3. **Seguimiento de Entregas**
- **Estados Detallados**: Pendiente, Enviado, Abierto, Completado, Expirado
- **Métricas en Tiempo Real**: Tasas de apertura y completado
- **Filtros Avanzados**: Por estado, campaña, período de tiempo
- **Historial Completo**: Timestamps de envío, apertura y completado

### 4. **Configuración de Envío Automático**
- **Habilitación por Encuesta**: Control granular por encuesta específica
- **Configuración de Delay**: Tiempo de espera después del checkout
- **Templates Personalizados**: HTML con variables dinámicas
- **Monitoreo de Estado**: Estado actual de cada configuración

## 🏗️ Arquitectura Técnica

### Backend (Server Actions)

#### `src/actions/surveys/send.ts`
```typescript
// Funciones principales
- sendSurveyToClients(): Envío masivo de encuestas
- getRecentCheckouts(): Clientes con checkout reciente
- getActiveClients(): Clientes activos con historial
- generateDefaultEmailTemplate(): Template HTML por defecto
```

#### `src/actions/surveys/auto-send.ts`
```typescript
// Funciones de envío automático
- setupAutoSend(): Configurar envío automático
- getAutoSendConfig(): Obtener configuración actual
- processAutoSend(): Procesar envíos automáticos pendientes
- triggerCheckoutSurvey(): Envío inmediato post-checkout
```

### Frontend (React Components)

#### `src/app/dashboard/marketing/surveys/send/page.tsx`
- **Interfaz de Envío Manual**: Selección de clientes y configuración
- **Tipos de Envío**: Manual, Post-Checkout, Programado
- **Validación en Tiempo Real**: Verificación de datos antes del envío
- **Feedback Inmediato**: Resultados de envío con estadísticas

#### `src/app/dashboard/marketing/surveys/auto-send/page.tsx`
- **Configuración de Automatización**: Setup de envío automático
- **Estado Visual**: Indicadores de configuración activa
- **Templates Personalizados**: Editor de templates HTML
- **Información Contextual**: Ayuda y explicaciones

#### `src/app/dashboard/marketing/surveys/tracking/page.tsx`
- **Dashboard de Seguimiento**: Métricas y estadísticas
- **Tabla de Invitaciones**: Lista detallada con filtros
- **Estados Visuales**: Badges de estado con colores
- **Acciones Contextuales**: Reenvío y visualización

### Base de Datos

#### Tabla `survey_auto_send_config`
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

#### Integración con `survey_invitations`
- **Campo `reservation_id`**: Vinculación con reservas específicas
- **Estados de Seguimiento**: `pending`, `sent`, `opened`, `completed`, `expired`
- **Timestamps**: `sent_at`, `opened_at`, `completed_at`

## 🔄 Flujo de Trabajo

### 1. Envío Manual
```
1. Seleccionar encuesta
2. Configurar campaña (nombre, remitente)
3. Elegir tipo de envío:
   - Manual: Seleccionar clientes específicos
   - Post-Checkout: Seleccionar reservas recientes
   - Programado: Fecha específica de checkout
4. Enviar encuestas
5. Recibir confirmación con estadísticas
```

### 2. Envío Automático
```
1. Configurar envío automático en /auto-send
2. Habilitar para encuesta específica
3. Configurar delay (horas después del checkout)
4. Personalizar template (opcional)
5. Sistema envía automáticamente al hacer checkout
6. Seguimiento en /tracking
```

### 3. Seguimiento
```
1. Acceder a /tracking
2. Ver métricas generales (tasas de apertura/completado)
3. Filtrar por estado, campaña, período
4. Revisar historial detallado
5. Reenviar si es necesario
```

## 📊 Métricas y KPIs

### Métricas Principales
- **Total Enviadas**: Número total de encuestas enviadas
- **Tasa de Apertura**: % de emails abiertos
- **Tasa de Completado**: % de encuestas completadas
- **Tiempo de Respuesta**: Promedio entre envío y completado

### Estados de Seguimiento
- **Pendiente**: Invitación creada, email no enviado
- **Enviado**: Email enviado exitosamente
- **Abierto**: Cliente abrió el email
- **Completado**: Cliente completó la encuesta
- **Expirado**: Invitación expiró (30 días)

## 🎨 Interfaz de Usuario

### Navegación Principal
```
📧 Encuestas
├── 📧 Enviar Encuestas (manual)
├── ⚙️ Envío Automático (configuración)
├── 📈 Seguimiento (métricas)
└── 📊 Ver Análisis (resultados)
```

### Tipos de Envío

#### 1. Selección Manual
- **Lista de Clientes**: Con historial de reservas
- **Checkboxes**: Selección múltiple
- **Filtros**: Por nombre, email, última reserva
- **Información Contextual**: Número de reservas, última estadía

#### 2. Post-Checkout
- **Reservas Recientes**: Últimos 7 días por defecto
- **Información Detallada**: Cliente, habitación, fechas
- **Estado de Reserva**: Solo reservas completadas
- **Prevención Duplicados**: Verificación automática

#### 3. Programado
- **Fecha Específica**: Checkouts de fecha determinada
- **Filtro Automático**: Solo reservas del día seleccionado
- **Validación**: Verificar que hay reservas en esa fecha

## 🔧 Configuración Técnica

### Variables de Entorno
```env
NEXT_PUBLIC_APP_URL=https://admintermas.vercel.app
```

### Templates de Email
```html
<!-- Variables disponibles -->
{{CLIENT_NAME}} - Nombre del cliente
{{SURVEY_TITLE}} - Título de la encuesta
{{SURVEY_LINK}} - URL única de la encuesta
{{SENDER_NAME}} - Nombre del remitente
```

### Integración con Sistema de Reservas
```typescript
// En checkoutReservation() y checkOutReservation()
const { triggerCheckoutSurvey } = await import('@/actions/surveys/auto-send');
const surveyResult = await triggerCheckoutSurvey(reservationId);
```

## 📈 Casos de Uso

### 1. Envío Semanal de Satisfacción
```
1. Acceder a "Enviar Encuestas"
2. Seleccionar "Satisfacción Hotel Spa Termas Llifén"
3. Tipo "Post-Checkout"
4. Seleccionar reservas de la semana
5. Enviar masivamente
6. Monitorear en "Seguimiento"
```

### 2. Configuración de Automatización
```
1. Acceder a "Envío Automático"
2. Seleccionar encuesta de satisfacción
3. Habilitar envío automático
4. Configurar delay de 2 horas
5. Personalizar template si es necesario
6. Guardar configuración
```

### 3. Seguimiento de Campaña
```
1. Acceder a "Seguimiento"
2. Filtrar por campaña específica
3. Revisar métricas de apertura
4. Identificar encuestas no completadas
5. Reenviar si es necesario
```

### 4. Análisis de Resultados
```
1. Acceder a "Ver Análisis"
2. Seleccionar encuesta
3. Revisar estadísticas generales
4. Analizar respuestas individuales
5. Exportar datos para presentación
```

## 🚀 Beneficios del Sistema

### Para el Hotel
- **Automatización Completa**: Envío automático post-checkout
- **Métricas Precisas**: Seguimiento detallado de entregas
- **Flexibilidad**: Múltiples tipos de envío
- **Eficiencia**: Reducción de trabajo manual

### Para los Clientes
- **Experiencia Personalizada**: Emails con nombre y datos específicos
- **Templates Profesionales**: Diseño atractivo y responsive
- **Acceso Fácil**: Links directos a encuestas
- **Recordatorios**: Sistema de seguimiento automático

### Para el Equipo
- **Interfaz Intuitiva**: Fácil de usar y configurar
- **Información Contextual**: Datos relevantes en cada paso
- **Feedback Inmediato**: Confirmaciones y estadísticas
- **Integración Completa**: Conectado con sistema de reservas

## 🔍 Troubleshooting

### Problemas Comunes

#### 1. Emails no se envían
```typescript
// Verificar configuración de email
const emailResult = await sendCustomEmail(...);
if (!emailResult.success) {
  console.error('Error email:', emailResult.error);
}
```

#### 2. Envío automático no funciona
```typescript
// Verificar configuración activa
const config = await getAutoSendConfig(surveyId);
if (!config || !config.enabled) {
  console.log('Envío automático no configurado');
}
```

#### 3. Duplicados en envío
```typescript
// Verificar invitación existente
const existing = await supabase
  .from('survey_invitations')
  .select('id')
  .eq('reservation_id', reservationId)
  .single();
```

### Logs de Debug
```typescript
console.log('📤 Enviando encuesta:', request);
console.log('✅ Envío completado:', result);
console.warn('⚠️ Error en envío:', error);
```

## 📚 Referencias

### Documentación Relacionada
- [Sistema de Encuestas Completo](./README.md)
- [Análisis de Resultados](./analisis-resultados-completo.md)
- [Guía de Uso Rápido](./guia-uso-rapido.md)
- [Arquitectura Técnica](./arquitectura-tecnica.md)

### Archivos Clave
- `src/actions/surveys/send.ts` - Lógica de envío
- `src/actions/surveys/auto-send.ts` - Automatización
- `src/app/dashboard/marketing/surveys/send/` - Interfaz de envío
- `src/app/dashboard/marketing/surveys/auto-send/` - Configuración
- `src/app/dashboard/marketing/surveys/tracking/` - Seguimiento
- `create_survey_auto_send_table.sql` - Estructura de BD

---

**Estado**: ✅ Completamente funcional  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.0.0
