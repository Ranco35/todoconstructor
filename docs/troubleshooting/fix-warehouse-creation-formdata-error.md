# Fix: Error en Creación de Bodegas - FormData vs Object

## 📋 Problema Identificado

### Error Original
```
Error creando bodega: null value in column "name" of relation "Warehouse" violates not-null constraint
```

### Error Secundario de Hidratación
```
TypeError: Cannot read properties of undefined (reading 'call')
    at options.factory (webpack.js:712:31)
```

## 🔍 Análisis del Problema

### Problema Principal: FormData vs Object
- La función `createWarehouse` estaba diseñada para recibir un objeto JavaScript
- El formulario HTML enviaba `FormData` 
- Los datos del formulario no se extraían correctamente
- El campo `name` llegaba como `null` a la base de datos

### Problema Secundario: Client/Server Component Conflict
- Al intentar corregir con client component, se generaron errores de hidratación
- Importar server actions en client components causa conflictos en Next.js App Router

## ✅ Solución Implementada

### 1. Modificación de Server Action

**Archivo**: `src/actions/configuration/warehouse-actions.ts`

```typescript
// ANTES: Esperaba un objeto
export async function createWarehouse(warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) {
  // ...
}

// DESPUÉS: Maneja FormData correctamente
export async function createWarehouse(formData: FormData) {
  try {
    const supabase = await getSupabaseClient();
    
    // Extraer datos del FormData
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const type = formData.get('type') as string;
    const parentIdStr = formData.get('parentId') as string;
    
    // Validar campos requeridos
    if (!name || !name.trim()) {
      return { success: false, error: 'El nombre de la bodega es requerido' };
    }
    
    if (!location || !location.trim()) {
      return { success: false, error: 'La ubicación de la bodega es requerida' };
    }
    
    if (!type || !type.trim()) {
      return { success: false, error: 'El tipo de bodega es requerido' };
    }
    
    // Preparar datos para insertar
    const warehouseData = {
      name: name.trim(),
      description: description?.trim() || null,
      location: location.trim(),
      type: type.trim(),
      parentId: parentIdStr && parentIdStr !== '' ? parseInt(parentIdStr) : null,
      capacity: null,
      costCenterId: null,
      isActive: true
    };
    
    console.log('📝 Datos de bodega a crear:', warehouseData);
    
    const { data, error } = await supabase
      .from('Warehouse')
      .insert(warehouseData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creando bodega:', error);
      throw new Error(`Error creando bodega: ${error.message}`);
    }
    
    console.log('✅ Bodega creada exitosamente:', data);
    revalidatePath('/dashboard/configuration/inventory/warehouses');
    return { data, success: true, message: 'Bodega creada exitosamente' };
  } catch (error: any) {
    console.error('Error en createWarehouse:', error);
    return { success: false, error: error.message };
  }
}
```

### 2. Función Adicional para Uso Programático

```typescript
// Para mantener compatibilidad con uso programático
export async function createWarehouseFromData(warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('Warehouse')
      .insert(warehouseData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creando bodega:', error);
      throw new Error(`Error creando bodega: ${error.message}`);
    }
    
    revalidatePath('/dashboard/configuration/inventory/warehouses');
    return { data, success: true, message: 'Bodega creada exitosamente' };
  } catch (error: any) {
    console.error('Error en createWarehouseFromData:', error);
    return { success: false, error: error.message };
  }
}
```

### 3. Corrección del Componente

**Archivo**: `src/app/dashboard/configuration/inventory/warehouses/create/page.tsx`

```tsx
import { createWarehouse, getWarehousesForParent } from "@/actions/configuration/warehouse-actions"
import { WAREHOUSE_TYPES } from "@/constants/warehouse"
import Link from "next/link"
import { redirect } from "next/navigation"

// Marcar como página dinámica
export const dynamic = 'force-dynamic';

export default async function CreateWarehousePage() {
  const parentWarehouses = await getWarehousesForParent();

  async function handleCreateWarehouse(formData: FormData) {
    'use server';
    
    const result = await createWarehouse(formData);
    
    if (result.success) {
      redirect('/dashboard/configuration/inventory/warehouses?message=success&text=' + encodeURIComponent('Bodega creada exitosamente'));
    } else {
      redirect('/dashboard/configuration/inventory/warehouses/create?error=' + encodeURIComponent(result.error));
    }
  }
  
  return (
    <div className="container mx-auto p-4">
      {/* ... resto del JSX ... */}
      <form action={handleCreateWarehouse} className="space-y-6">
        {/* Campos del formulario */}
      </form>
    </div>
  )
}
```

## 🎯 Validaciones Agregadas

1. **Campos requeridos**: `name`, `location`, `type`
2. **Trimming**: Eliminación de espacios en blanco
3. **Conversión de tipos**: `parentId` de string a number cuando corresponde
4. **Valores por defecto**: `capacity: null`, `costCenterId: null`, `isActive: true`

## 🔧 Características de la Solución

### ✅ Ventajas
- **Server Component**: Mejor rendimiento, menos JavaScript en cliente
- **Validación robusta**: Campos requeridos y formato correcto
- **Manejo de errores**: Mensajes claros para el usuario
- **Compatibilidad**: Función separada para uso programático
- **Logging**: Trazabilidad para debugging

### 🛡️ Prevención de Errores Futuros
- Validación en servidor antes de insertar en BD
- Logs detallados para debugging
- Manejo de casos edge (valores vacíos, null, etc.)

## 📝 Lecciones Aprendidas

1. **FormData vs Object**: Siempre verificar qué tipo de datos espera la función
2. **Server vs Client Components**: Usar server components para formularios cuando sea posible
3. **Validación**: Validar datos en el servidor antes de enviar a BD
4. **Compatibilidad**: Mantener funciones separadas para diferentes usos

## 🔍 Debugging Tips

```typescript
// Agregar logs para verificar datos
console.log('📝 Datos de bodega a crear:', warehouseData);

// Verificar FormData
console.log('FormData entries:');
for (const [key, value] of formData.entries()) {
  console.log(`${key}: ${value}`);
}
```

## 📚 Referencias

- [Next.js App Router - Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [FormData MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [Supabase Insert Operations](https://supabase.com/docs/reference/javascript/insert)

---

**Fecha**: 2024-01-15  
**Estado**: ✅ Resuelto  
**Afecta**: Módulo de bodegas, creación de registros