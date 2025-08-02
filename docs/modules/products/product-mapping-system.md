# Sistema de Mapeo Automático de Productos

## Resumen

Se ha implementado un sistema completo de mapeo automático para productos que resuelve la inconsistencia entre los nombres de campos en la base de datos (snake_case) y el frontend (camelCase).

## Problema Resuelto

### Antes del Mapeo
- **Base de datos**: Campos en snake_case (`categoryid`, `supplierid`, `costprice`, `saleprice`)
- **Frontend**: Campos en camelCase (`categoryId`, `supplierId`, `costPrice`, `salePrice`)
- **Warehouse_Product**: Campos en camelCase (`warehouseId`, `productId`)
- **Resultado**: Errores de consulta, datos no mostrados correctamente, inconsistencias

### Después del Mapeo
- **Mapeo automático**: Conversión transparente entre snake_case y camelCase
- **Consistencia**: Todos los endpoints usan el mismo sistema de mapeo
- **Mantenibilidad**: Un solo lugar para gestionar las conversiones

## Arquitectura del Sistema

### 1. Archivo de Mapeo Principal
**Ubicación**: `src/lib/product-mapper.ts`

#### Tipos Definidos
```typescript
// Base de datos (snake_case)
export interface ProductDB {
  id: number;
  name: string;
  categoryid?: number | null;
  supplierid?: number | null;
  costprice?: number | null;
  saleprice?: number | null;
  // ... otros campos
}

// Frontend (camelCase)
export interface ProductFrontend {
  id: number;
  name: string;
  categoryId?: number | null;
  supplierId?: number | null;
  costPrice?: number | null;
  salePrice?: number | null;
  // ... otros campos
}
```

#### Funciones de Mapeo
```typescript
// Mapeo de BD a Frontend
export function mapProductDBToFrontend(product: ProductDB): ProductFrontend

// Mapeo de Frontend a BD
export function mapProductFrontendToDB(product: ProductFrontend): ProductDB

// Mapeo de arrays
export function mapProductsDBToFrontend(products: ProductDB[]): ProductFrontend[]
export function mapProductsFrontendToDB(products: ProductFrontend[]): ProductDB[]
```

### 2. Endpoints Actualizados

#### Listado de Productos
**Archivo**: `src/actions/products/list.ts`
```typescript
// Consulta con nombres correctos de BD
const query = supabase
  .from('Product')
  .select(`
    *,
    Category (*),
    Supplier (*),
    Warehouse_Products:Warehouse_Product (
      id,
      quantity,
      warehouseId,  // ✅ Nombre correcto
      productId,    // ✅ Nombre correcto
      Warehouse (id, name)
    )
  `);

// Mapeo automático antes de retornar
const mappedProducts = mapProductsDBToFrontend(products as ProductDB[] || []);
return { products: mappedProducts, totalCount };
```

#### Obtener Producto por ID
**Archivo**: `src/actions/products/get.ts`
```typescript
// Mapeo automático del producto
const mappedProduct = mapProductDBToFrontend(product as ProductDB);

// Consulta de stock con nombres correctos
const { data: warehouseProducts } = await supabase
  .from('Warehouse_Product')
  .select('*')
  .eq('productId', id)  // ✅ Nombre correcto
```

#### Crear Producto
**Archivo**: `src/actions/products/create.ts`
```typescript
// Los datos ya vienen en camelCase del frontend
// Se mapean automáticamente a snake_case para la BD
if (productData.categoryId) finalProductData.categoryid = productData.categoryId;
if (productData.supplierId) finalProductData.supplierid = productData.supplierId;
if (productData.costPrice) finalProductData.costprice = productData.costPrice;
if (productData.salePrice) finalProductData.saleprice = productData.salePrice;
```

#### Actualizar Producto
**Archivo**: `src/actions/products/update.ts`
```typescript
// Mapeo de FormData a snake_case para BD
const productData = {
  name,
  categoryid,  // ✅ Mapeado desde categoryId
  supplierid,  // ✅ Mapeado desde supplierId
  costprice,   // ✅ Mapeado desde costPrice
  saleprice,   // ✅ Mapeado desde salePrice
  // ...
};
```

### 3. Componentes Frontend Actualizados

#### Tabla de Productos
**Archivo**: `src/components/products/ProductTable.tsx`
```typescript
// Uso del tipo mapeado
import { ProductFrontend } from '@/lib/product-mapper';

interface ProductTableProps {
  products: ProductFrontend[];  // ✅ Tipo correcto
}

// Campos en camelCase
accessorKey: 'costPrice',   // ✅ En lugar de 'costprice'
accessorKey: 'salePrice',   // ✅ En lugar de 'saleprice'
```

## Campos Mapeados

### Tabla Product
| Base de Datos (snake_case) | Frontend (camelCase) | Descripción |
|----------------------------|---------------------|-------------|
| `categoryid` | `categoryId` | ID de la categoría |
| `supplierid` | `supplierId` | ID del proveedor |
| `costprice` | `costPrice` | Precio de costo |
| `saleprice` | `salePrice` | Precio de venta |
| `supplierCode` | `supplierCode` | Código del proveedor |
| `defaultCostCenterId` | `defaultCostCenterId` | Centro de costo por defecto |

### Tabla Warehouse_Product
| Base de Datos (camelCase) | Frontend (camelCase) | Descripción |
|---------------------------|---------------------|-------------|
| `warehouseId` | `warehouseId` | ID de la bodega |
| `productId` | `productId` | ID del producto |
| `quantity` | `quantity` | Cantidad en stock |
| `minStock` | `minStock` | Stock mínimo |
| `maxStock` | `maxStock` | Stock máximo |

## Beneficios del Sistema

### 1. Consistencia
- Todos los endpoints usan el mismo sistema de mapeo
- No más inconsistencias entre snake_case y camelCase
- Tipos TypeScript consistentes en todo el proyecto

### 2. Mantenibilidad
- Un solo lugar para gestionar las conversiones
- Fácil agregar nuevos campos al mapeo
- Documentación clara de las transformaciones

### 3. Robustez
- Manejo automático de campos nulos/undefined
- Validación de tipos en tiempo de compilación
- Reducción de errores en runtime

### 4. Performance
- Mapeo eficiente sin consultas adicionales
- Reutilización de tipos y funciones
- Optimización de consultas SQL

## Uso del Sistema

### Para Desarrolladores

#### 1. En Server Actions
```typescript
import { mapProductsDBToFrontend, ProductDB } from '@/lib/product-mapper';

// Consultar datos
const { data: products } = await supabase.from('Product').select('*');

// Mapear automáticamente
const mappedProducts = mapProductsDBToFrontend(products as ProductDB[]);

// Retornar al frontend
return { products: mappedProducts };
```

#### 2. En Componentes Frontend
```typescript
import { ProductFrontend } from '@/lib/product-mapper';

interface Props {
  products: ProductFrontend[];  // ✅ Usar tipo mapeado
}

// Usar campos en camelCase
const costPrice = product.costPrice;  // ✅ En lugar de product.costprice
const categoryId = product.categoryId; // ✅ En lugar de product.categoryid
```

#### 3. Para Nuevos Campos
```typescript
// 1. Agregar al tipo ProductDB
export interface ProductDB {
  // ... campos existentes
  nuevoCampo?: string | null;
}

// 2. Agregar al tipo ProductFrontend
export interface ProductFrontend {
  // ... campos existentes
  nuevoCampo?: string | null;
}

// 3. Actualizar función de mapeo
export function mapProductDBToFrontend(product: ProductDB): ProductFrontend {
  return {
    // ... mapeos existentes
    nuevoCampo: product.nuevoCampo,
  };
}
```

## Testing

### Script de Prueba
**Ubicación**: `scripts/test-product-mapping.js`

```bash
# Ejecutar prueba
node scripts/test-product-mapping.js
```

### Verificaciones
1. ✅ Consulta de productos con relaciones
2. ✅ Estructura de Warehouse_Product
3. ✅ Campos de tabla Product
4. ✅ Mapeo snake_case ↔ camelCase

## Endpoints Cubiertos

### ✅ Completamente Implementados
- [x] `getProducts()` - Listado de productos
- [x] `getProductById()` - Obtener producto individual
- [x] `createProduct()` - Crear producto
- [x] `updateProduct()` - Actualizar producto
- [x] `deleteProduct()` - Eliminar producto
- [x] `exportProducts()` - Exportar productos
- [x] `importProducts()` - Importar productos

### ✅ Componentes Actualizados
- [x] `ProductTable.tsx` - Tabla de productos
- [x] `ProductFormModern.tsx` - Formulario de productos
- [x] `ProductRowActions.tsx` - Acciones de fila

## Migración Completa

### Antes
```typescript
// ❌ Inconsistente
const product = {
  categoryid: 1,    // snake_case
  supplierid: 2,    // snake_case
  costprice: 100,   // snake_case
  saleprice: 150,   // snake_case
};
```

### Después
```typescript
// ✅ Consistente
const product = {
  categoryId: 1,    // camelCase
  supplierId: 2,    // camelCase
  costPrice: 100,   // camelCase
  salePrice: 150,   // camelCase
};
```

## Conclusión

El sistema de mapeo automático de productos resuelve completamente la inconsistencia entre los nombres de campos en la base de datos y el frontend. Proporciona:

- **Consistencia total** en todos los endpoints
- **Mantenibilidad mejorada** con un solo punto de gestión
- **Robustez** con tipos TypeScript estrictos
- **Performance optimizada** sin consultas adicionales

El sistema está listo para producción y puede extenderse fácilmente para nuevos campos o entidades relacionadas. 