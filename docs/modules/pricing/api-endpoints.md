# API Endpoints - Sistema de Gestión de Precios

## Descripción
Endpoints API para el sistema de gestión de precios, incluyendo actualización masiva de precios y operaciones CRUD.

## Endpoints Principales

### 1. Actualización de Precios por Categoría
**Endpoint:** `POST /api/pricing/update-category-prices`

**Descripción:** Actualiza los precios de todos los productos de una categoría específica aplicando la configuración de márgenes y reglas de redondeo.

**Archivo:** `src/app/api/pricing/update-category-prices/route.ts`

#### Request
```typescript
POST /api/pricing/update-category-prices
Content-Type: application/json

{
  "categoryId": number,
  "reason"?: string // Opcional, default: "margin_adjustment"
}
```

#### Ejemplo de Request
```json
{
  "categoryId": 123,
  "reason": "margin_adjustment"
}
```

#### Response Success
```typescript
{
  "success": true,
  "data": {
    "updated": number,    // Número de productos actualizados
    "errors": string[]    // Lista de errores si los hay
  }
}
```

#### Ejemplo de Response Success
```json
{
  "success": true,
  "data": {
    "updated": 12,
    "errors": []
  }
}
```

#### Response Error
```typescript
{
  "success": false,
  "error": string
}
```

#### Ejemplo de Response Error
```json
{
  "success": false,
  "error": "No se encontró configuración para la categoría"
}
```

#### Códigos de Estado HTTP
- `200` - Éxito
- `400` - Error de validación (categoryId requerido)
- `500` - Error interno del servidor

#### Implementación
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { updateCategoryPricesFromCost } from '@/actions/pricing/price-management-actions';

export async function POST(request: NextRequest) {
  try {
    const { categoryId, reason = 'margin_adjustment' } = await request.json();

    if (!categoryId || typeof categoryId !== 'number') {
      return NextResponse.json(
        { success: false, error: 'ID de categoría requerido' },
        { status: 400 }
      );
    }

    const result = await updateCategoryPricesFromCost(categoryId, reason);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en API update-category-prices:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

## Server Actions (Funciones del Servidor)

### 1. updateCategoryPricesFromCost
**Función:** `updateCategoryPricesFromCost(categoryId: number, reason?: string)`

**Descripción:** Actualiza los precios de todos los productos de una categoría.

**Parámetros:**
- `categoryId` (number): ID de la categoría
- `reason` (string, opcional): Razón del cambio

**Retorna:**
```typescript
{
  success: boolean;
  data?: { updated: number; errors: string[] };
  error?: string;
}
```

### 2. updateProductPriceFromCost
**Función:** `updateProductPriceFromCost(productId: number, costPrice: number, reason?: string, roundingRule?: string)`

**Descripción:** Actualiza el precio de un producto específico.

**Parámetros:**
- `productId` (number): ID del producto
- `costPrice` (number): Nuevo precio de costo
- `reason` (string, opcional): Razón del cambio
- `roundingRule` (string, opcional): Regla de redondeo específica

**Retorna:**
```typescript
{
  success: boolean;
  data?: PriceCalculation;
  error?: string;
}
```

### 3. getCategoryProfitConfig
**Función:** `getCategoryProfitConfig(categoryId: number)`

**Descripción:** Obtiene la configuración de márgenes de una categoría.

**Parámetros:**
- `categoryId` (number): ID de la categoría

**Retorna:**
```typescript
{
  success: boolean;
  data?: CategoryProfitConfig;
  error?: string;
}
```

### 4. createCategoryProfitConfig
**Función:** `createCategoryProfitConfig(config: CategoryProfitConfigInput)`

**Descripción:** Crea una nueva configuración de márgenes para una categoría.

**Parámetros:**
- `config` (CategoryProfitConfigInput): Datos de la configuración

**Retorna:**
```typescript
{
  success: boolean;
  data?: CategoryProfitConfig;
  error?: string;
}
```

### 5. updateCategoryProfitConfig
**Función:** `updateCategoryProfitConfig(id: number, updates: Partial<CategoryProfitConfig>)`

**Descripción:** Actualiza la configuración de márgenes de una categoría.

**Parámetros:**
- `id` (number): ID de la configuración
- `updates` (Partial<CategoryProfitConfig>): Campos a actualizar

**Retorna:**
```typescript
{
  success: boolean;
  data?: CategoryProfitConfig;
  error?: string;
}
```

### 6. deleteCategoryProfitConfig
**Función:** `deleteCategoryProfitConfig(id: number)`

**Descripción:** Elimina la configuración de márgenes de una categoría.

**Parámetros:**
- `id` (number): ID de la configuración

**Retorna:**
```typescript
{
  success: boolean;
  error?: string;
}
```

## Interfaces de Datos

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

### CategoryProfitConfigInput
```typescript
interface CategoryProfitConfigInput {
  categoryId: number;
  defaultProfitMargin: number;
  minProfitMargin: number;
  maxProfitMargin: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
  isActive?: boolean;
}
```

## Manejo de Errores

### Tipos de Errores
1. **Validación de entrada**: Parámetros faltantes o inválidos
2. **Recursos no encontrados**: Categoría o producto inexistente
3. **Errores de base de datos**: Problemas de conexión o consultas
4. **Errores de cálculo**: Problemas en el procesamiento de precios

### Códigos de Error
- `VALIDATION_ERROR` - Error de validación de parámetros
- `NOT_FOUND` - Recurso no encontrado
- `DATABASE_ERROR` - Error de base de datos
- `CALCULATION_ERROR` - Error en cálculo de precios
- `INTERNAL_ERROR` - Error interno del servidor

### Ejemplo de Manejo de Errores
```typescript
try {
  const result = await updateCategoryPricesFromCost(categoryId, reason);
  
  if (result.success) {
    // Manejo de éxito
    return NextResponse.json(result);
  } else {
    // Manejo de error de la función
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }
} catch (error) {
  // Manejo de errores inesperados
  console.error('Error en API:', error);
  return NextResponse.json(
    { success: false, error: 'Error interno del servidor' },
    { status: 500 }
  );
}
```

## Seguridad

### Validación de Entrada
- Verificación de tipos de datos
- Validación de rangos de valores
- Sanitización de strings
- Verificación de existencia de recursos

### Autenticación y Autorización
- Verificación de sesión de usuario
- Validación de permisos por rol
- Auditoría de acciones realizadas

### Rate Limiting
- Límite de requests por minuto
- Protección contra ataques DDoS
- Throttling de operaciones costosas

## Logging y Monitoreo

### Logs de Auditoría
```typescript
// Ejemplo de logging
console.log(`Actualizando precios para categoría ${categoryId}`);
console.log(`Resultado: ${updated} productos actualizados`);
console.warn('Errores durante la actualización:', errors);
```

### Métricas
- Tiempo de respuesta de endpoints
- Número de productos actualizados
- Errores por tipo
- Uso de recursos

## Testing

### Tests Unitarios
```typescript
// Ejemplo de test para el endpoint
describe('POST /api/pricing/update-category-prices', () => {
  it('should update prices for valid category', async () => {
    const response = await fetch('/api/pricing/update-category-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: 123 })
    });
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.updated).toBeGreaterThan(0);
  });
  
  it('should return error for invalid category', async () => {
    const response = await fetch('/api/pricing/update-category-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: 999999 })
    });
    
    const result = await response.json();
    expect(result.success).toBe(false);
    expect(result.error).toContain('No se encontró');
  });
});
```

### Tests de Integración
- Verificación de flujo completo
- Validación de datos en base de datos
- Comprobación de triggers y funciones

## Documentación de API

### Swagger/OpenAPI
```yaml
openapi: 3.0.0
info:
  title: Sistema de Gestión de Precios
  version: 1.0.0
  description: API para gestión de precios por categoría

paths:
  /api/pricing/update-category-prices:
    post:
      summary: Actualizar precios por categoría
      description: Actualiza los precios de todos los productos de una categoría
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                categoryId:
                  type: integer
                  description: ID de la categoría
                reason:
                  type: string
                  description: Razón del cambio
              required:
                - categoryId
      responses:
        '200':
          description: Éxito
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      updated:
                        type: integer
                      errors:
                        type: array
                        items:
                          type: string
        '400':
          description: Error de validación
        '500':
          description: Error interno del servidor
```

## Optimización

### Performance
- Uso de índices en base de datos
- Paginación de resultados
- Caché de configuraciones
- Procesamiento en lotes

### Escalabilidad
- Separación de responsabilidades
- Uso de colas para operaciones pesadas
- Implementación de circuit breakers
- Monitoreo de recursos

## Mantenimiento

### Versionado
- Versionado semántico de API
- Compatibilidad hacia atrás
- Deprecación gradual de endpoints

### Actualizaciones
- Migraciones de base de datos
- Actualización de dependencias
- Mejoras de seguridad
- Optimizaciones de performance
