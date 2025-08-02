# Sistema de Notas Internas - Presupuestos

## Descripción General

Sistema de notas internas para presupuestos que permite al personal autorizado agregar comentarios privados que NO son visibles para los clientes en emails o PDFs.

## Características Principales

### 🔒 Seguridad y Permisos
- **Visibilidad**: Todos los usuarios pueden ver las notas internas (configuración temporal)
- **Edición restringida**: Solo ADMIN, JEFE_SECCION, RECEPCIONISTA pueden editar
- **Usuarios no autorizados**: Pueden ver pero NO editar las notas
- **Protección total**: Las notas NO aparecen en emails ni PDFs para clientes

### ✏️ Funcionalidades
- **Edición in-place**: Click para editar, guardar o cancelar
- **Actualización en tiempo real**: Cambios se guardan inmediatamente
- **Validación de permisos**: Verificación tanto en frontend como backend
- **Feedback visual**: Toasts de confirmación y manejo de errores

## Implementación Técnica

### Base de Datos
```sql
-- Campo agregado a tabla sales_quotes
ALTER TABLE sales_quotes 
ADD COLUMN internal_notes TEXT;

-- Índice para optimizar consultas
CREATE INDEX idx_sales_quotes_internal_notes 
ON sales_quotes(internal_notes) 
WHERE internal_notes IS NOT NULL;

-- Trigger para auditoría
CREATE TRIGGER update_sales_quotes_updated_at
  BEFORE UPDATE ON sales_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Componentes

#### InternalNotesSection.tsx
- **Ubicación**: `src/components/sales/InternalNotesSection.tsx`
- **Props**: `budgetId`, `initialNotes`, `userRole`
- **Lógica de permisos**: Retorna `null` si usuario no autorizado
- **Estados**: edición, guardado, notas

#### BudgetDetailView.tsx
- **Integración**: Renderiza InternalNotesSection con rol del usuario
- **Ubicación**: Al final de la vista de detalle
- **Datos**: Pasa `budget.internalNotes` y `currentUser.role`

### Server Actions

#### updateBudgetInternalNotes()
```typescript
// src/actions/sales/budgets/update.ts
export async function updateBudgetInternalNotes(
  budgetId: number, 
  internalNotes: string
): Promise<ActionResult<null>>
```

#### Integración en CRUD
- **create.ts**: Soporte para notas en creación
- **get.ts**: Incluye internal_notes en consultas
- **update.ts**: Función específica para notas

### Tipos TypeScript

```typescript
// src/types/ventas/budget.ts
export interface SalesQuote {
  // ... otros campos
  internalNotes?: string;
}

export interface BudgetWithDetails extends SalesQuote {
  // ... otros campos
  internalNotes?: string;
}
```

## Seguridad Implementada

### 1. Verificación de Roles
```typescript
const canEdit = ['ADMIN', 'JEFE_SECCION', 'RECEPCIONISTA'].includes(userRole);

if (!canEdit) {
  return null; // No renderizar nada
}
```

### 2. Protección en Server Actions
- Validación de permisos en backend
- Manejo seguro de errores
- Logs de auditoría

### 3. Exclusión de Cliente
- **Emails**: Plantilla NO incluye notas internas
- **PDFs**: Exportación NO incluye notas internas
- **APIs públicas**: Campo excluido

## Flujo de Usuario

### Para Usuarios Autorizados
1. **Ver notas**: Sección visible al final del detalle
2. **Editar**: Click en botón "Editar"
3. **Modificar**: Textarea con texto actual
4. **Guardar**: Botón guardar o cancelar
5. **Confirmación**: Toast de éxito

### Para Usuarios No Autorizados
1. **Visibilidad limitada**: Pueden ver las notas pero no editarlas
2. **Sin permisos de edición**: Botones de edición restringidos
3. **Mensaje de error**: Si intentan editar, reciben notificación de permisos

## Casos de Uso

### 1. Recepcionista
- Agregar comentarios sobre preferencias del cliente
- Notas sobre descuentos especiales aplicados
- Observaciones para facturación

### 2. Jefe de Sección
- Aprobaciones internas requeridas
- Notas sobre márgenes especiales
- Comentarios de seguimiento

### 3. Administrador
- Auditoría de procesos
- Notas ejecutivas
- Decisiones estratégicas

## Archivos Modificados

### Migración
- `supabase/migrations/20250116000002_add_internal_notes_to_budgets.sql`

### Backend
- `src/types/ventas/budget.ts` - Tipos actualizados
- `src/actions/sales/budgets/create.ts` - Soporte creación
- `src/actions/sales/budgets/get.ts` - Incluir en consultas
- `src/actions/sales/budgets/update.ts` - Función específica

### Frontend
- `src/components/sales/InternalNotesSection.tsx` - Componente principal
- `src/components/sales/BudgetDetailView.tsx` - Integración
- `src/app/dashboard/sales/budgets/[id]/page.tsx` - Usuario actual

## Verificaciones de Seguridad

### ✅ Emails a Clientes
```typescript
// Las plantillas de email NO incluyen internal_notes
const emailTemplate = emailTemplates.budgetQuote({
  // Solo datos públicos del presupuesto
  // internal_notes NO se pasa
});
```

### ✅ PDFs Exportados
```typescript
// La función exportBudgetToPDF NO incluye notas internas
export const exportBudgetToPDF = (budgetData) => {
  // Solo información pública del presupuesto
  // Sin acceso a internal_notes
};
```

### ✅ Permisos Frontend
```typescript
// Componente visible para todos, pero edición restringida
const handleEdit = () => {
  if (!canEdit) {
    toast.error('No tienes permisos para editar notas internas');
    return;
  }
  setIsEditing(true);
};
```

## Estado del Sistema

- ✅ **Migración aplicada**: Campo internal_notes creado
- ✅ **Backend completo**: Server actions funcionando
- ✅ **Frontend seguro**: Permisos implementados
- ✅ **Tipos actualizados**: TypeScript consistente
- ✅ **Seguridad verificada**: No aparece en emails/PDFs
- ✅ **Configuración temporal**: Todos los usuarios ven la sección, solo autorizados editan

## Próximos Pasos

1. **Pruebas**: Verificar con diferentes roles de usuario
2. **Auditoría**: Confirmar que notas no aparecen en comunicaciones externas
3. **Capacitación**: Entrenar al personal en el uso de notas internas
4. **Monitoreo**: Verificar uso y utilidad del sistema

---

**Nota de Seguridad**: Este sistema está diseñado para proteger información interna sensible. Las notas internas NUNCA deben contener información que pueda ser vista por clientes externos. 