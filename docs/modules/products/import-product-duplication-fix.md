# Solución: Duplicación de Productos en Importación

## Problema Identificado

Durante la importación de productos desde Excel, se estaban creando productos duplicados debido a problemas en la lógica de búsqueda de productos existentes:

1. **SKUs case-sensitive**: Los SKUs en el Excel estaban en mayúsculas (`07-SIER-001-0145`) pero la búsqueda los normalizaba a minúsculas (`07-sier-001-0145`), causando que no se encontraran productos existentes.

2. **Falta de búsqueda por nombre**: No había un fallback para buscar productos por nombre cuando no se encontraban por ID o SKU.

3. **Sobrescritura de SKUs**: Al actualizar productos existentes, se sobrescribía el SKU original de la base de datos con el SKU del Excel.

## Solución Implementada

### 1. Búsqueda Case-Insensitive por SKU

**Archivo**: `src/actions/products/import.ts`

**Cambio**: Reemplazar búsqueda exacta por búsqueda case-insensitive:

```typescript
// ANTES
const { data: foundBySku } = await supabase
  .from('Product')
  .select('*')
  .eq('sku', finalSku)  // Búsqueda exacta
  .single();

// DESPUÉS
const { data: foundBySku } = await supabase
  .from('Product')
  .select('*')
  .ilike('sku', finalSku)  // Búsqueda case-insensitive
  .single();
```

### 2. Búsqueda Adicional por Nombre

**Archivo**: `src/actions/products/import.ts`

**Cambio**: Agregar búsqueda por nombre como fallback:

```typescript
// Búsqueda adicional por nombre si no se encontró por ID o SKU
if (!product && productName) {
  const { data: foundByName } = await supabase
    .from('Product')
    .select('*')
    .ilike('name', productName.trim())
    .single();
  if (foundByName) {
    product = foundByName;
    searchMethod = 'name';
  }
}
```

### 3. Preservar SKU Original en Actualizaciones

**Archivo**: `src/actions/products/import.ts`

**Cambio**: Mantener el SKU original de la base de datos al actualizar:

```typescript
// Actualizar producto existente - mantener el SKU original de la BD
const updatePayload = { ...productPayload };
if (product.sku) {
  updatePayload.sku = product.sku; // Mantener SKU original
}
const { error: updateError } = await supabase
  .from('Product')
  .update(updatePayload)
  .eq('id', product.id);
```

### 4. Logging Mejorado

**Archivo**: `src/actions/products/import.ts`

**Cambio**: Agregar logs detallados para debugging:

```typescript
console.log(`🔍 [IMPORT] Producto encontrado por SKU ${finalSku}: ${foundBySku.name} (SKU en BD: ${foundBySku.sku})`);
console.log(`🔍 [IMPORT] Producto: ${productName} | SKU: ${finalSku} | Encontrado: ${product ? 'SÍ' : 'NO'} | Método: ${searchMethod}`);
```

## Resultados

### Antes de la Solución
- Productos duplicados con el mismo SKU pero diferentes IDs
- SKUs inconsistentes (mayúsculas vs minúsculas)
- Productos sin SKU no se encontraban correctamente

### Después de la Solución
- ✅ Búsqueda robusta por ID, SKU (case-insensitive) y nombre
- ✅ Actualización correcta de productos existentes
- ✅ Preservación de SKUs originales en la base de datos
- ✅ Logging detallado para debugging
- ✅ Sin duplicación de productos

## Orden de Búsqueda

La lógica de búsqueda ahora sigue este orden:

1. **Por ID**: Si el Excel tiene un ID válido, buscar por ID
2. **Por SKU**: Si no se encontró por ID, buscar por SKU (case-insensitive)
3. **Por Nombre**: Si no se encontró por SKU, buscar por nombre exacto

## Casos de Uso Cubiertos

### Producto Existente con SKU
- **Excel**: SKU = `07-SIER-001-0145` (mayúsculas)
- **BD**: SKU = `07-sier-001-0145` (minúsculas)
- **Resultado**: ✅ Encuentra y actualiza el producto existente

### Producto Existente sin SKU
- **Excel**: Nombre = `Sierra circular eléctrica 7 1/4" 1800W2`
- **BD**: Nombre = `Sierra circular eléctrica 7 1/4" 1800W2`
- **Resultado**: ✅ Encuentra y actualiza el producto existente

### Producto Nuevo
- **Excel**: SKU = `NUEVO-SKU-001`
- **BD**: No existe
- **Resultado**: ✅ Crea nuevo producto

## Archivos Modificados

- `src/actions/products/import.ts`: Lógica principal de importación

## Testing

Para verificar que la solución funciona:

1. Importar un Excel con productos existentes
2. Verificar que se actualicen en lugar de duplicarse
3. Verificar que los SKUs se mantengan consistentes
4. Revisar los logs para confirmar el método de búsqueda usado

## Notas Importantes

- Los SKUs en la base de datos se mantienen en el formato original
- La búsqueda por nombre es exacta (case-insensitive)
- Los logs ayudan a debuggear problemas futuros
- La solución es compatible con productos con y sin SKU
