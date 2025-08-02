# Formulario de Creación de Productos

## Descripción
Este módulo implementa un formulario dinámico para la creación de productos en el sistema. El formulario se adapta según el tipo de producto seleccionado, mostrando u ocultando campos según sea necesario.

## Componentes

### 1. TipoProductoSelector
- **Ubicación**: `src/components/products/TipoProductoSelector.tsx`
- **Propósito**: Permite seleccionar el tipo de producto
- **Tipos soportados**:
  - CONSUMIBLE
  - ALMACENABLE
  - SERVICIO
  - INVENTARIO
  - COMBO

### 2. ProductoForm
- **Ubicación**: `src/components/products/ProductoForm.tsx`
- **Propósito**: Formulario principal para la creación de productos
- **Características**:
  - Campos dinámicos según el tipo de producto
  - Validación de campos requeridos
  - Manejo de precios y stock
  - Soporte para imágenes

### 3. Página de Creación
- **Ubicación**: `src/app/products/create/page.tsx`
- **Propósito**: Página principal que integra los componentes
- **Funcionalidades**:
  - Visualización del formulario
  - Manejo del estado del formulario
  - Visualización de datos enviados

## Campos del Formulario

### Campos Básicos (Todos los tipos)
- Nombre (requerido)
- Código de Barras
- Descripción
- URL de Imagen

### Campos de Precios (excepto INVENTARIO)
- Precio de Costo
- Precio de Venta (requerido)
- IVA (%)

### Campos de Stock (CONSUMIBLE, ALMACENABLE, INVENTARIO)
- Stock Mínimo
- Stock Máximo
- Stock Actual

## Validaciones

1. **Campos Requeridos**:
   - Nombre: Siempre requerido
   - Precio de Venta: Requerido excepto para INVENTARIO

2. **Validaciones Numéricas**:
   - Precios: Valores positivos con 2 decimales
   - IVA: Entre 0 y 100
   - Stock: Valores enteros no negativos

3. **Validaciones de URL**:
   - Imagen: Formato URL válido

## Uso

```typescript
import ProductoForm from '@/components/products/ProductoForm';

// En tu componente
const handleSubmit = (data: ProductFormData) => {
  console.log('Datos del formulario:', data);
  // Procesar los datos...
};

// Renderizar el formulario
<ProductoForm onSubmit={handleSubmit} />
```

## Estilos
El formulario utiliza Tailwind CSS para el estilizado, proporcionando:
- Diseño responsivo
- Estados de hover y focus
- Validación visual
- Espaciado consistente

## Notas de Implementación
- El formulario es completamente tipado con TypeScript
- Utiliza React Hooks para el manejo del estado
- Implementa validaciones en tiempo real
- Sigue las mejores prácticas de accesibilidad

## Última Actualización
- Fecha: Diciembre 2024
- Versión: 1.0.0 