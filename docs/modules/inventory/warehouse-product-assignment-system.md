# Sistema de Asignación de Productos a Bodegas

## Descripción General

El sistema de asignación de productos a bodegas permite gestionar de manera eficiente la relación muchos a muchos entre productos y bodegas. Un producto puede estar en múltiples bodegas con diferentes cantidades de stock, y una bodega puede contener múltiples productos.

## Características Principales

### ✅ Funcionalidades Implementadas

1. **Asignación Individual**
   - Asignar un producto a una bodega específica
   - Definir cantidad inicial, stock mínimo y máximo
   - Evitar duplicados automáticamente

2. **Asignación Múltiple**
   - Asignar un producto a varias bodegas simultáneamente
   - Configurar diferentes parámetros por bodega
   - Procesamiento en lote con reporte de resultados

3. **Asignación Masiva**
   - Agregar múltiples productos a una bodega
   - Búsqueda y filtrado de productos disponibles
   - Configuración individual de stock por producto

4. **Gestión de Stock**
   - Editar cantidades, mínimos y máximos
   - Visualización de estado de stock (OK, Bajo, Sin Stock)
   - Actualización en tiempo real

5. **Remoción de Productos**
   - Remover productos de bodegas específicas
   - Confirmación de seguridad
   - Mantener integridad de datos

## Estructura de Base de Datos

### Tabla Principal: `Warehouse_Product`

```sql
CREATE TABLE "Warehouse_Product" (
  "id" BIGSERIAL PRIMARY KEY,
  "warehouseId" BIGINT NOT NULL REFERENCES "Warehouse"("id"),
  "productId" BIGINT NOT NULL REFERENCES "Product"("id"),
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "minStock" INTEGER DEFAULT 0,
  "maxStock" INTEGER,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("warehouseId", "productId")
);
```

### Relaciones
- **Producto → Bodegas**: Un producto puede estar en múltiples bodegas
- **Bodega → Productos**: Una bodega puede contener múltiples productos
- **Stock por Bodega**: Cada relación tiene su propio stock (quantity, minStock, maxStock)

## Componentes del Sistema

### 1. Funciones de Acción (`warehouse-actions.ts`)

#### Asignación Individual
```typescript
assignProductToWarehouse(
  productId: number, 
  warehouseId: number, 
  options: { quantity?: number; minStock?: number; maxStock?: number }
)
```

#### Asignación Múltiple
```typescript
assignProductToMultipleWarehouses(
  productId: number,
  assignments: Array<{
    warehouseId: number;
    quantity?: number;
    minStock?: number;
    maxStock?: number;
  }>
)
```

#### Asignación Masiva
```typescript
bulkAssignProductsToWarehouse(
  warehouseId: number,
  assignments: Array<{
    productId: number;
    quantity?: number;
    minStock?: number;
    maxStock?: number;
  }>
)
```

### 2. Acciones para Formularios (`warehouse-assignment-actions.ts`)

Todas las funciones anteriores tienen su versión para formularios que:
- Reciben `FormData`
- Manejan validaciones
- Retornan resultados estructurados
- Revalidan páginas automáticamente

### 3. Componentes de UI

#### `WarehouseProductManager.tsx`
- **Propósito**: Gestión completa de productos en una bodega
- **Funcionalidades**:
  - Ver productos asignados con estado de stock
  - Editar cantidades y parámetros de stock
  - Remover productos de la bodega
  - Agregar productos nuevos (asignación masiva)
  - Búsqueda de productos disponibles

#### `ProductWarehouseList.tsx`
- **Propósito**: Mostrar bodegas asignadas a un producto
- **Funcionalidades**:
  - Lista de bodegas donde está el producto
  - Edición de stock por bodega
  - Remoción de bodegas específicas

## Flujo de Trabajo

### Escenario 1: Asignar Producto a Bodega

1. **Desde la ficha del producto**:
   - Usar `ProductWarehouseAssignment` para asignar a múltiples bodegas
   - Configurar stock inicial, mínimos y máximos por bodega

2. **Desde la ficha de la bodega**:
   - Usar `WarehouseProductManager` para agregar productos
   - Buscar productos no asignados
   - Configurar parámetros de stock

### Escenario 2: Gestión de Stock

1. **Edición individual**:
   - Hacer clic en "Editar" en cualquier producto
   - Modificar cantidad, mínimo o máximo
   - Guardar cambios

2. **Visualización de estado**:
   - **Stock OK**: Cantidad ≥ mínimo
   - **Stock Bajo**: Cantidad < mínimo
   - **Sin Stock**: Cantidad = 0

### Escenario 3: Remoción de Productos

1. **Confirmación de seguridad**
2. **Eliminación de la relación** (no del producto)
3. **Actualización automática de la interfaz**

## Integración en Páginas

### Página de Producto (`/dashboard/configuration/products/edit/[id]`)

```tsx
import ProductWarehouseList from '@/components/inventory/ProductWarehouseList';
import ProductWarehouseAssignment from '@/components/inventory/ProductWarehouseAssignment';

// En el componente:
const productWarehouses = await getProductWarehouses(productId);

return (
  <div>
    <ProductWarehouseList 
      productId={productId}
      productName={product.name}
      warehouses={productWarehouses}
      onUpdate={refreshData}
    />
    <ProductWarehouseAssignment
      productId={productId}
      productName={product.name}
      currentWarehouses={productWarehouses}
      onSuccess={refreshData}
    />
  </div>
);
```

### Página de Bodega (`/dashboard/configuration/inventory/warehouses/[id]/products`)

```tsx
import WarehouseProductManager from '@/components/inventory/WarehouseProductManager';

// En el componente:
const { data: warehouseProducts } = await getProductsByWarehouse(warehouseId);

return (
  <WarehouseProductManager
    warehouseId={warehouseId}
    warehouseName={warehouse.name}
    assignedProducts={warehouseProducts}
    onUpdate={refreshData}
  />
);
```

## Validaciones y Reglas de Negocio

### 1. Evitar Duplicados
- El sistema verifica si ya existe la relación `productId + warehouseId`
- Si existe, actualiza los parámetros en lugar de crear duplicado

### 2. Validaciones de Stock
- **Cantidad**: Debe ser ≥ 0
- **Stock mínimo**: Debe ser ≥ 0
- **Stock máximo**: Debe ser ≥ stock mínimo (si se especifica)

### 3. Compatibilidad de Tipos
- Los productos tipo "SERVICIO" no requieren bodega
- Los productos tipo "INVENTARIO" solo pueden ir en bodegas tipo "INVENTARIO"
- Los productos tipo "CONSUMIBLE" y "ALMACENABLE" pueden ir en bodegas tipo "CONSUMIBLE" y "ALMACENAMIENTO"

## Mensajes y Feedback

### Tipos de Mensaje
- **Éxito**: Operación completada correctamente
- **Error**: Problema durante la operación
- **Advertencia**: Información importante para el usuario

### Ejemplos de Mensajes
- ✅ "Producto asignado correctamente"
- ✅ "Asignación completada. 3 exitosas, 0 errores"
- ❌ "El producto ya está asignado a esta bodega"
- ❌ "Debe seleccionar al menos una bodega"

## Optimizaciones y Rendimiento

### 1. Consultas Optimizadas
- Uso de índices en `warehouseId` y `productId`
- Consultas con `count` para estadísticas
- Paginación para listas grandes

### 2. Revalidación Inteligente
- Solo se revalidan las páginas afectadas
- Uso de `revalidatePath` específico

### 3. Interfaz Responsiva
- Componentes adaptables a diferentes tamaños de pantalla
- Carga progresiva de datos
- Estados de loading para mejor UX

## Casos de Uso Comunes

### 1. Configuración Inicial
```typescript
// Asignar producto a bodega principal
await assignProductToWarehouse(productId, mainWarehouseId, {
  quantity: 100,
  minStock: 10,
  maxStock: 500
});
```

### 2. Distribución en Múltiples Bodegas
```typescript
// Producto disponible en varias ubicaciones
await assignProductToMultipleWarehouses(productId, [
  { warehouseId: 1, quantity: 50, minStock: 5, maxStock: 200 },
  { warehouseId: 2, quantity: 30, minStock: 3, maxStock: 150 },
  { warehouseId: 3, quantity: 20, minStock: 2, maxStock: 100 }
]);
```

### 3. Gestión de Stock Bajo
```typescript
// Obtener productos con stock bajo
const lowStockProducts = await getLowStockProducts(10);
// Mostrar alertas y sugerir reabastecimiento
```

## Próximas Mejoras

### Funcionalidades Planificadas
1. **Movimientos de Stock**: Historial de entradas y salidas
2. **Alertas Automáticas**: Notificaciones de stock bajo
3. **Reportes Avanzados**: Análisis de rotación y valor de inventario
4. **Importación Masiva**: Carga desde Excel/CSV
5. **Transferencias**: Mover stock entre bodegas

### Optimizaciones Técnicas
1. **Caché Inteligente**: Reducir consultas a la base de datos
2. **WebSockets**: Actualizaciones en tiempo real
3. **Búsqueda Avanzada**: Filtros por categoría, proveedor, etc.
4. **Exportación**: Reportes en PDF/Excel

## Conclusión

El sistema de asignación de productos a bodegas proporciona una solución completa y flexible para la gestión de inventario. Permite manejar escenarios complejos como productos en múltiples ubicaciones, diferentes niveles de stock por bodega, y una interfaz intuitiva para todas las operaciones.

La arquitectura modular facilita el mantenimiento y la extensión del sistema, mientras que las validaciones y reglas de negocio aseguran la integridad de los datos. 