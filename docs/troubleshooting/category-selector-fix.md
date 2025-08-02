# Fix: CategorySelector - Error al cargar categorías

## Problema
- Al crear un producto, el selector de categorías mostraba "Error al cargar categorías"
- También había errores en los centros de costo relacionados con relaciones inexistentes

## Causa
1. **CategorySelector**: Uso de `category.parentId` en lugar de `category.parentid` (convención minúsculas)
2. **Cost Centers API**: Problema con campo `isActive` vs `isactive` 
3. **Funciones category-actions**: Referencias incorrectas a nombres de campos de BD

## Solución Implementada

### 1. Corrección en category-actions.ts
```typescript
// ANTES
if (category.parentId) {
  const { data: parentCategory } = await supabase
    .from('Category')
    .select('name')
    .eq('id', category.parentId)
    .single();
}

// DESPUÉS  
if (category.parentid) {
  const { data: parentCategory } = await supabase
    .from('Category')
    .select('name')
    .eq('id', category.parentid)
    .single();
}
```

### 2. Corrección en cost-centers API
```typescript
// ANTES
.eq('isActive', active)

// DESPUÉS
.eq('isactive', active)
```

### 3. Optimización del CategorySelector
```typescript
// ANTES - Usaba función paginada
import { getCategories } from '@/actions/configuration/category-actions';
const response = await getCategories({ page: 1, pageSize: 100 });
setCategories(response.categories);

// DESPUÉS - Usa función simple
import { getAllCategories } from '@/actions/configuration/category-actions';
const categories = await getAllCategories();
setCategories(categories);
```

## Archivos Modificados
- `src/actions/configuration/category-actions.ts`
- `src/app/api/cost-centers/route.ts`
- `src/components/products/CategorySelector.tsx`

## Resultado
✅ CategorySelector ahora carga correctamente todas las categorías disponibles
✅ Se eliminaron errores de centros de costo en terminal
✅ Formulario de crear producto funciona completamente
✅ Mejor rendimiento al usar getAllCategories() en lugar de función paginada

## Validación
- Navegar a `/dashboard/configuration/products/create`
- Verificar que el selector de categorías carga sin errores
- Confirmar que muestra todas las categorías disponibles
- Verificar que no hay errores en terminal relacionados con cost centers 