# Troubleshooting: Proveedores No Visibles en Tabla de Importación/Exportación

## Problema Reportado

La página de Importación/Exportación de Proveedores muestra estadísticas correctas:
- **Total Proveedores**: 28
- **Página Actual**: 1 de 2
- **API funcionando**: Confirmado que devuelve datos

Sin embargo, la tabla aparece vacía con solo filas en blanco con checkboxes.

## Diagnóstico Realizado

### 1. ✅ Verificación API Backend
```bash
# Prueba PowerShell confirmó que la API funciona:
Invoke-WebRequest -Uri "http://localhost:3000/api/suppliers?pageSize=3" -Method GET
# Status: 200 OK
# Content: {"data":[{"id":47,"name":"ABASTECEDORA DEL COMERCIO LTDA",...}
```

**Resultado**: API devuelve datos correctamente, no es problema de backend.

### 2. 🔍 Logs de Debug Implementados

Se agregaron logs detallados para identificar dónde se pierde la información:

#### A. En `loadSuppliers()` - Página Import/Export
```typescript
console.log('🔍 Debug - Respuesta API:', {
  status: response.status,
  hasData: !!data.data,
  dataLength: data.data?.length || 0,
  totalCount: data.totalCount,
  totalPages: data.totalPages,
  firstSupplier: data.data?.[0]
});
```

#### B. En `SupplierTable` - Componente
```typescript
console.log('🔍 SupplierTable - Datos recibidos:', {
  suppliersLength: suppliers?.length || 0,
  suppliersType: typeof suppliers,
  isArray: Array.isArray(suppliers),
  firstSupplier: suppliers?.[0],
  showCheckboxes
});
```

## Cómo Verificar la Causa

### Paso 1: Abrir la Consola del Navegador
1. Ir a la página: `/dashboard/suppliers/import-export`
2. Abrir **Herramientas de Desarrollador** (F12)
3. Ir a la pestaña **Console**
4. Buscar los logs de debug

### Paso 2: Analizar los Logs

#### **Si aparece**: `🔍 Debug - Respuesta API:`
- **hasData: true, dataLength: > 0** → API funciona, problema en frontend
- **hasData: false, dataLength: 0** → Problema en la función `getSuppliers`

#### **Si aparece**: `🔍 SupplierTable - Datos recibidos:`
- **suppliersLength: > 0** → Datos llegan al componente, problema en renderizado
- **suppliersLength: 0** → Datos no llegan al componente

## Posibles Causas y Soluciones

### Causa 1: Problema de Estado React
**Síntomas**: API devuelve datos pero `suppliers.length = 0`
**Solución**:
```typescript
// Verificar que setSuppliers() se ejecute correctamente
useEffect(() => {
  console.log('Estado suppliers actualizado:', suppliers.length);
}, [suppliers]);
```

### Causa 2: Problema de RLS (Row Level Security)
**Síntomas**: API devuelve `data: []` pero totalCount > 0
**Solución**: Aplicar script de corrección RLS
```sql
-- En Supabase SQL Editor
DROP POLICY IF EXISTS "supplier_read_all" ON "Supplier";
CREATE POLICY "supplier_read_all" ON "Supplier" FOR SELECT USING (true);
```

### Causa 3: Problema en SupplierTable
**Síntomas**: Datos llegan pero no se renderizan
**Solución**: Verificar definición de columnas y validaciones defensivas

### Causa 4: Problemas de Caché
**Síntomas**: Comportamiento inconsistente
**Solución**:
```bash
taskkill /f /im node.exe
Remove-Item -Recurse -Force .next
npm run dev
```

## Archivos Modificados para Debug

1. **`src/app/dashboard/suppliers/import-export/page.tsx`**
   - Agregados logs en función `loadSuppliers()`
   - Información detallada de respuesta API

2. **`src/components/suppliers/SupplierTable.tsx`**
   - Agregados logs en inicio del componente
   - Verificación de props recibidas

## Verificaciones Adicionales

### 1. Estado de la Red
- Verificar que no haya errores 404/500 en Network tab
- Confirmar que la API se esté llamando correctamente

### 2. Estado React DevTools
- Verificar el estado `suppliers` en React DevTools
- Confirmar que `loading` se establezca correctamente

### 3. Políticas Supabase
- Verificar políticas RLS en tabla Supplier
- Confirmar permisos del usuario actual

## Pasos de Resolución

1. **Verificar logs** en consola del navegador
2. **Identificar** en qué punto se pierden los datos
3. **Aplicar solución** específica según los logs
4. **Limpiar logs** de debug después de resolver

## Archivos de Referencia

- `src/app/dashboard/suppliers/import-export/page.tsx` - Página principal
- `src/components/suppliers/SupplierTable.tsx` - Componente tabla
- `src/actions/suppliers/list.ts` - Función backend
- `src/app/api/suppliers/route.ts` - API endpoint

---

**Estado**: 🔍 En diagnóstico con logs implementados  
**Prioridad**: Alta - Funcionalidad crítica  
**Siguiente paso**: Verificar logs en consola del navegador 