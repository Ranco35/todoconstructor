# Gestión de Sesiones - Funcionalidades de Administrador

## Descripción General

El sistema de caja chica incluye funcionalidades avanzadas de administración que permiten a los usuarios con roles de **SUPER_USER** y **ADMINISTRADOR** gestionar completamente las sesiones de caja, incluyendo edición y eliminación.

## Funcionalidades de Administrador

### 🔧 Edición de Sesiones

#### Características
- **Edición de monto inicial**: Modificar el monto base de la sesión
- **Cambio de estado**: Cambiar entre Abierta, Suspendida, Cerrada
- **Actualización de notas**: Agregar o modificar notas de la sesión
- **Validaciones de seguridad**: Solo sesiones no cerradas pueden ser editadas

#### Restricciones
- ❌ No se pueden editar sesiones cerradas
- ❌ Solo administradores pueden editar
- ✅ Sesiones abiertas y suspendidas son editables

#### Campos Editables
```typescript
interface EditableSessionFields {
  openingAmount: number;    // Monto inicial
  status: 'OPEN' | 'SUSPENDED' | 'CLOSED';
  notes: string;           // Notas adicionales
}
```

### 🗑️ Eliminación de Sesiones

#### Características
- **Eliminación segura**: Validaciones antes de eliminar
- **Confirmación obligatoria**: Modal de confirmación
- **Restricciones automáticas**: Protección de datos importantes

#### Restricciones de Eliminación
- ❌ No se pueden eliminar sesiones cerradas
- ❌ No se pueden eliminar sesiones con transacciones (gastos/compras)
- ❌ No se pueden eliminar sesiones con cierre asociado
- ✅ Solo sesiones vacías y no cerradas pueden eliminarse

#### Validaciones Automáticas
```typescript
// Verificaciones antes de eliminar
const canDelete = 
  isAdmin && 
  session.status !== 'CLOSED' &&
  session.PettyCashExpense.length === 0 &&
  session.PettyCashPurchase.length === 0 &&
  !session.CashClosure;
```

## Componentes del Sistema

### 1. EditSessionModal
**Ubicación**: `src/components/petty-cash/EditSessionModal.tsx`

**Funcionalidades**:
- Formulario de edición con validaciones
- Información de la sesión visible
- Manejo de errores y estados de carga
- Actualización automática de la vista

**Características**:
```typescript
interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  session: CashSessionData;
}
```

### 2. DeleteSessionModal
**Ubicación**: `src/components/petty-cash/DeleteSessionModal.tsx`

**Funcionalidades**:
- Confirmación de eliminación
- Información detallada de la sesión
- Lista de restricciones visibles
- Validaciones de seguridad

**Características**:
```typescript
interface DeleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  session: CashSessionData;
}
```

### 3. SessionActions
**Ubicación**: `src/components/petty-cash/SessionActions.tsx`

**Funcionalidades**:
- Botones de acción contextuales
- Control de permisos automático
- Integración con modales
- Navegación a detalles

## Acciones del Servidor

### updateCashSession
**Ubicación**: `src/actions/configuration/petty-cash-actions.ts`

**Funcionalidades**:
- Validación de permisos
- Verificación de estado de sesión
- Actualización segura de datos
- Revalidación de rutas

```typescript
export async function updateCashSession(formData: FormData) {
  // Validaciones de seguridad
  // Actualización de datos
  // Revalidación de rutas
}
```

### deleteCashSession
**Ubicación**: `src/actions/configuration/petty-cash-actions.ts`

**Funcionalidades**:
- Verificación de dependencias
- Validación de estado
- Eliminación segura
- Revalidación automática

```typescript
export async function deleteCashSession(formData: FormData) {
  // Verificación de transacciones asociadas
  // Validación de estado
  // Eliminación segura
}
```

## Flujo de Trabajo

### Edición de Sesión
1. **Acceso**: Administrador hace clic en "✏️ Editar"
2. **Validación**: Sistema verifica permisos y estado
3. **Formulario**: Modal con datos actuales de la sesión
4. **Edición**: Usuario modifica campos permitidos
5. **Validación**: Sistema valida cambios
6. **Guardado**: Actualización en base de datos
7. **Actualización**: Vista se actualiza automáticamente

### Eliminación de Sesión
1. **Acceso**: Administrador hace clic en "🗑️ Eliminar"
2. **Validación**: Sistema verifica permisos y restricciones
3. **Confirmación**: Modal con información de la sesión
4. **Verificación**: Sistema valida que no hay dependencias
5. **Eliminación**: Sesión se elimina de la base de datos
6. **Actualización**: Vista se actualiza automáticamente

## Seguridad y Validaciones

### Control de Acceso
```typescript
const isAdmin = currentUser.role === 'SUPER_USER' || currentUser.role === 'ADMINISTRADOR';
const canEdit = isAdmin && session.status !== 'CLOSED';
const canDelete = isAdmin && session.status !== 'CLOSED';
```

### Validaciones de Estado
- **Sesiones Cerradas**: No editables ni eliminables
- **Sesiones con Transacciones**: No eliminables
- **Sesiones con Cierre**: No eliminables

### Protección de Datos
- Verificación de dependencias antes de eliminar
- Validación de permisos en cada acción
- Confirmación obligatoria para eliminación
- Logs de auditoría automáticos

## Interfaz de Usuario

### Botones de Acción
- **👁️ Ver**: Acceso a detalles de sesión (todos los usuarios)
- **✏️ Editar**: Edición de sesión (solo administradores)
- **🗑️ Eliminar**: Eliminación de sesión (solo administradores)

### Estados Visuales
- **Habilitado**: Botón visible y funcional
- **Deshabilitado**: Botón oculto o no disponible
- **Cargando**: Estado de procesamiento
- **Error**: Mensaje de error visible

### Responsive Design
- **Desktop**: Botones en línea horizontal
- **Móvil**: Botones apilados verticalmente
- **Tablet**: Adaptación automática

## Integración con el Sistema

### Navegación
- Integración completa con el menú horizontal
- Navegación entre listado y detalles
- Actualización automática de vistas

### Permisos
- Control granular de acceso
- Validación en frontend y backend
- Mensajes de error informativos

### Auditoría
- Logs de todas las acciones administrativas
- Trazabilidad de cambios
- Historial de modificaciones

## Casos de Uso

### Caso 1: Corrección de Monto Inicial
**Escenario**: Administrador necesita corregir el monto inicial de una sesión abierta
**Proceso**: 
1. Acceder al listado de sesiones
2. Hacer clic en "✏️ Editar"
3. Modificar el monto inicial
4. Guardar cambios

### Caso 2: Suspensión de Sesión
**Escenario**: Administrador necesita suspender una sesión problemática
**Proceso**:
1. Acceder al listado de sesiones
2. Hacer clic en "✏️ Editar"
3. Cambiar estado a "Suspendida"
4. Agregar notas explicativas
5. Guardar cambios

### Caso 3: Eliminación de Sesión Vacía
**Escenario**: Administrador necesita eliminar una sesión sin transacciones
**Proceso**:
1. Acceder al listado de sesiones
2. Hacer clic en "🗑️ Eliminar"
3. Revisar información de confirmación
4. Confirmar eliminación

## Mantenimiento y Soporte

### Monitoreo
- Logs de acciones administrativas
- Alertas de intentos de acceso no autorizado
- Métricas de uso de funcionalidades

### Backup y Recuperación
- Backup automático antes de eliminaciones
- Posibilidad de recuperación de sesiones eliminadas
- Historial de cambios para auditoría

### Actualizaciones
- Compatibilidad con futuras versiones
- Migración automática de datos
- Preservación de funcionalidades existentes 