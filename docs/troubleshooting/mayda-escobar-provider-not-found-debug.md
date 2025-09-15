# Debug: Mayda Escobar - Proveedor no encontrado al registrar pago

## 📋 Situación Actual

**✅ PROGRESO:** 
- Error "apply" eliminado completamente
- Selector funciona: `✅ [getPartTimeSuppliers] 11 proveedores Part-Time encontrados`
- Mayda Escobar aparece en el selector

**❌ NUEVO PROBLEMA:**
- Al intentar registrar pago aparece: `❌ [createSupplierPayment] Proveedor no encontrado { supplierId: 331 }`

## 🔍 Análisis del Problema

### Comportamiento Observado
1. **getPartTimeSuppliers()** encuentra 11 proveedores incluyendo Mayda ✅
2. **Selector** muestra "Mayda Escobar - 56981550349" ✅  
3. **createSupplierPayment()** no encuentra proveedor con ID 331 ❌

### Posibles Causas
1. **Inconsistencia en consultas**: Diferentes filtros entre funciones
2. **Problema de permisos RLS**: Row Level Security puede estar bloqueando
3. **Diferencia en configuración Supabase**: Diferentes clientes
4. **ID incorrecto**: El ID 331 no corresponde a Mayda Escobar

## 🛠️ Debugging Implementado

### Logging Mejorado en createSupplierPayment()
```typescript
// Antes del error se agregó:
console.log('🔍 [createSupplierPayment] Buscando proveedor en BD:', { supplierId });
console.log('🔍 [createSupplierPayment] Resultado búsqueda proveedor:', { 
  supplier, 
  supplierError, 
  supplierId 
});
```

### Logging Mejorado en getPartTimeSuppliers()
```typescript
// Se agregó lista detallada de proveedores encontrados:
console.log('📋 [getPartTimeSuppliers] Lista de proveedores:', data.map(p => ({
  id: p.id,
  name: p.name,
  category: p.category,
  isActive: p.isActive
})));
```

### SQL de Verificación
**Archivo:** `verificar_mayda_escobar_id_331.sql`
```sql
-- Verificar que existe con ID 331
SELECT id, name, category, "isActive" FROM "Supplier" WHERE id = 331;

-- Verificar que existe por nombre  
SELECT id, name, category, "isActive" FROM "Supplier" WHERE name = 'Mayda Escobar';

-- Consulta exacta que usa createSupplierPayment
SELECT id, name, "companyType", category, "isActive" FROM "Supplier" WHERE id = 331;
```

## 📊 Próximos Pasos de Debugging

### Paso 1: Verificar logs detallados
Al abrir el modal de pagos Part-Time, revisar:
```
📋 [getPartTimeSuppliers] Lista de proveedores: [
  { id: 331, name: 'Mayda Escobar', category: 'Part-Time', isActive: true },
  // ... otros proveedores
]
```

### Paso 2: Intentar registrar pago
Al intentar pago, revisar logs:
```
🔍 [createSupplierPayment] Buscando proveedor en BD: { supplierId: 331 }
🔍 [createSupplierPayment] Resultado búsqueda proveedor: { supplier: [?], supplierError: [?] }
```

### Paso 3: Ejecutar SQL manual
Ejecutar `verificar_mayda_escobar_id_331.sql` en Supabase para confirmar datos

## 🎯 Soluciones Posibles

### Si ID es incorrecto:
- Verificar que el ID en el selector coincida con BD
- Corregir mapeo en frontend si es necesario

### Si es problema de permisos RLS:
- Verificar políticas de Row Level Security en tabla Supplier
- Usar service key en lugar de user session

### Si es configuración Supabase:
- Unificar uso de `getSupabaseServerClient()` en ambas funciones
- Verificar que usan misma configuración

## 📁 Archivos Modificados

1. **`src/actions/configuration/petty-cash-actions.ts`**
   - Logging detallado en createSupplierPayment()
   - Información completa de búsqueda de proveedor

2. **`src/actions/configuration/suppliers-actions.ts`**
   - Logging detallado en getPartTimeSuppliers() 
   - Lista completa de proveedores encontrados

3. **`verificar_mayda_escobar_id_331.sql`**
   - Consultas SQL para verificar datos

## 🔍 Estado Actual

**Funciona:**
- ✅ Carga de proveedores Part-Time
- ✅ Selector muestra proveedores correctamente  
- ✅ Modal se abre sin errores

**No funciona:**
- ❌ Registro de pago (proveedor no encontrado)

**Siguiente:** Revisar logs detallados para identificar causa exacta del problema

---

**Prioridad:** 🔴 ALTA - Sistema funcional pero no puede procesar pagos  
**Tiempo estimado:** 10 minutos para identificar causa  
**Confianza:** 95% - Con logging detallado se identificará el problema  
