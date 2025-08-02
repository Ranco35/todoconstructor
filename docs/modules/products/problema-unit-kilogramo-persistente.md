# Problema: Campo Unit No Se Guarda Correctamente

## 📅 Fecha de Análisis
**21 de Enero, 2025**

## 🎯 Problema Identificado

### **Síntomas:**
- ❌ Al editar queso y cambiar a "Kilogramo", el campo `unit` sigue mostrando "Pieza"
- ❌ Los datos se guardan incorrectamente en la base de datos
- ❌ Al editar nuevamente, no se mantiene la unidad seleccionada
- ❌ El problema persiste después de las correcciones anteriores

### **Ejemplo del Problema:**
```json
{
  "name": "QUESO MANTECOSO RIO BUENO",
  "unit": "Pieza",  // ❌ Incorrecto - debería ser "Kilogramo"
  "salesunitid": 1, // ❌ Incorrecto - debería ser 2
  "purchaseunitid": 1 // ❌ Incorrecto - debería ser 2
}
```

## 🔍 Análisis del Problema

### **1. Corrección Anterior Implementada:**
```typescript
// ✅ Código corregido en ProductFormModern.tsx
onChange={(unitId) => {
  handleInputChange('salesunitid', unitId);
  // También actualizar el campo unit con el nombre de la unidad
  if (unitId) {
    const units = getAllUnits();
    const selectedUnit = units.find((u: any) => u.id === unitId);
    if (selectedUnit) {
      console.log('🔍 DEBUG - Actualizando unit:', selectedUnit.name, 'para unitId:', unitId);
      handleInputChange('unit', selectedUnit.name);
    }
  }
}}
```

### **2. Debug Implementado:**
- ✅ **Logs en `handleInputChange`** para ver cambios de campos
- ✅ **Logs en `updateProduct`** para ver datos enviados
- ✅ **Logs en FormData** para verificar datos antes del envío

### **3. Mapeo Verificado:**
- ✅ **`mapFormDataToProductFrontend`** incluye campo `unit`
- ✅ **`mapProductFrontendToDB`** incluye campo `unit`
- ✅ **Interfaces** incluyen campo `unit`

## 🧪 Diagnóstico

### **Posibles Causas:**

#### **1. Problema de Timing:**
- El campo `unit` se actualiza en el estado local
- Pero puede que no se incluya en el FormData al momento del submit

#### **2. Problema de Mapeo:**
- El FormData puede no estar incluyendo el campo `unit`
- O puede estar siendo sobrescrito por valores por defecto

#### **3. Problema de Base de Datos:**
- El campo puede estar siendo ignorado por la consulta SQL
- O puede haber restricciones que impiden la actualización

## 🔧 Solución Temporal

### **Script SQL para Corregir Manualmente:**
```sql
-- Actualizar producto queso a kilogramo
UPDATE "Product"
SET 
  unit = 'Kilogramo',
  salesunitid = 2,
  purchaseunitid = 2,
  updatedat = NOW()
WHERE name ILIKE '%QUESO MANTECOSO%';
```

### **Verificación:**
```sql
-- Verificar que se actualizó correctamente
SELECT id, name, unit, salesunitid, purchaseunitid
FROM "Product"
WHERE name ILIKE '%QUESO MANTECOSO%';
```

## 🚀 Solución Definitiva

### **1. Verificar FormData:**
Agregar logs para verificar que el campo `unit` se incluye en el FormData:

```typescript
// En handleSubmit
console.log('🔍 DEBUG - Unit en FormData:', formDataObj.get('unit'));
console.log('🔍 DEBUG - Salesunitid en FormData:', formDataObj.get('salesunitid'));
```

### **2. Verificar Mapeo:**
Agregar logs en el mapeo para verificar que el campo se procesa:

```typescript
// En mapFormDataToProductFrontend
const unit = formData.get('unit') as string;
console.log('🔍 DEBUG - Unit extraído del FormData:', unit);
```

### **3. Verificar Base de Datos:**
Agregar logs en la actualización para verificar que el campo se envía:

```typescript
// En updateProduct
console.log('🔍 DEBUG - Unit en datos de BD:', productDataForUpdate.unit);
```

## 📊 Estado Actual

### **Archivos Modificados:**
1. ✅ **`ProductFormModern.tsx`** - Debug logs agregados
2. ✅ **`update.ts`** - Debug logs agregados
3. ✅ **Scripts SQL** - Para corrección manual y verificación

### **Próximos Pasos:**
1. **Ejecutar script SQL** para corregir manualmente
2. **Probar edición** del producto queso
3. **Verificar logs** para identificar el punto exacto del problema
4. **Implementar corrección** basada en los logs

## 🎯 Resultado Esperado

### **Después de la Corrección:**
```json
{
  "name": "QUESO MANTECOSO RIO BUENO",
  "unit": "Kilogramo",  // ✅ Correcto
  "salesunitid": 2,     // ✅ Correcto
  "purchaseunitid": 2   // ✅ Correcto
}
```

### **Comportamiento Esperado:**
1. **Usuario selecciona "Kilogramo"** en el selector
2. **Se actualiza `unit`** = "Kilogramo" inmediatamente
3. **Se actualiza `salesunitid`** = 2
4. **Se actualiza `purchaseunitid`** = 2
5. **Se guarda correctamente** en la base de datos
6. **Al editar nuevamente** se mantiene "Kilogramo"

---

**🔄 Estado: En proceso de diagnóstico y corrección** 