# 🔍 Búsqueda y Transferencia de Productos por Categorías - Odoo

## Descripción General

Esta funcionalidad permite buscar productos específicos de Odoo por categoría y transferirlos selectivamente a categorías específicas en tu base de datos de Supabase, proporcionando un control granular sobre qué productos importar y dónde ubicarlos.

## 🚀 Características Principales

### ✅ Búsqueda por Categorías de Odoo
- **Visualización de categorías**: Lista todas las categorías disponibles en Odoo con conteo de productos
- **Carga dinámica**: Los productos se cargan automáticamente al seleccionar una categoría
- **Información detallada**: Muestra nombre de categoría y cantidad de productos disponibles

### ✅ Selección Granular de Productos
- **Selección individual**: Permite seleccionar productos específicos mediante checkboxes visuales
- **Selección masiva**: Botón para seleccionar/deseleccionar todos los productos de la categoría
- **Vista previa completa**: Muestra imagen, nombre, SKU, precio, stock y tipo de cada producto
- **Indicadores visuales**: Productos seleccionados se destacan con color verde

### ✅ Asignación a Categorías Locales
- **Selector de categoría destino**: Lista todas las categorías disponibles en Supabase
- **Vista previa de transferencia**: Muestra exactamente qué productos se transferirán y a qué categoría
- **Opciones de importación**: Permite elegir si incluir imágenes o no

### ✅ Proceso de Transferencia Inteligente
- **Transferencia selectiva**: Solo transfiere los productos seleccionados
- **Asignación automática**: Asigna automáticamente la categoría destino seleccionada
- **Descarga de imágenes**: Opción para incluir/excluir descarga de imágenes
- **Feedback detallado**: Muestra resultados completos con estadísticas

## 📁 Estructura de Archivos

```
src/
├── actions/configuration/odoo-sync.ts          # Funciones de backend actualizadas
│   ├── getOdooCategories()                     # Obtener categorías de Odoo
│   ├── getOdooProductsByCategory()             # Obtener productos por categoría
│   └── transferOdooProductsToCategory()        # Transferir productos seleccionados
├── components/products/
│   └── OdooCategoryProductSearch.tsx           # Componente principal de búsqueda
└── app/dashboard/configuration/products/odoo/
    └── OdooProductsClient.tsx                  # Página actualizada con tabs
```

## 🛠 Funciones Implementadas

### 1. `getOdooCategories()`
```typescript
// Obtiene todas las categorías disponibles en Odoo
const response = await getOdooCategories();
// Retorna: { success: boolean, data?: OdooCategory[], error?: string }
```

### 2. `getOdooProductsByCategory(categoryId: number)`
```typescript
// Obtiene productos filtrados por categoría específica
const response = await getOdooProductsByCategory(123);
// Retorna: { success: boolean, data?: OdooProduct[], error?: string }
```

### 3. `transferOdooProductsToCategory(products, targetCategoryId, includeImages)`
```typescript
// Transfiere productos seleccionados a categoría específica en Supabase
const result = await transferOdooProductsToCategory(
  selectedProducts,     // Array de productos de Odoo
  targetCategoryId,     // ID de categoría destino en Supabase
  includeImages        // Boolean para incluir imágenes
);
```

## 🎯 Flujo de Uso

### Paso 1: Selección de Categoría de Odoo
1. La interfaz muestra todas las categorías disponibles en Odoo
2. Cada categoría muestra el nombre y número de productos disponibles
3. Al hacer clic en una categoría, se cargan automáticamente sus productos

### Paso 2: Selección de Productos
1. Se muestran todos los productos de la categoría seleccionada
2. Cada producto incluye:
   - Imagen (si está disponible)
   - Nombre del producto
   - SKU (si existe)
   - Precio de venta
   - Stock disponible
   - Tipo de producto (Almacenable/Consumible/Servicio)
3. Checkbox visual para seleccionar productos individuales
4. Botón "Seleccionar Todo" para selección masiva

### Paso 3: Selección de Categoría Destino
1. Aparece automáticamente al seleccionar al menos un producto
2. Muestra todas las categorías disponibles en Supabase
3. Permite seleccionar la categoría donde se ubicarán los productos
4. Opción para incluir/excluir descarga de imágenes

### Paso 4: Transferencia
1. Muestra resumen de la transferencia:
   - Cantidad de productos a transferir
   - Categoría origen (Odoo)
   - Categoría destino (Supabase)
2. Ejecuta la transferencia con feedback en tiempo real
3. Muestra resultados detallados:
   - Productos creados
   - Productos actualizados
   - Imágenes descargadas
   - Errores (si los hay)

## 🔗 Endpoints de API Utilizados

### Categorías de Odoo
```
GET ${ODOO_BASE_URL}/api/categorias
```

### Productos por Categoría
```
GET ${ODOO_BASE_URL}/api/productos/categoria/{categoryId}
```

## 🎨 Interfaz de Usuario

### Diseño Visual
- **Header gradiente**: Púrpura a azul con título descriptivo
- **Pasos numerados**: Interfaz guiada con 3 pasos claros
- **Tarjetas interactivas**: Categorías y productos en tarjetas clickeables
- **Feedback visual**: Colores distintivos para selección y estados
- **Responsive**: Adaptado para desktop, tablet y móvil

### Estados de Interfaz
- **Carga inicial**: Spinners mientras cargan categorías
- **Carga de productos**: Indicador específico por categoría
- **Selección activa**: Destacado visual de elementos seleccionados
- **Transferencia**: Botón con spinner durante el proceso
- **Resultados**: Alertas con detalles de éxito o error

## 📊 Métricas y Estadísticas

### Durante la Transferencia
- Conteo de productos seleccionados en tiempo real
- Vista previa de categoría origen y destino
- Progreso visual durante la transferencia

### Después de la Transferencia
- **Productos creados**: Nuevos productos añadidos al sistema
- **Productos actualizados**: Productos existentes que fueron actualizados
- **Imágenes descargadas**: Cantidad de imágenes procesadas
- **Errores**: Lista detallada de cualquier problema encontrado

## 🔧 Configuración Técnica

### Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### Configuración de Odoo
```typescript
// En src/types/odoo.ts
export const DEFAULT_ODOO_CONFIG = {
  baseUrl: 'https://tu-instancia-odoo.com'
};
```

## 🚀 Ventajas de esta Implementación

### 1. **Control Granular**
- Selección precisa de productos específicos
- Asignación directa a categorías deseadas
- Evita importación masiva innecesaria

### 2. **Eficiencia Operativa**
- Proceso guiado paso a paso
- Feedback inmediato en cada acción
- Optimización de tiempo de transferencia

### 3. **Flexibilidad**
- Opción de incluir/excluir imágenes
- Reutilización de categorías existentes
- Transferencia por lotes controlados

### 4. **Experiencia de Usuario**
- Interfaz intuitiva y visual
- Estados claros en cada paso
- Información completa antes de confirmar

## 🔄 Integración con Sistema Existente

### Compatibilidad
- **100% compatible** con el sistema de productos existente
- **Reutiliza** todas las funciones de importación establecidas
- **Mantiene** la estructura de datos actual
- **Extiende** las capacidades sin afectar funcionalidad previa

### Acceso
- Disponible en `/dashboard/configuration/products/odoo`
- Tab "🔍 Búsqueda por Categorías"
- Requiere conexión activa con Odoo

## 📝 Casos de Uso Típicos

### 1. **Importación Selectiva por Departamento**
- Seleccionar categoría "Electrónicos" de Odoo
- Elegir solo productos de alta rotación
- Asignar a categoría "Tecnología" en Supabase

### 2. **Actualización de Catálogo Estacional**
- Filtrar por categoría "Ropa de Verano"
- Seleccionar nuevos productos
- Transferir a categoría "Temporada Actual"

### 3. **Expansión de Línea de Productos**
- Explorar categoría "Accesorios" en Odoo
- Seleccionar productos complementarios
- Crear/asignar a nueva categoría específica

## 🎯 Resultado Final

Esta implementación proporciona una herramienta poderosa y flexible para la gestión selectiva de productos entre Odoo y Supabase, optimizando el proceso de importación y manteniendo un control total sobre la organización del catálogo de productos. 