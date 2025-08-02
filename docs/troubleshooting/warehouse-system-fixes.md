# Resolución de Problemas - Sistema de Bodegas

## Resumen
Documentación de todos los problemas técnicos encontrados y resueltos durante el desarrollo del sistema de gestión de bodegas.

## Problemas Resueltos

### 1. Error NEXT_REDIRECT en Server Actions

#### Síntomas
```
Error: NEXT_REDIRECT
    at getRedirectError (..\..\..\src\client\components\redirect.ts:21:16)
    at redirect (..\..\..\src\client\components\redirect.ts:47:8)
    at updateWarehouse (src\actions\configuration\warehouse-actions.ts:115:13)

Error: Error al actualizar la bodega.
```

#### Causa Raíz
El `redirect()` de Next.js lanza una excepción especial `NEXT_REDIRECT` que es parte del comportamiento normal, pero nuestro bloque `try-catch` la estaba capturando como si fuera un error real.

#### Código Problemático
```typescript
try {
  await prisma.warehouse.update(data);
  revalidatePath('/warehouses');
  redirect('/warehouses?status=success'); // ❌ Lanza NEXT_REDIRECT
} catch (error) {
  // ❌ Captura NEXT_REDIRECT como error
  throw new Error('Error al actualizar la bodega.');
}
```

#### Solución Implementada
```typescript
try {
  await prisma.warehouse.update(data);
  console.log('Operación exitosa...');
} catch (error) {
  // Solo errores reales de Prisma aquí
  handlePrismaError(error);
}

// ✅ Redirect FUERA del try-catch
revalidatePath('/warehouses');
redirect('/warehouses?status=success');
```

#### Funciones Corregidas
- `createWarehouse()`
- `updateWarehouse()`
- `deleteWarehouse()`

---

### 2. Error "Functions cannot be passed to Client Components"

#### Síntomas
```
Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server".
  <form action={function action} children=...>
               ^^^^^^^^^^^^^^^^^
```

#### Causa Raíz
El componente `Table` se marcó como cliente (`'use client'`) para manejar eventos, pero recibía funciones server actions desde componentes servidor, violando las reglas de Next.js.

#### Problema de Arquitectura
```typescript
// ❌ Server Component pasando funciones a Client Component
<Table 
  columns={[
    { header: 'Tipo', cell: (row) => <span>{row.type}</span> } // ❌ Función del servidor
  ]}
  actions={{
    deleteAction: deleteWarehouse // ❌ Server action
  }}
/>
```

#### Soluciones Implementadas

##### Solución 1: Componente Específico
```typescript
// ✅ Componente cliente específico para bodegas
'use client';
export function WarehouseTable({ data, deleteAction }) {
  const getTypeLabel = (type) => { /* lógica en cliente */ };
  
  return (
    <table>
      {data.map(row => (
        <tr>
          <td>{getTypeLabel(row.type)}</td> {/* ✅ Función cliente */}
          <td>
            <form action={deleteAction}> {/* ✅ Server action directa */}
              <button>Eliminar</button>
            </form>
          </td>
        </tr>
      ))}
    </table>
  );
}
```

##### Solución 2: Separación de Responsabilidades
```typescript
// ✅ Table.tsx vuelve a ser Server Component
export function Table({ columns, actions }) { /* servidor */ }

// ✅ DeleteButton.tsx es Client Component específico
'use client';
export function DeleteButton({ deleteAction, id }) {
  return (
    <form action={deleteAction}>
      <input type="hidden" name="id" value={id} />
      <button onClick={handleConfirmation}>Eliminar</button>
    </form>
  );
}
```

#### Estructura Final
```
src/components/shared/
├── Table.tsx (servidor - genérico)
├── WarehouseTable.tsx (cliente - específico) 
├── DeleteButton.tsx (cliente - confirmaciones)
└── RemoveProductFromWarehouseButton.tsx (cliente - específico)
```

---

### 3. Error de Tipos TypeScript en Table.tsx

#### Síntomas
```
Type 'T[keyof T]' is not assignable to type 'string | number'.
Type 'T[string] | T[number] | T[symbol]' is not assignable to type 'string | number'.
```

#### Causa Raíz
El tipo genérico `T[keyof T]` puede ser cualquier tipo, pero el componente `DeleteButton` esperaba específicamente `string | number`.

#### Código Problemático
```typescript
<DeleteButton
  id={row[rowKey]} // ❌ Tipo T[keyof T]
  deleteAction={actions.deleteAction}
/>
```

#### Solución
```typescript
<DeleteButton
  id={String(row[rowKey])} // ✅ Cast explícito a string
  deleteAction={actions.deleteAction}
/>
```

---

### 4. Error "use server" con Exportación de Objetos

#### Síntomas
```
Error: A "use server" file can only export async functions, found object.
```

#### Causa Raíz
El archivo `warehouse-actions.ts` tenía `'use server'` pero intentábamos exportar la constante `WAREHOUSE_TYPES`.

#### Código Problemático
```typescript
// ❌ En archivo con 'use server'
'use server';
export const WAREHOUSE_TYPES = [...]
export async function createWarehouse() {}
```

#### Solución
```typescript
// ✅ Mover constante a archivo separado
// src/constants/warehouse.ts
export const WAREHOUSE_TYPES = [...]

// src/actions/configuration/warehouse-actions.ts
'use server';
import { WAREHOUSE_TYPES } from '@/constants/warehouse';
export async function createWarehouse() {}
```

---

### 5. Problemas de Base de Datos con Prisma

#### Síntomas
```
Error: Error al crear/actualizar la bodega.
PrismaClientKnownRequestError: P2002, P2025, P2003
```

#### Códigos de Error Manejados

##### P2002 - Violación de Restricción Única
```typescript
if (error.code === 'P2002') {
  if (error.meta?.target?.includes('name')) {
    throw new Error('Ya existe una bodega con ese nombre.');
  }
  throw new Error(`Violación de restricción única: ${error.meta?.target}`);
}
```

##### P2025 - Registro No Encontrado
```typescript
if (error.code === 'P2025') {
  throw new Error('La bodega no fue encontrada.');
}
```

##### P2003 - Error de Clave Foránea
```typescript
if (error.code === 'P2003') {
  throw new Error('Error de clave foránea: verifique que la bodega padre exista.');
}
```

#### Validaciones Implementadas
```typescript
// Validar parentId
let parsedParentId: number | null = null;
if (parentId && parentId !== '') {
  parsedParentId = parseInt(parentId);
  if (isNaN(parsedParentId)) {
    throw new Error('ID de bodega padre no válido.');
  }
  // Evitar auto-referencia
  if (parsedParentId === id) {
    throw new Error('Una bodega no puede ser padre de sí misma.');
  }
}
```

---

### 6. Problemas de Caché de Next.js

#### Síntomas
- Cambios no se reflejan después de editar código
- Errores persistentes después de correcciones
- Servidor muestra código anterior

#### Solución
```bash
# PowerShell en Windows
Remove-Item -Recurse -Force .next
npm run dev

# Linux/Mac  
rm -rf .next
npm run dev
```

#### Causa
Next.js mantiene caché agresivo en desarrollo que a veces no se actualiza correctamente con cambios en server actions.

---

## Buenas Prácticas Establecidas

### 1. Server Actions
```typescript
export async function serverAction(formData: FormData) {
  // 1. Validaciones inmediatas
  const data = extractAndValidate(formData);
  
  // 2. Operación de base de datos en try-catch
  try {
    await prisma.operation(data);
  } catch (error) {
    handleSpecificPrismaErrors(error);
  }
  
  // 3. Revalidación y redirect FUERA del try-catch
  revalidatePath('/path');
  redirect('/success');
}
```

### 2. Separación Client/Server
- **Server Components**: Datos, server actions, lógica de negocio
- **Client Components**: Interactividad, confirmaciones, eventos del DOM
- **Componentes específicos**: Para lógica compleja que mezcla ambos

### 3. Manejo de Errores
- **Logging detallado** para debugging
- **Códigos específicos** de Prisma
- **Mensajes amigables** para usuarios
- **Validaciones tempranas** antes de operaciones costosas

### 4. Tipos TypeScript
- **Casts explícitos** cuando sea necesario
- **Validaciones runtime** además de tipos
- **Interfaces específicas** para cada caso de uso

### 5. Validaciones
- **Frontend**: HTML5 + confirmaciones usuario
- **Backend**: Validación completa de datos
- **Base de datos**: Restricciones a nivel de esquema

---

## Herramientas de Debugging

### 1. Logging en Server Actions
```typescript
console.log('Datos de entrada:', {
  id,
  data: dataToUpdate,
  originalFormData: Object.fromEntries(formData)
});

console.error('Error completo:', {
  error,
  message: error.message,
  code: error.code,
  meta: error.meta
});
```

### 2. Validación de Prisma
```typescript
// Archivo de prueba
// src/actions/configuration/test-warehouse.ts
'use server';
import prisma from '@/lib/prisma';

export async function testPrismaConnection() {
  try {
    const count = await prisma.warehouse.count();
    console.log('Conexión exitosa, bodegas:', count);
    return { success: true, count };
  } catch (error) {
    console.error('Error de conexión:', error);
    return { success: false, error: error.message };
  }
}
```

### 3. Network Tab en DevTools
- Verificar requests POST a server actions
- Revisar respuestas y códigos de estado
- Identificar problemas de red vs aplicación

---

**Documentado por**: AI Assistant  
**Fecha**: 2024  
**Versión**: 1.0  
**Total de problemas resueltos**: 6 