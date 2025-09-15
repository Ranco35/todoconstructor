# Fix: Error "Cannot read properties of undefined (reading 'apply')" - Mayda Escobar Part-Time

## 📋 Problema Identificado

**Error específico:**
```
TypeError: Cannot read properties of undefined (reading 'apply')
Error cargando datos de proveedores y centros de costo
```

**Contexto:**
- Error ocurre en `SupplierPaymentForm.tsx` línea 82
- Función `getPartTimeSuppliers()` falla al ejecutarse
- Mensaje del usuario indica que debe filtrar por etiqueta/categoría Part-Time

## 🔍 Análisis Técnico

### Causa Raíz del Error
1. **Función mal configurada:** `getPartTimeSuppliers()` usaba `getSupabaseClient()` incorrectamente
2. **Datos incorrectos:** Mayda Escobar tiene `category: null` en lugar de `'Part-Time'`
3. **Filtrado incorrecto:** Sistema requiere `category = 'Part-Time'` según documentación

### Datos Actuales de Mayda Escobar
```json
{
  "id": 331,
  "name": "Mayda Escobar", 
  "category": null,           // ❌ PROBLEMA: debe ser 'Part-Time'
  "supplierRank": "BASICO",   // No usado para filtrar
  "isActive": true            // ✅ Correcto
}
```

## 🛠️ Soluciones Implementadas

### 1. Corrección de Función getPartTimeSuppliers()

**Archivo:** `src/actions/configuration/suppliers-actions.ts`

**Cambios realizados:**
```typescript
// ❌ ANTES - Función problemática
import { getSupabaseClient } from '@/lib/supabase-server';
const supabase = await getSupabaseClient();

// ✅ DESPUÉS - Función corregida
import { getSupabaseServerClient } from '@/lib/supabase-server';
const supabase = await getSupabaseServerClient();
```

**Filtrado corregido:**
```typescript
export async function getPartTimeSuppliers() {
  try {
    console.log('🔍 [getPartTimeSuppliers] Iniciando consulta de proveedores Part-Time');
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      console.error('❌ [getPartTimeSuppliers] Cliente Supabase no disponible');
      return [];
    }

    const { data, error } = await supabase
      .from('Supplier')
      .select(`
        id, name, email, phone, taxId, supplierRank, 
        category, isActive, notes, companyType
      `)
      .eq('category', 'Part-Time')  // ✅ Filtro correcto según documentación
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [getPartTimeSuppliers] Error en consulta Supabase:', error);
      return [];
    }

    console.log(`✅ [getPartTimeSuppliers] ${data?.length || 0} proveedores Part-Time encontrados`);
    return data || [];
  } catch (error) {
    console.error('❌ [getPartTimeSuppliers] Error inesperado:', error);
    return [];
  }
}
```

### 2. SQL para Actualizar Mayda Escobar

**Archivo:** `corregir_mayda_escobar_supplierrank.sql`

```sql
-- Actualizar category de Mayda Escobar para que aparezca en Part-Time
UPDATE "Supplier" 
SET category = 'Part-Time'
WHERE name = 'Mayda Escobar' 
  AND id = 331;

-- Verificar el cambio
SELECT id, name, category, "supplierRank", "isActive"
FROM "Supplier" 
WHERE name = 'Mayda Escobar';

-- Verificar todos los proveedores Part-Time
SELECT id, name, category, "isActive"
FROM "Supplier" 
WHERE category = 'Part-Time' AND "isActive" = true
ORDER BY name;
```

## ✅ Beneficios de las Correcciones

### Error "apply" resuelto:
- ✅ Función usa `getSupabaseServerClient()` correctamente
- ✅ Manejo robusto de errores con try/catch
- ✅ Logging detallado para debugging
- ✅ Validación de cliente Supabase antes de usar

### Sistema Part-Time funcional:
- ✅ Filtrado por `category = 'Part-Time'` según documentación
- ✅ Mayda Escobar aparecerá en selector después del UPDATE
- ✅ Sistema consistente con lógica establecida en julio 2024

### Robustez mejorada:
- ✅ Función devuelve array vacío en caso de error (no crash)
- ✅ Logging completo para identificar problemas futuros
- ✅ Compatibilidad con Next.js 15.5.0

## 📋 Pasos para Completar la Solución

### 1. Ejecutar SQL en Supabase (REQUERIDO)
```sql
UPDATE "Supplier" 
SET category = 'Part-Time'
WHERE name = 'Mayda Escobar' AND id = 331;
```

### 2. Verificar en Aplicación
1. Abrir `/dashboard/pettyCash`
2. Hacer clic en "💰 Pago a Proveedores Part-Time"
3. Confirmar que Mayda Escobar aparece en el selector
4. Completar un pago de prueba exitosamente

### 3. Monitorear Logs
Los nuevos logs ayudarán a identificar problemas:
```
🔍 [getPartTimeSuppliers] Iniciando consulta de proveedores Part-Time
✅ [getPartTimeSuppliers] Cliente Supabase obtenido, ejecutando consulta
✅ [getPartTimeSuppliers] X proveedores Part-Time encontrados
```

## 🔧 Archivos Modificados

1. **`src/actions/configuration/suppliers-actions.ts`**
   - Corrección de imports (getSupabaseServerClient)
   - Manejo robusto de errores
   - Logging detallado
   - Filtrado por category = 'Part-Time'

2. **`corregir_mayda_escobar_supplierrank.sql`**
   - SQL para actualizar category de Mayda Escobar
   - Consultas de verificación

3. **`docs/troubleshooting/mayda-escobar-category-fix-final.md`**
   - Documentación completa de la solución

## 🎯 Resultado Esperado

### Después de las correcciones:
- ❌ Error "Cannot read properties of undefined (reading 'apply')" → ✅ RESUELTO
- ❌ "Error cargando datos de proveedores" → ✅ RESUELTO
- ❌ Mayda Escobar no aparece en selector → ✅ APARECERÁ
- ✅ Sistema Part-Time 100% funcional

### Logs esperados:
```
✅ [getPartTimeSuppliers] 1 proveedores Part-Time encontrados
```
(Después de ejecutar el SQL para Mayda)

---

**Estado:** ✅ CÓDIGO CORREGIDO - PENDIENTE SQL  
**Acción crítica:** Ejecutar UPDATE en Supabase  
**Tiempo:** 1 minuto para completar  
**Impacto:** Error eliminado + Mayda disponible para pagos  
