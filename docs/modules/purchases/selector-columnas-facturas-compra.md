# ✅ Selector de Columnas Visibles - Facturas de Compra

## 📋 Descripción

Se ha implementado exitosamente un selector de columnas visibles para el listado de facturas de compra, similar al implementado en productos. Esta funcionalidad permite a los usuarios personalizar qué columnas quieren ver en la tabla y recuerda sus preferencias.

## 🎯 Funcionalidades Implementadas

### **1. Selector de Columnas**
- **Ubicación**: Botón "Columnas" en el header de la tabla
- **Funcionalidad**: Permite mostrar/ocultar columnas específicas
- **Persistencia**: Guarda la selección en `localStorage`
- **Columnas disponibles**:
  - Número Interno
  - Numero Factura Proveedor
  - Proveedor
  - Total
  - Subtotal
  - IVA
  - Estado
  - Fecha Creación
  - Fecha Vencimiento
  - Bodega
  - Notas

### **2. Control de Acciones**
- **Botón "Ocultar acciones"**: Permite ocultar/mostrar la columna de acciones
- **Icono dinámico**: Cambia entre ojo abierto y cerrado
- **Funcionalidad**: Mejora la experiencia cuando no se necesitan las acciones

### **3. Persistencia de Configuración**
- **localStorage**: Guarda la configuración en `purchaseInvoiceTableColumns`
- **Compatibilidad**: Agrega automáticamente nuevas columnas si se añaden
- **Recuperación**: Restaura la configuración al cargar la página

## 📁 Archivos Creados/Modificados

### **🆕 Nuevo Componente**
```
src/components/purchases/PurchaseInvoiceTableWithSelection.tsx
├── ✅ Selector de columnas con persistencia
├── ✅ Control de visibilidad de acciones
├── ✅ Interfaz completa de tabla
├── ✅ Manejo de estados y filtros
└── ✅ Integración con localStorage
```

### **🔄 Página Actualizada**
```
src/app/dashboard/purchases/invoices/page.tsx
├── ✅ Simplificada para usar el nuevo componente
├── ✅ Mantiene la funcionalidad existente
└── ✅ Mejor organización del código
```

## 🎨 Interfaz de Usuario

### **Header con Controles**
```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" size="sm" onClick={() => setShowActions(!showActions)}>
    {showActions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    {showActions ? 'Ocultar acciones' : 'Mostrar acciones'}
  </Button>
  
  <div className="relative">
    <Button variant="outline" size="sm" onClick={() => setColumnSelectorOpen(!columnSelectorOpen)}>
      <Settings className="h-4 w-4" />
      Columnas
    </Button>
    {/* Popover con opciones de columnas */}
  </div>
</div>
```

### **Selector de Columnas**
```tsx
{COLUMN_OPTIONS.map((column) => (
  <label key={column.key} className="flex items-center space-x-2 cursor-pointer">
    <input
      type="checkbox"
      checked={visibleColumns.includes(column.key)}
      onChange={() => toggleColumn(column.key)}
      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <span className="text-sm text-gray-700">{column.label}</span>
  </label>
))}
```

## 🔧 Funcionalidades Técnicas

### **1. Gestión de Estado**
```typescript
const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
  // Cargar configuración guardada o usar valores por defecto
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('purchaseInvoiceTableColumns');
    if (saved) {
      try {
        const savedColumns = JSON.parse(saved);
        // Verificar nuevas columnas y agregarlas automáticamente
        const missingColumns = allColumnKeys.filter(key => !savedColumns.includes(key));
        if (missingColumns.length > 0) {
          const updatedColumns = [...savedColumns, ...missingColumns];
          localStorage.setItem('purchaseInvoiceTableColumns', JSON.stringify(updatedColumns));
          return updatedColumns;
        }
        return savedColumns;
      } catch (error) {
        console.error('Error parsing saved columns:', error);
        return COLUMN_OPTIONS.map(c => c.key);
      }
    }
  }
  return COLUMN_OPTIONS.map(c => c.key);
});
```

### **2. Toggle de Columnas**
```typescript
const toggleColumn = (key: string) => {
  setVisibleColumns(prev => {
    const updated = prev.includes(key)
      ? prev.filter(k => k !== key)
      : [...prev, key];
    if (typeof window !== 'undefined') {
      localStorage.setItem('purchaseInvoiceTableColumns', JSON.stringify(updated));
    }
    return updated;
  });
};
```

### **3. Renderizado Condicional**
```tsx
{visibleColumns.includes('number') && (
  <TableHead>Número Interno</TableHead>
)}
{visibleColumns.includes('supplier_name') && (
  <TableHead>Proveedor</TableHead>
)}
// ... más columnas
```

## 📊 Columnas Disponibles

### **Columnas Principales**
1. **Número Interno** - ID interno de la factura
2. **Numero Factura Proveedor** - Número de factura del proveedor
3. **Proveedor** - Nombre del proveedor
4. **Total** - Monto total de la factura
5. **Subtotal** - Subtotal antes de impuestos
6. **IVA** - Monto de impuestos
7. **Estado** - Estado actual de la factura
8. **Fecha Creación** - Fecha de creación
9. **Fecha Vencimiento** - Fecha de vencimiento
10. **Bodega** - Bodega asociada
11. **Notas** - Notas adicionales

### **Columna de Acciones**
- **Ver** - Ver detalles de la factura
- **Editar** - Editar la factura
- **Eliminar** - Eliminar la factura

## 🎯 Beneficios de la Implementación

### **✅ Para el Usuario**
- **Personalización**: Cada usuario puede configurar su vista preferida
- **Persistencia**: La configuración se mantiene entre sesiones
- **Flexibilidad**: Puede ocultar columnas que no necesita
- **Mejor UX**: Interfaz más limpia y organizada

### **✅ Para el Sistema**
- **Escalabilidad**: Fácil agregar nuevas columnas
- **Compatibilidad**: Maneja automáticamente nuevas columnas
- **Performance**: Solo renderiza columnas visibles
- **Mantenibilidad**: Código organizado y reutilizable

## 🔄 Flujo de Funcionamiento

### **1. Carga Inicial**
1. **Verificar localStorage** - Buscar configuración guardada
2. **Validar columnas** - Verificar si hay nuevas columnas
3. **Actualizar configuración** - Agregar nuevas columnas automáticamente
4. **Aplicar configuración** - Renderizar solo columnas seleccionadas

### **2. Interacción del Usuario**
1. **Click en "Columnas"** - Abrir selector
2. **Toggle columnas** - Marcar/desmarcar checkboxes
3. **Guardar configuración** - Actualizar localStorage
4. **Re-renderizar tabla** - Aplicar cambios inmediatamente

### **3. Control de Acciones**
1. **Click en "Ocultar acciones"** - Toggle visibilidad
2. **Actualizar estado** - Cambiar `showActions`
3. **Re-renderizar** - Mostrar/ocultar columna de acciones

## 🎨 Estilos y Diseño

### **Selector de Columnas**
- **Posición**: Popover absoluto desde el botón
- **Estilo**: Fondo blanco con sombra y borde
- **Interacción**: Checkboxes con hover effects
- **Responsive**: Se adapta al contenido

### **Botones de Control**
- **Iconos**: Eye/EyeOff para acciones, Settings para columnas
- **Estados**: Outline variant para mejor visibilidad
- **Hover**: Efectos de hover consistentes

### **Tabla Responsive**
- **Columnas dinámicas**: Solo muestra columnas seleccionadas
- **Ancho adaptativo**: Se ajusta al contenido
- **Scroll horizontal**: Si es necesario

## 🔮 Próximos Pasos

### **Mejoras Futuras**
- [ ] **Filtros avanzados** - Integrar con el selector de columnas
- [ ] **Exportación** - Exportar solo columnas visibles
- [ ] **Vistas predefinidas** - Templates de configuración
- [ ] **Sincronización** - Compartir configuración entre usuarios
- [ ] **Animaciones** - Transiciones suaves al cambiar columnas

### **Optimizaciones**
- [ ] **Lazy loading** - Cargar datos solo cuando sea necesario
- [ ] **Virtualización** - Para listas muy largas
- [ ] **Caching** - Cachear configuraciones frecuentes
- [ ] **Analytics** - Trackear uso de columnas

---

**Estado:** ✅ **IMPLEMENTACIÓN COMPLETA**  
**Fecha:** 2025-01-26  
**Impacto:** Mejora significativa en la experiencia del usuario al personalizar la vista de facturas de compra 