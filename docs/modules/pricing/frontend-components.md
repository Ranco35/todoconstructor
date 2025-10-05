# Componentes Frontend - Sistema de Gestión de Precios

## Descripción
Componentes React para la interfaz de usuario del sistema de gestión de precios.

## Componentes Principales

### 1. CategoryProfitConfigForm
**Archivo:** `src/components/pricing/CategoryProfitConfigForm.tsx`

Componente principal para configurar márgenes de utilidad por categoría.

#### Características
- Formulario para crear/editar configuraciones
- Tabla de configuraciones existentes
- Botón de actualización masiva de precios
- Manejo de estados de carga y errores

#### Props
```typescript
// No recibe props externas, maneja su propio estado
```

#### Estados
```typescript
const [configs, setConfigs] = useState<CategoryProfitConfig[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [loading, setLoading] = useState(true);
const [updatingPrices, setUpdatingPrices] = useState<number | null>(null);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
```

#### Funciones Principales
```typescript
// Cargar datos iniciales
const loadData = async () => {
  const [configsResult, categoriesData] = await Promise.all([
    getCategoryProfitConfigs(),
    getAllCategories()
  ]);
  // ... manejo de datos
};

// Actualizar precios de categoría
const handleUpdatePrices = async (categoryId: number, categoryName: string) => {
  const response = await fetch('/api/pricing/update-category-prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId, reason: 'margin_adjustment' })
  });
  // ... manejo de respuesta
};

// Crear nueva configuración
const handleSubmit = async (e: React.FormEvent) => {
  const result = await createCategoryProfitConfig(formData);
  // ... manejo de resultado
};
```

#### Elementos de UI
- **Selector de categoría**: Dropdown con todas las categorías disponibles
- **Campos de margen**: Inputs para margen por defecto, mínimo y máximo
- **Selector de redondeo**: Dropdown con opciones de redondeo
- **Tabla de configuraciones**: Lista de configuraciones existentes
- **Botón de actualización**: Botón 💰 para actualizar precios masivamente

### 2. ProductCard
**Archivo:** `src/components/website/ProductCard.tsx`

Componente para mostrar información de productos en la tienda web.

#### Props
```typescript
interface ProductCardProps {
  product: ProductWithStock;
  onAddToCart?: (product: ProductWithStock) => void;
}
```

#### Características
- Visualización de información del producto
- Formateo de precios en CLP
- Botón de consulta por WhatsApp
- Manejo de imágenes genéricas por categoría

#### Funciones Principales
```typescript
// Formatear precio en CLP
const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar precio';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(price);
};

// Obtener imagen genérica por categoría
const getGenericImage = (categoryName: string | null) => {
  const categoryImages = {
    'Herramientas': 'https://images.unsplash.com/photo-1504148455328-c376907d081c',
    'Materiales': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
    'Eléctricos': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e',
    // ... más categorías
  };
  return categoryImages[categoryName || 'Ferretería'] || categoryImages['Ferretería'];
};
```

#### Elementos de UI
- **Imagen del producto**: Con fallback a imagen genérica
- **Información del producto**: Nombre, SKU, descripción, marca
- **Precio**: Formateado en CLP con IVA incluido
- **Stock**: Badge con cantidad disponible
- **Categoría**: Badge con nombre de categoría
- **Ubicación**: Información de bodega
- **Botón de acción**: Consulta por WhatsApp

### 3. WebsiteFooter
**Archivo:** `src/components/website/WebsiteFooter.tsx`

Footer del sitio web con información de contacto y newsletter.

#### Características
- Información de contacto
- Enlaces de navegación
- Redes sociales
- Formulario de newsletter
- Corrección de error de hidratación

#### Correcciones Implementadas
```typescript
'use client' // Agregado para evitar error de hidratación

// Input de newsletter con estilos específicos
<input
  type="email"
  placeholder="tu@email.com"
  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400 w-64"
  style={{ backgroundImage: 'none', backgroundPosition: 'initial' }}
/>
```

## Interfaces de Datos

### ProductWithStock
```typescript
interface ProductWithStock {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  brand: string | null;
  image: string | null;
  saleprice: number | null;
  finalPrice: number | null; // Campo clave para mostrar precios
  vat: number | null;
  category: {
    id: number;
    name: string;
  } | null;
  stock: number;
  warehouse: {
    id: number;
    name: string;
  };
}
```

### Category
```typescript
interface Category {
  id: number;
  name: string;
  description?: string;
}
```

## Estilos y Diseño

### Clases CSS Utilizadas
- **Tailwind CSS**: Framework principal de estilos
- **Responsive Design**: Adaptable a diferentes tamaños de pantalla
- **Componentes consistentes**: Uso de clases estándar

### Paleta de Colores
- **Verde**: `green-600`, `green-700` - Botones principales y precios
- **Azul**: `blue-600` - Elementos secundarios
- **Gris**: `gray-800`, `gray-900` - Fondos y textos
- **Blanco**: `white` - Fondos de tarjetas

## Manejo de Estados

### Estados de Carga
```typescript
const [loading, setLoading] = useState(true);
const [updatingPrices, setUpdatingPrices] = useState<number | null>(null);
```

### Estados de Error y Éxito
```typescript
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
```

### Patrones de Uso
- **Loading states**: Spinners y estados de carga
- **Error handling**: Mensajes de error claros
- **Success feedback**: Confirmaciones de operaciones exitosas
- **Optimistic updates**: Actualizaciones inmediatas en la UI

## Integración con API

### Endpoints Utilizados
- `POST /api/pricing/update-category-prices` - Actualización masiva
- Server actions para operaciones CRUD

### Manejo de Respuestas
```typescript
if (result.success) {
  // Manejo de éxito
  setSuccess('Operación exitosa');
} else {
  // Manejo de error
  setError(result.error || 'Error desconocido');
}
```

## Responsive Design

### Breakpoints
- **Mobile**: `sm:` (640px+)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)

### Adaptaciones
- **Grid responsivo**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-5`
- **Navegación móvil**: Menú hamburguesa
- **Botones adaptativos**: Tamaños según dispositivo

## Accesibilidad

### Características
- **Labels descriptivos**: Para todos los inputs
- **Alt text**: En todas las imágenes
- **Contraste adecuado**: Colores accesibles
- **Navegación por teclado**: Elementos focusables

### Buenas Prácticas
- **Semantic HTML**: Uso correcto de elementos
- **ARIA labels**: Para elementos interactivos
- **Focus management**: Manejo adecuado del foco
