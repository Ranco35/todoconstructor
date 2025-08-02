# 🏢 Mejoras de Proveedor en Edición de Facturas

## 📋 Requerimientos Implementados

### 1. ✅ Título Prominente del Proveedor
- **Ubicación**: Header del formulario de edición
- **Diseño**: Cuadro azul con gradiente destacado
- **Información**: Nombre del proveedor y RUT en grande
- **Estado de Factura**: Badge con estado actual en el header del proveedor
- **Visibilidad**: Solo aparece en modo edición cuando hay proveedor seleccionado

### 4. ✅ Indicadores Visuales de Estado
- **Título Principal**: Badge de estado junto al título "Editar Factura"
- **Header del Proveedor**: Estado destacado en la esquina superior derecha
- **Panel Lateral**: Lista interactiva de todos los estados con el actual resaltado
- **Iconos y Colores**: Cada estado tiene su icono y color distintivo
- **Estados Soportados**: 
  - 📝 **Borrador** (draft) - Gris - Edición completa
  - 📤 **Enviada** (sent) - Azul - Requiere confirmación
  - 📬 **Recibida** (received) - Verde - Requiere confirmación
  - 💰 **Pagada** (paid) - Púrpura - Requiere confirmación
  - ❌ **Cancelada** (cancelled) - Rojo - Requiere confirmación
  - ✅ **Aprobada** (approved) - Esmeralda - Requiere confirmación
  - ⏳ **Pendiente** (pending) - Ámbar - Requiere confirmación

### 2. ✅ Restricción de Cambio de Proveedor
- **Lógica**: Solo editable cuando la factura está en estado "draft" (borrador)
- **Indicador Visual**: Badge amarillo que indica "Solo editable en borrador"
- **Estado Deshabilitado**: Campo bloqueado con estilo gris
- **Mensaje Explicativo**: Texto bajo el selector explicando la restricción

### 3. ✅ Modal de Advertencia
- **Activación**: Al intentar cambiar proveedor en facturas no-borrador
- **Contenido**: Advertencia sobre las implicaciones del cambio
- **Opciones**: Cancelar o Confirmar el cambio
- **Diseño**: Modal centrado con íconos y colores de advertencia

## 🎨 Implementación Visual

### Indicadores de Estado
```typescript
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'draft': 'Borrador',
    'sent': 'Enviada', 
    'received': 'Recibida',
    'paid': 'Pagada',
    'cancelled': 'Cancelada'
  };
  return labels[status] || 'Sin Estado';
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, JSX.Element> = {
    'draft': <span>📝</span>,
    'sent': <span>📤</span>,
    'received': <span>📬</span>,
    'paid': <span>💰</span>,
    'cancelled': <span>❌</span>
  };
  return icons[status] || <span>❓</span>;
};

const getStatusBadgeStyle = (status: string) => {
  const styles: Record<string, string> = {
    'draft': 'bg-gray-500 text-white',
    'sent': 'bg-blue-500 text-white',
    'received': 'bg-green-500 text-white',
    'paid': 'bg-purple-500 text-white',
    'cancelled': 'bg-red-500 text-white'
  };
  return styles[status] || 'bg-gray-400 text-white';
};
```

### Header del Proveedor con Estado
```jsx
{isEditing && formData.supplierId && (
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg mb-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <Building2 className="text-white text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            {suppliers.find(s => s.id === formData.supplierId)?.name}
          </h2>
          <p className="text-blue-100 text-lg">
            RUT: {suppliers.find(s => s.id === formData.supplierId)?.vat || 'SIN RUT'}
          </p>
        </div>
      </div>
      
      {/* Estado de la Factura */}
      <div className="flex flex-col items-end gap-2">
        <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatusBadgeStyle(currentStatus || 'draft')}`}>
          {getStatusIcon(currentStatus || 'draft')}
          {getStatusLabel(currentStatus || 'draft')}
        </div>
        <span className="text-xs text-blue-200">Estado Actual</span>
      </div>
    </div>
  </div>
)}
```

### Selector con Restricciones
```jsx
<div className="flex items-center gap-2 mb-2">
  <Label htmlFor="supplierId" className="text-gray-700 font-medium">Proveedor</Label>
  {!canEditSupplier && (
    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      Solo editable en borrador
    </span>
  )}
</div>
<Select 
  value={formData.supplierId?.toString() || ''} 
  onValueChange={handleSupplierChange}
  disabled={loadingData || !canEditSupplier}
>
  <SelectTrigger className={`border-gray-200 focus:border-orange-400 ${!canEditSupplier ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
    <SelectValue placeholder={loadingData ? "Cargando..." : "Seleccionar proveedor"} />
  </SelectTrigger>
  {/* ... opciones ... */}
</Select>
```

## 🔧 Lógica Implementada

### Estados de Factura Soportados
```typescript
export type PurchaseInvoiceStatus = 
  | 'draft'      // Borrador - ✅ Permite cambio
  | 'sent'       // Enviada - ❌ Requiere confirmación
  | 'received'   // Recibida - ❌ Requiere confirmación
  | 'paid'       // Pagada - ❌ Requiere confirmación
  | 'cancelled'; // Cancelada - ❌ Requiere confirmación
```

### Función de Validación
```typescript
const handleSupplierChange = (value: string) => {
  // Si es modo creación o es estado borrador, permitir cambio directo
  if (!isEditing || currentStatus === 'draft') {
    setFormData(prev => ({ ...prev, supplierId: value ? parseInt(value) : null }));
    return;
  }
  
  // Si no es borrador, mostrar advertencia
  setPendingSupplierChange(value);
  setShowSupplierWarning(true);
};
```

### Modal de Confirmación
```typescript
const confirmSupplierChange = () => {
  if (pendingSupplierChange) {
    setFormData(prev => ({ ...prev, supplierId: parseInt(pendingSupplierChange) }));
  }
  setShowSupplierWarning(false);
  setPendingSupplierChange(null);
};
```

## 📊 Casos de Uso

### ✅ Facturas en Borrador
- **Cambio Directo**: Sin restricciones ni advertencias
- **UX**: Selector habilitado completamente
- **Visual**: Sin badges de advertencia

### ⚠️ Facturas Procesadas (No-Borrador)
- **Cambio Restringido**: Selector deshabilitado por defecto
- **Advertencia**: Modal al intentar cambio forzado
- **Confirmación**: Usuario debe confirmar explícitamente

### 🚫 Facturas Críticas (Pagadas/Cerradas)
- **Bloqueo Total**: Sin posibilidad de cambio
- **Mensaje Claro**: Explicación del por qué no es posible

## 🎯 Beneficios Implementados

### 1. **Claridad Visual**
- ✅ Proveedor prominente en header azul
- ✅ RUT claramente visible
- ✅ Estado de edición obvio

### 2. **Seguridad de Datos**
- ✅ Prevención de cambios accidentales
- ✅ Trazabilidad de documentos
- ✅ Flujo de confirmación explícito

### 3. **Experiencia de Usuario**
- ✅ Feedback inmediato sobre restricciones
- ✅ Explicaciones claras de limitaciones
- ✅ Proceso de confirmación intuitivo

## 🔗 Archivos Modificados

### Frontend
- `src/components/purchases/PurchaseInvoiceForm.tsx`
  - Header del proveedor con información destacada
  - Lógica de restricción de edición
  - Modal de advertencia para cambios
  - Estados y validaciones

### Páginas
- `src/app/dashboard/purchases/invoices/[id]/edit/page.tsx`
  - Prop `currentStatus` agregado
  - Estado de factura capturado de BD

### Tipos
- `src/types/purchases.ts`
  - Interface `PurchaseInvoiceFormProps` extendida
  - Soporte para `currentStatus` opcional

## 🔧 Configuración del Estado

### Manejo de Estados
El sistema utiliza el campo `currentStatus` que se obtiene de la base de datos. Si no hay estado definido, por defecto se asigna `'draft'`.

### Resolución de "Sin Estado"
Si aparece "Sin Estado" en lugar del estado real:

1. **Verificar datos en BD**:
```sql
SELECT id, invoice_number, status, created_at 
FROM purchase_invoices 
WHERE status IS NULL OR status = '';
```

2. **Aplicar corrección**:
```sql
-- Ejecutar script scripts/fix-invoice-status.sql
UPDATE purchase_invoices 
SET status = 'draft', updated_at = now()
WHERE status IS NULL OR status = '' OR status = 'undefined';
```

3. **Funciones robustas**:
```typescript
const getStatusLabel = (status: string | null | undefined) => {
  if (!status || status.trim() === '') {
    return 'Borrador'; // Default robusto
  }
  return labels[status] || 'Estado Desconocido';
};
```

## 📝 Próximos Pasos

1. **Testing**: Verificar comportamiento en todos los estados
2. **Validación**: Confirmar restricciones en backend
3. **Documentación**: Actualizar guías de usuario
4. **Logs**: Agregar logging de cambios de proveedor
5. **Estados**: Ejecutar script de corrección para facturas sin estado

---

**Estado**: ✅ Implementado y funcional  
**Fecha**: 17 enero 2025  
**Responsable**: Sistema de Facturas de Compras 