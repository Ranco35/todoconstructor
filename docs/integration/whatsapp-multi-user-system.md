# 📱 Sistema Multi-Usuario WhatsApp - AdminTermas

## 📋 Resumen

Se ha implementado un sistema completo de **WhatsApp Multi-Usuario** que permite que **múltiples usuarios** se conecten al mismo WhatsApp desde **diferentes computadoras** y atiendan a **clientes distintos** de forma distribuida. El sistema incluye balanceo de carga automático, asignación inteligente de clientes y gestión de prioridades.

## 🎯 Funcionalidades Implementadas

### ✅ 1. Sistema Multi-Usuario Completo
- **Máximo 5 usuarios** conectados simultáneamente
- **Registro individual** de cada usuario con rol específico
- **Estados de usuario**: online, busy, offline
- **Roles diferenciados**: ADMIN, RECEPTION, SALES, SUPPORT

### ✅ 2. Asignación Inteligente de Clientes
- **Balanceo de carga automático** (round-robin, least-busy, random)
- **Asignación por prioridad** (urgent, high, medium, low)
- **Reasignación automática** cuando un usuario se desconecta
- **Cola de espera** para clientes sin usuarios disponibles

### ✅ 3. Gestión de Conversaciones
- **Historial completo** de conversaciones por cliente
- **Priorización automática** basada en palabras clave
- **Estados de conversación**: active, waiting, resolved
- **Límite de 10 clientes** por usuario

### ✅ 4. Interfaz de Administración
- **Dashboard personal** con estadísticas individuales
- **Panel de registro** con roles específicos
- **Envío de mensajes** como usuario específico
- **Gestión de asignaciones** en tiempo real

## 🛠️ Arquitectura Técnica

### Estructura de Archivos

```
src/
├── lib/
│   └── whatsapp-multi-user.ts              # Sistema multi-usuario
├── actions/whatsapp/
│   └── multi-user-actions.ts               # Server Actions multi-usuario
├── app/dashboard/whatsapp-multi-user/
│   ├── page.tsx                           # Página principal
│   └── WhatsAppMultiUserClient.tsx        # Interfaz multi-usuario
└── docs/integration/
    └── whatsapp-multi-user-system.md      # Documentación
```

### Tecnologías Utilizadas

- **whatsapp-web.js** - Cliente oficial de WhatsApp Web
- **Singleton Pattern** - Una sola instancia de WhatsApp compartida
- **Map Data Structures** - Gestión eficiente de usuarios y asignaciones
- **Priority Queue** - Cola de mensajes con prioridades
- **Load Balancing** - Algoritmos de distribución de carga

## 📝 Configuración del Sistema

### 1. Configuración Multi-Usuario

```typescript
export const MULTI_USER_CONFIG = {
  maxConcurrentUsers: 5,           // Máximo 5 usuarios
  sessionTimeout: 30 * 60 * 1000,  // 30 minutos de timeout
  autoReassign: true,              // Reasignación automática
  loadBalancing: 'round-robin',    // Algoritmo de balanceo
} as const;
```

### 2. Roles de Usuario

- **ADMIN**: Acceso completo, gestión del sistema
- **RECEPTION**: Atención de recepción, reservas
- **SALES**: Ventas, consultas comerciales
- **SUPPORT**: Soporte técnico, problemas

### 3. Estados de Usuario

- **online**: Disponible para recibir clientes
- **busy**: Ocupado, no recibe nuevos clientes
- **offline**: Desconectado, no disponible

## 🚀 Uso del Sistema

### Registro de Usuario

#### Paso 1: Acceder al Sistema
1. Ir a `/dashboard/whatsapp-multi-user`
2. Navegar a la pestaña "Registro"
3. Completar formulario con:
   - **Nombre**: Nombre completo del usuario
   - **Email**: Correo electrónico
   - **Rol**: ADMIN, RECEPTION, SALES, SUPPORT

#### Paso 2: Configurar WhatsApp
1. El primer usuario debe inicializar el sistema
2. Escanear código QR con WhatsApp
3. Confirmar conexión
4. Sistema listo para múltiples usuarios

### Dashboard Personal

#### Información Disponible:
- **Estado personal**: online/busy/offline
- **Clientes asignados**: Lista de números atendidos
- **Conversaciones activas**: Chats en curso
- **Prioridades urgentes**: Casos de alta prioridad
- **Estadísticas**: Métricas de rendimiento

#### Cambio de Estado:
```typescript
// Cambiar a ocupado
await updateWhatsAppUserStatus('busy');

// Volver a disponible
await updateWhatsAppUserStatus('online');
```

### Envío de Mensajes

#### Como Usuario Específico:
```typescript
// Enviar mensaje personalizado
await sendWhatsAppMessageAsUser('+56912345678', 'Hola, ¿en qué puedo ayudarte?');
```

#### Validaciones:
- Número de teléfono válido
- Mensaje no vacío
- Usuario registrado y online
- Cliente WhatsApp conectado

## 📊 Balanceo de Carga

### Algoritmos Disponibles:

#### 1. Round-Robin (Por defecto)
```typescript
// Distribuye clientes secuencialmente
User 1 → User 2 → User 3 → User 1...
```

#### 2. Least-Busy
```typescript
// Asigna al usuario con menos clientes
User 1 (2 clients) → User 2 (5 clients) → User 1
```

#### 3. Random
```typescript
// Asignación aleatoria entre usuarios disponibles
Math.random() entre usuarios online
```

### Configuración:
```typescript
// Cambiar algoritmo en MULTI_USER_CONFIG
loadBalancing: 'least-busy' // o 'random', 'round-robin'
```

## 🎯 Priorización de Clientes

### Palabras Clave Urgentes:
- "emergencia", "urgente", "ayuda", "problema", "error"

### Palabras Clave Alta Prioridad:
- "reserva", "cancelar", "cambiar", "problema"

### Palabras Clave Media Prioridad:
- "precio", "disponibilidad", "información"

### Prioridades:
- **urgent**: Respuesta inmediata (rojo)
- **high**: Alta prioridad (naranja)
- **medium**: Prioridad media (amarillo)
- **low**: Prioridad baja (verde)

## 🔄 Flujo de Atención

### 1. Cliente Envía Mensaje
```
Cliente → WhatsApp → Sistema Multi-Usuario
```

### 2. Asignación Automática
```
Sistema → Buscar usuario disponible → Asignar cliente
```

### 3. Notificación al Usuario
```
Sistema → Notificar usuario asignado → Mostrar en dashboard
```

### 4. Respuesta del Usuario
```
Usuario → Escribir respuesta → Enviar como usuario específico
```

### 5. Reasignación (si es necesario)
```
Usuario offline → Reasignar clientes → Notificar nuevo usuario
```

## 📱 Experiencia del Cliente

### Para el Cliente:
- **Transparencia total**: No sabe que hay múltiples usuarios
- **Respuesta inmediata**: Sistema asigna automáticamente
- **Continuidad**: Mismo usuario para conversación completa
- **Priorización**: Casos urgentes atendidos primero

### Para el Usuario:
- **Dashboard personal**: Ve solo sus clientes asignados
- **Estadísticas individuales**: Métricas de rendimiento
- **Control de estado**: online/busy/offline
- **Envío personalizado**: Mensajes con su identidad

## 🎛️ Panel de Administración

### Acceso: `/dashboard/whatsapp-multi-user`

#### Pestañas Disponibles:

1. **📝 Registro**
   - Formulario de registro con roles
   - Estado de registro actual
   - Opción de desregistrarse

2. **📊 Dashboard**
   - Información personal del usuario
   - Estadísticas individuales
   - Cambio de estado
   - Métricas de rendimiento

3. **💬 Mensajes**
   - Envío de mensajes personalizados
   - Validación de números
   - Historial de envíos

4. **👥 Asignaciones**
   - Lista de clientes asignados
   - Estados de conversación
   - Prioridades y timestamps

## 🔧 Configuración Avanzada

### Límites del Sistema:
```typescript
maxConcurrentUsers: 5,        // Máximo usuarios
maxClientsPerUser: 10,        // Máximo clientes por usuario
sessionTimeout: 30 minutes,   // Timeout de sesión
```

### Personalización de Roles:
```typescript
// Agregar nuevo rol
export type UserRole = 'ADMIN' | 'RECEPTION' | 'SALES' | 'SUPPORT' | 'NEW_ROLE';

// Configurar permisos por rol
const rolePermissions = {
  ADMIN: ['all'],
  RECEPTION: ['reservations', 'general'],
  SALES: ['sales', 'quotes'],
  SUPPORT: ['technical', 'issues'],
};
```

### Balanceo de Carga Personalizado:
```typescript
// Implementar algoritmo personalizado
private customLoadBalancing(users: WhatsAppUser[]): WhatsAppUser | null {
  // Lógica personalizada aquí
  return selectedUser;
}
```

## 📈 Métricas y Estadísticas

### Métricas del Sistema:
- **Total usuarios**: Número de usuarios registrados
- **Usuarios activos**: Usuarios online actualmente
- **Clientes asignados**: Total de conversaciones activas
- **Conversaciones activas**: Chats en curso
- **Estado del sistema**: operational/degraded/down

### Métricas por Usuario:
- **Clientes asignados**: Número de clientes atendiendo
- **Conversaciones activas**: Chats en curso
- **Casos urgentes**: Prioridad urgent
- **Alta prioridad**: Prioridad high
- **Última actividad**: Timestamp de última acción

## 🔒 Seguridad y Permisos

### Validaciones Implementadas:
- **Autenticación**: Usuario debe estar logueado
- **Autorización**: Verificación de permisos por rol
- **Validación de datos**: Números de teléfono, mensajes
- **Límites de uso**: Máximo clientes por usuario
- **Timeouts**: Sesiones expiran automáticamente

### Roles y Permisos:
```typescript
const rolePermissions = {
  ADMIN: {
    canManageUsers: true,
    canViewAllAssignments: true,
    canChangeSystemConfig: true,
  },
  RECEPTION: {
    canManageUsers: false,
    canViewOwnAssignments: true,
    canSendMessages: true,
  },
  SALES: {
    canManageUsers: false,
    canViewOwnAssignments: true,
    canSendMessages: true,
  },
  SUPPORT: {
    canManageUsers: false,
    canViewOwnAssignments: true,
    canSendMessages: true,
  },
};
```

## 🚨 Troubleshooting

### Problemas Comunes:

#### 1. Usuario no puede registrarse
**Causa**: Límite de usuarios alcanzado
**Solución**: Desregistrar usuarios inactivos o aumentar límite

#### 2. Clientes no se asignan
**Causa**: No hay usuarios online
**Solución**: Cambiar estado de usuarios a 'online'

#### 3. Mensajes no se envían
**Causa**: WhatsApp no conectado
**Solución**: Verificar conexión y escanear QR

#### 4. Reasignación no funciona
**Causa**: No hay usuarios disponibles
**Solución**: Agregar más usuarios o liberar usuarios ocupados

### Logs de Debug:
```typescript
// Habilitar logs detallados
console.log('🔄 Procesando asignación:', clientPhone);
console.log('👤 Usuario asignado:', assignedUser.name);
console.log('📊 Estado del sistema:', systemStatus);
```

## 🔮 Mejoras Futuras

### Funcionalidades Planificadas:

1. **Notificaciones en tiempo real**
   - WebSockets para actualizaciones instantáneas
   - Notificaciones push para nuevos mensajes

2. **Analytics avanzados**
   - Métricas de rendimiento por usuario
   - Tiempo de respuesta promedio
   - Satisfacción del cliente

3. **Integración con CRM**
   - Sincronización con base de datos de clientes
   - Historial completo de interacciones

4. **Automatización**
   - Respuestas automáticas por horario
   - Derivación inteligente por tipo de consulta

5. **Escalabilidad**
   - Soporte para más de 5 usuarios
   - Múltiples números de WhatsApp
   - Distribución geográfica

## 📞 Soporte Técnico

### Contacto:
- **Desarrollador**: Sistema AdminTermas
- **Documentación**: `/docs/integration/whatsapp-multi-user-system.md`
- **Código fuente**: `/src/lib/whatsapp-multi-user.ts`

### Recursos Adicionales:
- **API Reference**: Server actions en `/src/actions/whatsapp/multi-user-actions.ts`
- **Componentes UI**: `/src/app/dashboard/whatsapp-multi-user/`
- **Configuración**: Variables en `MULTI_USER_CONFIG`

---

**Estado**: ✅ **Completamente funcional**
**Versión**: 1.0.0
**Última actualización**: Enero 2025 