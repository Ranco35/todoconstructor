# Server Actions - Sistema de Gestión de Precios

## Descripción
Server actions para la gestión de precios por categoría, incluyendo configuración de márgenes, reglas de redondeo y actualización masiva de productos.

## Archivo Principal
`src/actions/pricing/price-management-actions.ts`

## Funciones Principales

### 1. updateCategoryPricesFromCost()
Actualiza los precios de todos los productos de una categoría específica.

```typescript
export async function updateCategoryPricesFromCost(
  categoryId: number,
  reason: string = 'margin_adjustment'
): Promise<{
  success: boolean;
  data?: { updated: number; errors: string[] };
  error?: string;
}>
```

**Parámetros:**
- `categoryId`: ID de la categoría a actualizar
- `reason`: Razón del cambio (opcional)

**Retorna:**
- `success`: Indica si la operación fue exitosa
- `data`: Número de productos actualizados y lista de errores
- `error`: Mensaje de error si ocurre algún problema

**Flujo:**
1. Obtiene la configuración de la categoría
2. Busca todos los productos de la categoría con precio de costo
3. Actualiza cada producto individualmente
4. Retorna estadísticas de la operación

### 2. updateProductPriceFromCost()
Actualiza el precio de un producto específico.

```typescript
export async function updateProductPriceFromCost(
  productId: number,
  costPrice: number,
  reason: string = 'cost_update',
  roundingRule?: 'none' | 'tens' | 'hundreds' | 'thousands'
): Promise<{
  success: boolean;
  data?: PriceCalculation;
  error?: string;
}>
```

**Parámetros:**
- `productId`: ID del producto a actualizar
- `costPrice`: Nuevo precio de costo
- `reason`: Razón del cambio
- `roundingRule`: Regla de redondeo específica (opcional)

**Retorna:**
- `success`: Indica si la operación fue exitosa
- `data`: Cálculo completo del nuevo precio
- `error`: Mensaje de error si ocurre algún problema

### 3. getCategoryProfitConfig()
Obtiene la configuración de márgenes de una categoría.

```typescript
export async function getCategoryProfitConfig(categoryId: number): Promise<{
  success: boolean;
  data?: CategoryProfitConfig;
  error?: string;
}>
```

### 4. createCategoryProfitConfig()
Crea una nueva configuración de márgenes para una categoría.

```typescript
export async function createCategoryProfitConfig(
  config: Omit<CategoryProfitConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{
  success: boolean;
  data?: CategoryProfitConfig;
  error?: string;
}>
```

### 5. updateCategoryProfitConfig()
Actualiza la configuración de márgenes de una categoría.

```typescript
export async function updateCategoryProfitConfig(
  id: number,
  updates: Partial<CategoryProfitConfig>
): Promise<{
  success: boolean;
  data?: CategoryProfitConfig;
  error?: string;
}>
```

### 6. deleteCategoryProfitConfig()
Elimina la configuración de márgenes de una categoría.

```typescript
export async function deleteCategoryProfitConfig(id: number): Promise<{
  success: boolean;
  error?: string;
}>
```

## Interfaces

### CategoryProfitConfig
```typescript
interface CategoryProfitConfig {
  id: number;
  categoryId: number;
  defaultProfitMargin: number;
  minProfitMargin: number;
  maxProfitMargin: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  Category?: {
    id: number;
    name: string;
  };
}
```

### PriceCalculation
```typescript
interface PriceCalculation {
  costPrice: number;
  profitMargin: number;
  salePrice: number;
  finalPrice: number;
  profitAmount: number;
  roundingRule: string;
}
```

## Manejo de Errores
Todas las funciones incluyen manejo de errores robusto:
- Validación de parámetros de entrada
- Verificación de existencia de registros
- Logging de errores para debugging
- Respuestas consistentes con `success` y `error`

## Dependencias
- `@/lib/supabase-server` - Cliente de Supabase
- `@/utils/price-utils` - Funciones de cálculo de precios

## Uso en el Frontend
```typescript
// Ejemplo de uso en componente React
const handleUpdatePrices = async (categoryId: number) => {
  const result = await updateCategoryPricesFromCost(categoryId, 'margin_adjustment');
  
  if (result.success) {
    const { updated, errors } = result.data || { updated: 0, errors: [] };
    console.log(`${updated} productos actualizados`);
    if (errors.length > 0) {
      console.warn('Errores:', errors);
    }
  } else {
    console.error('Error:', result.error);
  }
};
```
