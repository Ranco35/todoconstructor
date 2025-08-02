# Sistema de Integración POS con Productos

## Descripción General

Este sistema permite marcar productos específicos como habilitados para venta en el punto de venta (POS) y sincronizarlos automáticamente con la tabla `POSProduct` para su uso en el sistema POS.

## Arquitectura del Sistema

### 1. Base de Datos

#### Campo `isPOSEnabled` en tabla `Product`
```sql
-- Campo agregado a la tabla Product
ALTER TABLE "Product" 
ADD COLUMN "isPOSEnabled" BOOLEAN DEFAULT false;

-- Comentario para documentación
COMMENT ON COLUMN "Product"."isPOSEnabled" IS 'Indica si el producto está habilitado para venta en punto de venta (POS)';

-- Índice para optimizar consultas
CREATE INDEX IF NOT EXISTS "idx_product_pos_enabled" ON "Product"("isPOSEnabled");
```

#### Relación con `POSProduct`
- La tabla `POSProduct` tiene un campo `productId` que referencia a `Product.id`
- Solo productos con `isPOSEnabled = true` aparecen en el POS
- Los productos deben estar sincronizados (tener registro en `POSProduct`) para ser visibles

### 2. Frontend

#### Formulario de Productos
- **Ubicación**: Pestaña "Propiedades" en el formulario de productos
- **Campo**: Checkbox "Habilitado para venta en punto de venta"
- **Comportamiento**: 
  - Por defecto `false`
  - Se puede habilitar para cualquier tipo de producto
  - Se guarda automáticamente al crear/actualizar producto

#### Componente de Sincronización
- **Ubicación**: Página principal del POS (`/dashboard/pos`)
- **Funcionalidades**:
  - Muestra estadísticas de sincronización
  - Permite sincronizar productos habilitados
  - Indica productos pendientes de sincronización

### 3. Backend

#### Acciones de Productos
- **Archivo**: `src/actions/products/create.ts` y `src/actions/products/update.ts`
- **Funcionalidad**: Maneja el campo `isPOSEnabled` en creación y actualización
- **Mapeo**: `src/lib/product-mapper.ts` incluye mapeo del campo

#### Acciones del POS
- **Archivo**: `src/actions/pos/pos-actions.ts`
- **Funciones principales**:
  - `getPOSProductsByType()`: Filtra solo productos habilitados
  - `syncPOSProducts()`: Sincroniza productos habilitados
  - `getPOSSyncStats()`: Obtiene estadísticas de sincronización

## Flujo de Trabajo

### 1. Habilitar Producto para POS
1. Ir al formulario de productos
2. Navegar a la pestaña "Propiedades"
3. Activar el checkbox "Habilitado para venta en punto de venta"
4. Guardar el producto

### 2. Sincronización Automática
1. Ir a la página del POS (`/dashboard/pos`)
2. Ver el componente "Sincronización de Productos POS"
3. Si hay productos pendientes, hacer clic en "Sincronizar"
4. Los productos aparecerán automáticamente en el POS

### 3. Uso en Punto de Venta
1. Los productos habilitados y sincronizados aparecen en el POS
2. Se filtran automáticamente por tipo de caja (recepción/restaurante)
3. Solo productos con `isPOSEnabled = true` son visibles

## Consultas SQL Importantes

### Obtener productos habilitados para POS
```sql
SELECT * FROM "Product" 
WHERE "isPOSEnabled" = true;
```

### Obtener productos sincronizados con POS
```sql
SELECT p.*, pos.* 
FROM "Product" p
JOIN "POSProduct" pos ON p.id = pos."productId"
WHERE p."isPOSEnabled" = true;
```

### Productos pendientes de sincronización
```sql
SELECT p.* 
FROM "Product" p
WHERE p."isPOSEnabled" = true
AND p.id NOT IN (
    SELECT "productId" 
    FROM "POSProduct" 
    WHERE "productId" IS NOT NULL
);
```

## Funciones del Sistema

### `getPOSProductsByType(registerTypeId)`
- **Propósito**: Obtiene productos POS filtrados por tipo de caja
- **Filtros aplicados**:
  - Solo productos activos (`isActive = true`)
  - Solo productos vinculados a `Product` (`productId IS NOT NULL`)
  - Solo productos habilitados para POS (`isPOSEnabled = true`)
  - Solo categorías del tipo de caja especificado

### `syncPOSProducts()`
- **Propósito**: Sincroniza productos habilitados con `POSProduct`
- **Proceso**:
  1. Busca productos con `isPOSEnabled = true` que no están en `POSProduct`
  2. Obtiene categoría por defecto del POS
  3. Crea registros en `POSProduct` para cada producto pendiente
  4. Retorna estadísticas de sincronización

### `getPOSSyncStats()`
- **Propósito**: Obtiene estadísticas de sincronización
- **Métricas**:
  - `enabledProducts`: Productos habilitados para POS
  - `posProducts`: Total de productos en POSProduct
  - `syncedProducts`: Productos sincronizados
  - `pendingSync`: Productos pendientes de sincronización

## Configuración y Personalización

### Categorías por Defecto
- Los productos se asignan a la primera categoría disponible del tipo de caja
- Se puede modificar en `syncPOSProducts()` para usar categorías específicas

### Precios y Costos
- Los precios se copian desde `Product.saleprice` a `POSProduct.price`
- Los costos se copian desde `Product.costprice` a `POSProduct.cost`

### Imágenes
- Las imágenes se copian desde `Product.image` a `POSProduct.image`

## Mantenimiento

### Verificación de Integridad
```sql
-- Verificar productos huérfanos en POSProduct
SELECT pos.* 
FROM "POSProduct" pos
LEFT JOIN "Product" p ON pos."productId" = p.id
WHERE p.id IS NULL;
```

### Limpieza de Datos
```sql
-- Eliminar productos POS de productos deshabilitados
DELETE FROM "POSProduct" 
WHERE "productId" IN (
    SELECT id FROM "Product" 
    WHERE "isPOSEnabled" = false
);
```

## Troubleshooting

### Problema: Productos no aparecen en POS
1. Verificar que el producto tenga `isPOSEnabled = true`
2. Verificar que esté sincronizado (tenga registro en `POSProduct`)
3. Verificar que la categoría del POS esté activa
4. Ejecutar sincronización manual desde la página del POS

### Problema: Error en sincronización
1. Verificar que existan categorías POS activas
2. Verificar permisos de escritura en `POSProduct`
3. Revisar logs del servidor para errores específicos

### Problema: Productos duplicados
1. Verificar que no existan registros duplicados en `POSProduct`
2. Ejecutar limpieza de datos si es necesario

## Mejoras Futuras

1. **Sincronización automática**: Trigger en `Product` para sincronizar automáticamente
2. **Categorías específicas**: Permitir asignar categorías específicas por producto
3. **Precios independientes**: Permitir precios diferentes en POS vs. catálogo
4. **Stock en tiempo real**: Integrar stock disponible en POS
5. **Filtros avanzados**: Filtrar por categoría, proveedor, etc.

## Archivos Modificados

### Base de Datos
- `add_pos_enabled_direct.sql`: Script SQL para agregar campo

### Frontend
- `src/types/product.ts`: Agregado campo `isPOSEnabled`
- `src/components/products/ProductFormModern.tsx`: Agregado checkbox en formulario
- `src/components/pos/POSSyncManager.tsx`: Nuevo componente de sincronización
- `src/app/dashboard/pos/page.tsx`: Integrado componente de sincronización

### Backend
- `src/actions/products/create.ts`: Manejo del campo en creación
- `src/actions/products/update.ts`: Manejo del campo en actualización
- `src/lib/product-mapper.ts`: Mapeo del campo
- `src/actions/pos/pos-actions.ts`: Filtrado y sincronización

## Conclusión

Este sistema proporciona un control granular sobre qué productos están disponibles en el punto de venta, manteniendo la integridad de datos y permitiendo una gestión eficiente del catálogo de productos para diferentes tipos de POS. 