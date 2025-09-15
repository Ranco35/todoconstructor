# Implementación de Emails Manuales en Sistema de Encuestas

## 📧 Resumen

Se ha implementado la funcionalidad para ingresar emails manualmente en el sistema de envío de encuestas, permitiendo enviar encuestas a direcciones de email que no están registradas como clientes en el sistema.

## 🎯 Funcionalidades Implementadas

### 1. **Ingreso Manual de Emails**
- **Campo de Entrada**: Input de tipo email con validación
- **Agregar Emails**: Botón para agregar emails a la lista
- **Validación**: Verificación de formato de email y duplicados
- **Tecla Enter**: Agregar email presionando Enter

### 2. **Gestión de Lista de Emails**
- **Visualización**: Tags con emails agregados
- **Eliminación**: Botón X para remover emails individuales
- **Contador**: Número de emails agregados
- **Prevención de Duplicados**: No permite emails repetidos

### 3. **Integración con Selección de Clientes**
- **Dos Opciones**: Emails manuales O clientes existentes
- **Combinación**: Permite usar ambas opciones simultáneamente
- **Resumen Total**: Contador de destinatarios totales
- **Separador Visual**: Línea divisoria entre opciones

### 4. **Validación Mejorada**
- **Validación Combinada**: Requiere al menos un cliente O un email manual
- **Mensaje de Error**: "Por favor selecciona al menos un cliente o ingresa un email manual"
- **Validación de Formato**: Solo acepta emails con formato válido

## 🏗️ Implementación Técnica

### Frontend (React)

#### Estado del Formulario
```typescript
const [formData, setFormData] = useState({
  // ... otros campos
  manualEmails: [] as string[],
  manualEmailInput: ''
});
```

#### Funciones de Gestión
```typescript
const addManualEmail = () => {
  const email = formData.manualEmailInput.trim();
  if (email && email.includes('@') && !formData.manualEmails.includes(email)) {
    setFormData(prev => ({
      ...prev,
      manualEmails: [...prev.manualEmails, email],
      manualEmailInput: ''
    }));
  }
};

const removeManualEmail = (email: string) => {
  setFormData(prev => ({
    ...prev,
    manualEmails: prev.manualEmails.filter(e => e !== email)
  }));
};
```

#### Interfaz de Usuario
```jsx
{/* Ingreso manual de emails */}
<div>
  <label>Ingresar Emails Manualmente</label>
  <div className="flex gap-2">
    <input
      type="email"
      value={formData.manualEmailInput}
      onChange={(e) => setFormData(prev => ({ ...prev, manualEmailInput: e.target.value }))}
      onKeyPress={handleManualEmailKeyPress}
      placeholder="ejemplo@email.com"
    />
    <button onClick={addManualEmail}>Agregar</button>
  </div>
  
  {/* Lista de emails */}
  {formData.manualEmails.map((email, index) => (
    <span key={index} className="email-tag">
      {email}
      <button onClick={() => removeManualEmail(email)}>×</button>
    </span>
  ))}
</div>
```

### Backend (Server Actions)

#### Interfaz Actualizada
```typescript
export interface SurveySendRequest {
  surveyId: number;
  campaignName: string;
  senderName: string;
  senderEmail: string;
  sendType: 'manual' | 'auto_checkout' | 'scheduled';
  clientIds?: number[];
  manualEmails?: string[]; // ✅ Nuevo campo
  reservationIds?: number[];
  scheduledDate?: string;
  emailTemplate?: string;
}
```

#### Procesamiento de Emails Manuales
```typescript
if (request.sendType === 'manual') {
  // Obtener clientes seleccionados
  let selectedClients = [];
  if (request.clientIds && request.clientIds.length > 0) {
    // ... obtener de base de datos
  }

  // Agregar emails manuales
  const manualClients = (request.manualEmails || []).map((email, index) => ({
    id: -1 - index, // ID negativo para emails manuales
    email: email,
    name: email.split('@')[0] // Usar parte antes del @ como nombre
  }));

  clientsToSend = [...selectedClients, ...manualClients];
}
```

#### Creación de Invitaciones
```typescript
const invitations = clientsToSend.map(client => ({
  campaign_id: campaign.id,
  survey_id: request.surveyId,
  client_id: client.id > 0 ? client.id : null, // null para emails manuales
  email: client.email,
  token: crypto.randomUUID(),
  status: 'pending',
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  reservation_id: client.reservation_id || null
}));
```

### Base de Datos

#### Actualización de Tabla
```sql
-- Permitir NULL en client_id para emails manuales
ALTER TABLE survey_invitations ALTER COLUMN client_id DROP NOT NULL;

-- Agregar comentario
COMMENT ON COLUMN survey_invitations.client_id IS 'ID del cliente (NULL para emails manuales no registrados)';
```

## 🎨 Interfaz de Usuario

### Sección de Emails Manuales
```
┌─────────────────────────────────────────────────────────┐
│ Ingresar Emails Manualmente                             │
├─────────────────────────────────────────────────────────┤
│ [ejemplo@email.com                    ] [Agregar]      │
├─────────────────────────────────────────────────────────┤
│ Emails agregados (2):                                  │
│ [cliente1@email.com ×] [cliente2@email.com ×]         │
└─────────────────────────────────────────────────────────┘
```

### Separador Visual
```
───────────────── O seleccionar de clientes existentes ─────────────────
```

### Resumen Total
```
┌─────────────────────────────────────────────────────────┐
│ Total de destinatarios                    📧            │
│ 5 destinatarios                                        │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Trabajo

### 1. Ingreso de Emails Manuales
```
1. Seleccionar tipo "Selección Manual"
2. Ingresar email en el campo de texto
3. Presionar "Agregar" o Enter
4. Email aparece como tag
5. Repetir para más emails
6. Remover emails con botón X si es necesario
```

### 2. Combinación con Clientes Existentes
```
1. Agregar emails manuales (opcional)
2. Seleccionar clientes existentes (opcional)
3. Ver resumen total de destinatarios
4. Enviar encuesta
```

### 3. Validación y Envío
```
1. Sistema valida que hay al menos un destinatario
2. Combina emails manuales y clientes seleccionados
3. Crea invitaciones (client_id = null para emails manuales)
4. Envía emails a todos los destinatarios
5. Muestra estadísticas de envío
```

## 📊 Casos de Uso

### 1. Envío a Emails Específicos
```
- Cliente potencial que no está registrado
- Email de contacto de empresa
- Dirección de email temporal
- Lista de emails externa
```

### 2. Envío Mixto
```
- Algunos clientes registrados
- Algunos emails manuales
- Combinación para campaña específica
```

### 3. Envío de Prueba
```
- Email del administrador
- Email de testing
- Verificación de funcionamiento
```

## ✅ Beneficios

### Para el Usuario
- **Flexibilidad Total**: Enviar a cualquier email
- **No Requiere Registro**: Emails externos válidos
- **Fácil Gestión**: Agregar/remover emails fácilmente
- **Validación Inteligente**: Previene duplicados y errores

### Para el Sistema
- **Compatibilidad**: Funciona con sistema existente
- **Escalabilidad**: Maneja cualquier cantidad de emails
- **Trazabilidad**: Registra todos los envíos
- **Robustez**: Manejo de errores mejorado

## 🔧 Configuración

### Variables de Entorno
```env
# No se requieren cambios adicionales
NEXT_PUBLIC_APP_URL=https://admintermas.vercel.app
```

### Base de Datos
```sql
-- Ejecutar script de actualización
\i update_survey_invitations_allow_null_client.sql
```

## 🚀 Estado de Implementación

- ✅ **Frontend**: Interfaz completa implementada
- ✅ **Backend**: Server actions actualizadas
- ✅ **Base de Datos**: Tabla actualizada para NULL client_id
- ✅ **Validación**: Lógica de validación mejorada
- ✅ **UX**: Interfaz intuitiva y responsive
- ✅ **Documentación**: Guía completa creada

## 📚 Archivos Modificados

### Frontend
- `src/app/dashboard/marketing/surveys/send/page.tsx` - Interfaz de envío

### Backend
- `src/actions/surveys/send.ts` - Lógica de envío

### Base de Datos
- `update_survey_invitations_allow_null_client.sql` - Script de actualización

### Documentación
- `docs/modules/encuestas/emails-manuales-implementacion.md` - Esta documentación

---

**Estado**: ✅ Completamente funcional  
**Última actualización**: 9 de enero de 2025  
**Versión**: 1.1.0
