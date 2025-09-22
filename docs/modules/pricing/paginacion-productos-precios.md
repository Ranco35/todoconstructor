# 📄 Paginación en Gestión de Precios - Productos

## 📋 Resumen

Se ha implementado un sistema completo de paginación para el listado de productos en el módulo de gestión de precios, siguiendo el mismo patrón utilizado en el sistema de productos existente.

## 🚀 Funcionalidades Implementadas

### **1. Paginación Server-Side**
- **Página**: `src/app/dashboard/pricing/products/page.tsx`
- **Parámetros URL**: `?page=1&pageSize=20&search=term`
- **Server-side rendering**: Carga inicial optimizada
- **SEO friendly**: URLs con parámetros de búsqueda

### **2. Controles de Paginación**
- **Componente**: `PaginationControls` (reutilizado del sistema existente)
- **Navegación**: Botones Anterior/Siguiente
- **Selector de tamaño**: 10, 20, 50, 100 productos por página
- **Información**: "Mostrando X de Y productos"
- **URLs**: Navegación con parámetros en URL

### **3. Búsqueda Integrada**
- **Búsqueda en tiempo real**: Por nombre y SKU
- **Reset de paginación**: Vuelve a página 1 al buscar
- **Filtros activos**: Muestra información de búsqueda
- **Limpieza**: Botón para limpiar búsqueda

### **4. Estados y Performance**
- **Loading states**: Indicadores de carga
- **Error handling**: Manejo robusto de errores
- **Cache**: Reutilización de consultas
- **Optimización**: Consultas con `count: 'exact'`

## 🔧 Archivos Modificados

### **Backend - Acciones**
```typescript
// src/actions/pricing/simple-products.ts
export async function getSimpleProducts(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  success: boolean;
  data?: SimpleProduct[];
  error?: string;
  totalCount?: number;
  totalPages?: number;
}>
```

### **Frontend - Componente**
```typescript
// src/components/pricing/ProductPricingManager.tsx
interface ProductPricingManagerProps {
  onProductSelect?: (product: SimpleProduct) => void;
  initialPage?: number;
  initialPageSize?: number;
  initialSearch?: string;
}
```

### **Página Server-Side**
```typescript
// src/app/dashboard/pricing/products/page.tsx
export default async function ProductPricingPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const { page = '1', pageSize = '20', search } = searchParams || {};
  // ... implementación server-side
}
```

## 📊 Características Técnicas

### **Parámetros de Paginación**
- **Página por defecto**: 1
- **Tamaño por defecto**: 20 productos
- **Máximo por página**: 100 productos
- **Offset calculation**: `(page - 1) * pageSize`

### **Consulta Optimizada**
```sql
SELECT id, name, sku, costprice, saleprice, categoryid, supplierid
FROM Product
WHERE (name ILIKE '%search%' OR sku ILIKE '%search%')
ORDER BY name
LIMIT pageSize OFFSET (page - 1) * pageSize;
```

### **Información de Paginación**
- **Total de productos**: Contador exacto
- **Páginas totales**: `Math.ceil(totalCount / pageSize)`
- **Productos actuales**: Cantidad en página actual
- **Estado de carga**: Loading, error, success

## 🎯 Experiencia de Usuario

### **Navegación**
1. **URL directa**: `/dashboard/pricing/products?page=2&pageSize=50`
2. **Búsqueda**: `/dashboard/pricing/products?search=term&page=1`
3. **Combinado**: `/dashboard/pricing/products?page=3&pageSize=20&search=producto`

### **Controles Visuales**
- **Botones de navegación**: Anterior/Siguiente con estados disabled
- **Selector de tamaño**: Dropdown con opciones predefinidas
- **Información contextual**: "Página X de Y", "Mostrando Z productos"
- **Filtros activos**: Panel azul con información de búsqueda

### **Estados de Interfaz**
- **Carga inicial**: Spinner y mensaje "Cargando productos..."
- **Sin resultados**: Icono 📦 y mensaje "No se encontraron productos"
- **Con búsqueda**: Botón "Limpiar búsqueda"
- **Error**: Mensaje de error con botón "Probar conexión nuevamente"

## 🔄 Flujo de Funcionamiento

### **1. Carga Inicial**
```
Usuario visita /dashboard/pricing/products
↓
Server-side: Obtiene parámetros de URL
↓
Renderiza página con datos iniciales
↓
Client-side: Hidrata con funcionalidad interactiva
```

### **2. Navegación**
```
Usuario hace clic en "Siguiente"
↓
Router.push('/dashboard/pricing/products?page=2')
↓
Página se recarga con nueva URL
↓
useEffect detecta cambio de página
↓
loadProducts() ejecuta nueva consulta
```

### **3. Búsqueda**
```
Usuario escribe en campo de búsqueda
↓
handleSearchChange() ejecuta
↓
setSearch() actualiza estado
↓
setCurrentPage(1) resetea paginación
↓
useEffect detecta cambios
↓
Nueva consulta con filtros
```

## 📈 Performance y Optimizaciones

### **Consultas Eficientes**
- **Count exacto**: `{ count: 'exact' }` para totales precisos
- **Range queries**: `range(from, to)` para paginación
- **Índices**: Aprovecha índices existentes en `name` y `sku`
- **Límites**: Máximo 100 productos por página

### **Caching y Estado**
- **Server-side**: Datos iniciales en render
- **Client-side**: Estado local para navegación
- **URL sync**: Parámetros en URL para bookmarking
- **Debouncing**: Búsqueda en tiempo real optimizada

### **UX Optimizations**
- **Loading states**: Feedback visual inmediato
- **Error recovery**: Botones de reintento
- **Keyboard navigation**: Soporte completo
- **Mobile responsive**: Adaptado a dispositivos móviles

## 🎉 Resultado Final

El módulo de gestión de precios ahora incluye:

✅ **Paginación completa** como el sistema de productos existente
✅ **Búsqueda integrada** con reset automático de paginación  
✅ **Navegación por URL** con parámetros de estado
✅ **Controles visuales** consistentes con el resto del sistema
✅ **Performance optimizada** con consultas eficientes
✅ **UX mejorada** con estados de carga y error

**URL de acceso**: `http://localhost:3000/dashboard/pricing/products`

El sistema está completamente funcional y listo para uso en producción! 🚀
