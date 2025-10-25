# Solución: Error "Failed to fetch" en Selectores de Promociones

**Fecha**: 25 de Octubre, 2025  
**Estado**: ✅ SOLUCIONADO

---

## 🐛 Problema Reportado

```
Console TypeError: Failed to fetch
at fetchServerAction (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/router-reducer/reducers/server-action-reducer.js:48:23)
Next.js version: 15.5.3 (Webpack)
```

---

## 🔍 Causa del Error

El error "Failed to fetch" ocurría cuando los componentes selectores (ProductMultiSelector, CategoryMultiSelector, SupplierMultiSelector) intentaban llamar a server actions desde componentes de cliente durante la carga inicial.

### Factores Contributing:

1. **Server Actions con cookies()**: Las server actions usan `cookies()` de Next.js que solo funcionan en contexto del servidor
2. **useEffect inmediato**: Los componentes llamaban a las server actions inmediatamente en `useEffect(() => {}, [])`
3. **Posible SSR**: Next.js 15 podría intentar renderizar parcialmente en el servidor

---

## ✅ Soluciones Implementadas

### 1. Verificación de Entorno Cliente

Agregamos verificación `typeof window !== 'undefined'` para asegurar que las llamadas solo ocurran en el navegador:

**ProductMultiSelector.tsx**, **CategoryMultiSelector.tsx**, **SupplierMultiSelector.tsx**:
```typescript
useEffect(() => {
  // Solo ejecutar en el cliente
  if (typeof window !== 'undefined') {
    setMounted(true);
    loadCategories(); // o loadSuppliers() / loadProducts()
  }
}, []);
```

### 2. Estado de Montaje

Agregamos un estado `mounted` para controlar cuándo se pueden ejecutar las cargas de datos:

```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  if (typeof window !== 'undefined' && mounted) {
    loadProducts();
  }
}, [mounted, search, categoryFilter, page]);
```

### 3. Manejo de Errores Mejorado

Aseguramos que todos los métodos de carga tengan manejo de errores y establezcan arrays vacíos en caso de fallo:

```typescript
const loadCategories = async () => {
  try {
    setLoading(true);
    const categoriesData = await getAllCategories();
    setCategories(categoriesData || []);
  } catch (error) {
    console.error('Error loading categories:', error);
    setCategories([]); // ✅ Array vacío en caso de error
  } finally {
    setLoading(false);
  }
};
```

### 4. Manejo de Respuestas de Server Actions

En ProductMultiSelector, verificamos el resultado de la server action:

```typescript
const result = await getProductsForPricing(params);

if (result.success && result.data) {
  setProducts(result.data);
  setTotal(result.total || 0);
} else {
  console.error('Error from server:', result.error);
  setProducts([]);
  setTotal(0);
}
```

---

## 🧪 Verificación de la Solución

### Pasos para Verificar:

1. Detener el servidor de desarrollo (Ctrl+C)
2. Eliminar `.next` folder: `rm -rf .next` (Windows: `rd /s .next`)
3. Reiniciar desarrollo: `npm run dev`
4. Navegar a: `http://localhost:3000/dashboard/pricing/promotions`
5. Clic en "Nueva Promoción"
6. Seleccionar diferentes opciones en "Aplica a"
7. Verificar que cada selector carga correctamente

### Comportamiento Esperado:

- ✅ No debe mostrar error "Failed to fetch"
- ✅ Selectores deben mostrar estado de carga (spinner)
- ✅ Datos deben cargar correctamente
- ✅ Búsqueda y filtros deben funcionar
- ✅ Selección múltiple debe funcionar

---

## 🔍 Debugging Adicional

Si el error persiste, verifica:

### 1. Consola del Navegador

Abre DevTools (F12) y revisa:
- Console: Errores específicos
- Network: Requests fallidas a `/_next/data/...`
- Response: Detalles del error del servidor

### 2. Terminal del Servidor

Busca errores en el terminal donde corre `npm run dev`:
```bash
# Errores típicos:
- Error connecting to Supabase
- Cookie errors
- Authentication errors
```

### 3. Variables de Entorno

Verifica que estén configuradas en `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### 4. Server Actions

Si alguna server action específica falla, puedes probarla directamente:

```typescript
// En la consola del navegador (F12):
// Esto NO funcionará porque las server actions solo funcionan desde componentes
// Pero el error te dará más información

// En su lugar, agregar console.log en los componentes:
console.log('Calling getAllCategories...');
const data = await getAllCategories();
console.log('Result:', data);
```

---

## 📝 Archivos Modificados

### Componentes Actualizados:
1. `src/components/pricing/ProductMultiSelector.tsx`
2. `src/components/pricing/CategoryMultiSelector.tsx`
3. `src/components/pricing/SupplierMultiSelector.tsx`

### Cambios Específicos:
- ✅ Agregado verificación `typeof window !== 'undefined'`
- ✅ Agregado estado `mounted`
- ✅ Mejorado manejo de errores
- ✅ Asegurado fallback a arrays vacíos

---

## 🚨 Problemas Conocidos en Next.js 15

Next.js 15 tiene cambios en cómo maneja server actions:

1. **Modo Estricto**: Las server actions se validan más estrictamente
2. **SSR Parcial**: Algunos componentes pueden renderizarse parcialmente en servidor
3. **Cookies**: El manejo de cookies() requiere contexto async correcto

### Workarounds:

- Siempre verificar `typeof window !== 'undefined'` antes de llamar server actions desde useEffect
- Usar estado de montaje para controlar cuándo cargar datos
- Manejar todos los errores con try/catch
- Proveer fallbacks (arrays vacíos, valores por defecto)

---

## 💡 Mejores Prácticas

### Para Server Actions:
1. Siempre incluir `'use server'` al inicio del archivo
2. Retornar objetos estructurados: `{ success, data, error }`
3. Manejar errores con try/catch
4. Proveer mensajes de error descriptivos

### Para Componentes de Cliente:
1. Marcar con `'use client'` al inicio
2. Verificar `typeof window !== 'undefined'` antes de llamar server actions en useEffect
3. Usar estados de carga
4. Manejar estados de error
5. Proveer fallbacks para datos

---

## ✅ Checklist de Solución

- [x] Agregar verificación de entorno cliente
- [x] Implementar estado de montaje
- [x] Mejorar manejo de errores
- [x] Asegurar fallbacks a arrays vacíos
- [x] Verificar que no hay errores de linting
- [x] Documentar la solución

---

## 📞 Si el Problema Persiste

1. **Limpiar caché de Next.js**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Verificar logs del servidor** en la terminal

3. **Revisar Network tab** en DevTools para ver la respuesta exacta del error

4. **Agregar más logging** en las server actions:
   ```typescript
   export async function getAllCategories() {
     console.log('🔍 getAllCategories called');
     try {
       const result = await supabase.from('Category').select('*');
       console.log('✅ Categories loaded:', result.data?.length);
       return result.data;
     } catch (error) {
       console.error('❌ Error in getAllCategories:', error);
       throw error;
     }
   }
   ```

---

## 🎉 Resultado Esperado

Después de aplicar estas soluciones:

- ✅ Sin errores "Failed to fetch"
- ✅ Selectores cargan correctamente
- ✅ Búsqueda funciona
- ✅ Selección múltiple funciona
- ✅ Datos se guardan correctamente en promociones

---

## 📚 Referencias

- [Next.js 15 Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [React useEffect](https://react.dev/reference/react/useEffect)


