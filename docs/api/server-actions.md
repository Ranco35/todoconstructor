# Server Actions API

## 📋 Descripción
Documentación de todas las Server Actions implementadas en el sistema Admin Termas.

## 🔧 Configuración General

### Estructura de Archivos
```
src/actions/
└── configuration/
    └── category-actions.ts
```

### Importaciones Comunes
```typescript
'use server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
```

## 📂 Category Actions

### **createCategory**
Crea una nueva categoría en el sistema.

```typescript
async function createCategory(formData: FormData): Promise<void>
```

**Parámetros:**
- `formData`: FormData conteniendo:
  - `name` (string, requerido): Nombre de la categoría

**Validaciones:**
- Nombre no puede estar vacío
- Nombre debe ser único (no duplicados)
- Trim automático de espacios

**Flujo:**
1. Extrae `name` del FormData
2. Valida que no esté vacío
3. Aplica trim al nombre
4. Inserta en base de datos via Prisma
5. Revalida cache de `/dashboard/categories`
6. Redirige con mensaje de éxito

**Errores:**
- `P2002`: "Ya existe una categoría con ese nombre"
- General: "Error al crear la categoría"

**Ejemplo:**
```typescript
const formData = new FormData();
formData.append('name', 'Bebidas');
await createCategory(formData);
```

---

### **updateCategory**
Actualiza una categoría existente.

```typescript
async function updateCategory(id: number, formData: FormData): Promise<void>
```

**Parámetros:**
- `id` (number): ID de la categoría a actualizar
- `formData`: FormData conteniendo:
  - `name` (string, requerido): Nuevo nombre

**Validaciones:**
- ID debe ser válido
- Nombre no puede estar vacío
- Nombre debe ser único (excepto la misma categoría)

**Flujo:**
1. Extrae `name` del FormData
2. Valida campos requeridos
3. Actualiza registro en base de datos
4. Revalida cache
5. Redirige con mensaje de éxito

**Errores:**
- `P2002`: "Ya existe una categoría con ese nombre"
- `P2025`: "La categoría no fue encontrada"
- General: "Error al actualizar la categoría"

**Ejemplo:**
```typescript
const formData = new FormData();
formData.append('name', 'Bebidas Calientes');
await updateCategory(1, formData);
```

---

### **deleteCategory**
Elimina una categoría del sistema.

```typescript
async function deleteCategory(id: number): Promise<void>
```

**Parámetros:**
- `id` (number): ID de la categoría a eliminar

**Validaciones:**
- ID debe existir en la base de datos
- No debe tener productos asociados (futuro)

**Flujo:**
1. Elimina registro de base de datos
2. Revalida cache
3. Redirige con mensaje de éxito

**Errores:**
- `P2025`: "La categoría no fue encontrada"
- General: "Error al eliminar la categoría"

**Ejemplo:**
```typescript
await deleteCategory(1);
```

---

### **getCategories**
Obtiene lista paginada de categorías.

```typescript
async function getCategories(params?: GetCategoriesParams): Promise<GetCategoriesResult>

interface GetCategoriesParams {
  page?: number;
  pageSize?: number;
}

interface GetCategoriesResult {
  categories: Category[];
  totalCount: number;
  page: number;
  pageSize: number;
}
```

**Parámetros:**
- `page` (number, opcional): Página actual (default: 1)
- `pageSize` (number, opcional): Elementos por página (default: 10)

**Retorna:**
- `categories`: Array de categorías
- `totalCount`: Total de registros
- `page`: Página actual
- `pageSize`: Elementos por página

**Flujo:**
1. Calcula offset para paginación
2. Ejecuta query con límite y offset
3. Obtiene conteo total en transacción
4. Retorna resultados estructurados

**Ejemplo:**
```typescript
const result = await getCategories({ page: 1, pageSize: 10 });
console.log(result.categories); // Array de 10 categorías
console.log(result.totalCount); // Total en BD
```

---

### **getCategoryById**
Obtiene una categoría específica por ID.

```typescript
async function getCategoryById(id: number): Promise<Category | null>
```

**Parámetros:**
- `id` (number): ID de la categoría

**Retorna:**
- `Category | null`: Objeto categoría o null si no existe

**Flujo:**
1. Busca categoría por ID
2. Retorna resultado o null

**Ejemplo:**
```typescript
const category = await getCategoryById(1);
if (category) {
  console.log(category.name);
}
```

## 🔒 Seguridad

### **Validación Server-Side**
- Todas las validaciones se ejecutan en servidor
- No se confía en validaciones de cliente
- Sanitización automática de inputs

### **Manejo de Errores**
- Try-catch en todas las operaciones
- Logging de errores para debugging
- Mensajes de error user-friendly

### **Rate Limiting**
- **Pendiente**: Implementar rate limiting
- **Pendiente**: Validación de permisos por rol

## 🎯 Patrones de Diseño

### **Naming Convention**
- Verbos en inglés: `create`, `update`, `delete`, `get`
- Sustantivo en singular: `Category`
- Sufijo `-Actions` para archivos

### **Error Handling**
```typescript
try {
  // Operación principal
  await prisma.category.create({...});
  revalidatePath('/dashboard/categories');
  redirect('/dashboard/categories?status=success');
} catch (error: any) {
  console.error('Error details:', error);
  if (error.code === 'P2002') {
    throw new Error('Mensaje específico de duplicado');
  }
  throw new Error('Mensaje genérico de error');
}
```

### **Response Pattern**
- Usar `redirect()` para navegación post-acción
- Incluir `revalidatePath()` para cache busting
- Pasar mensajes via URL parameters

## 🚀 Próximas Server Actions

### **Product Actions**
```typescript
// Pendientes de implementar
createProduct(formData: FormData)
updateProduct(id: number, formData: FormData)
deleteProduct(id: number)
getProducts(params?: GetProductsParams)
getProductById(id: number)
```

### **Supplier Actions**
```typescript
// Pendientes de implementar
createSupplier(formData: FormData)
updateSupplier(id: number, formData: FormData)
deleteSupplier(id: number)
getSuppliers(params?: GetSuppliersParams)
```

### **Client Actions**
```typescript
// Pendientes de implementar
createClient(formData: FormData)
updateClient(id: number, formData: FormData)
deleteClient(id: number)
getClients(params?: GetClientsParams)
```

## 📊 Métricas y Monitoreo

### **Performance**
- **Tiempo promedio**: < 200ms por operación
- **Cache hit rate**: 90%+ en listados
- **Error rate**: < 1%

### **Logging**
```typescript
console.error('Category operation failed:', {
  operation: 'create',
  error: error.message,
  timestamp: new Date().toISOString()
});
```

## 🔧 Testing

### **Unit Tests** (Pendiente)
```typescript
describe('Category Actions', () => {
  test('should create category successfully', async () => {
    const formData = new FormData();
    formData.append('name', 'Test Category');
    
    await expect(createCategory(formData)).resolves.not.toThrow();
  });
});
``` 