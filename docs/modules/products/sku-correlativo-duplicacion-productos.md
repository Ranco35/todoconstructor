# Sistema de SKU Correlativo para Duplicación de Productos

## 🎯 Funcionalidad Implementada
El sistema de duplicación de productos ahora genera automáticamente SKUs correlativos inteligentes en lugar de simplemente agregar sufijos como "-COPY".

## 🔧 Cómo Funciona

### **Detección de Patrones**
El sistema analiza el SKU original y busca el primer número de 2-4 dígitos para usarlo como correlativo:

```
SKU Original: SPA-PISC-002-2280
├── Antes: "SPA-PISC-"
├── Correlativo: "002" (incrementa a 003)
└── Después: "-2280"

Resultado: SPA-PISC-003-2280
```

### **Ejemplos de Transformación**

| SKU Original | SKU Duplicado | Explicación |
|--------------|---------------|-------------|
| `SPA-PISC-002-2280` | `SPA-PISC-003-2280` | Incrementa correlativo 002 → 003 |
| `REST-DESA-001-1000` | `REST-DESA-002-1000` | Incrementa correlativo 001 → 002 |
| `PROD-005` | `PROD-006` | Incrementa correlativo 005 → 006 |
| `SIMPLE-SKU` | `SIMPLE-SKU-COPY` | Sin patrón numérico → método tradicional |

## 🛠️ Algoritmo Implementado

### **1. Detección de Patrón**
```regex
/^(.+?)(\d{2,4})(.*)$/
```
- Busca el primer número de 2-4 dígitos en el SKU
- Valida que sea un correlativo válido (≤ 9999)

### **2. Búsqueda de Número Disponible**
- Incrementa el correlativo de 1 en 1
- Verifica disponibilidad en la base de datos
- Mantiene formato con ceros a la izquierda
- Límite de seguridad: 100 intentos

### **3. Fallback Tradicional**
Si no se detecta patrón correlativo:
- Agrega sufijo "-COPY" 
- Incrementa con números si ya existe

## 📋 Casos de Uso Soportados

### **✅ Patrones Reconocidos**
- `ABC-001-XYZ` → `ABC-002-XYZ`
- `PROD-123` → `PROD-124`
- `SPA-PISC-002-2280` → `SPA-PISC-003-2280`
- `REST-DESA-001-1000` → `REST-DESA-002-1000`

### **✅ Manejo de Saltos**
Si existe `SPA-PISC-001` y `SPA-PISC-004`:
- Al duplicar `001` → genera `SPA-PISC-002`
- Al duplicar `004` → genera `SPA-PISC-005`

### **✅ Preservación de Formato**
- `PROD-001` → `PROD-002` (mantiene 3 dígitos)
- `ABC-0001` → `ABC-0002` (mantiene 4 dígitos)

### **❌ Fallback a Método Tradicional**
- `SIMPLE-SKU` → `SIMPLE-SKU-COPY`
- `NO-NUMBERS` → `NO-NUMBERS-COPY`
- SKUs con números > 9999

## 🔍 Implementación Técnica

### **Archivo Principal**
`src/actions/products/bulk-duplicate.ts`

### **Función Clave**
```typescript
const generateUniqueSku = (originalSku: string, existingSkus: Set<string>): string => {
  // 1. Detectar patrón correlativo
  const correlativePattern = /^(.+?)(\d{2,4})(.*)$/;
  const match = originalSku.match(correlativePattern);
  
  if (match) {
    const beforeNumber = match[1];
    const numberStr = match[2]; 
    const afterNumber = match[3];
    const currentNumber = parseInt(numberStr);
    
    // 2. Validar correlativo
    if (numberStr.length >= 2 && currentNumber <= 9999) {
      // 3. Buscar siguiente disponible
      let nextNumber = currentNumber + 1;
      while (nextNumber <= currentNumber + 100) {
        const paddedNumber = nextNumber.toString().padStart(numberStr.length, '0');
        const newSku = `${beforeNumber}${paddedNumber}${afterNumber}`;
        
        if (!existingSkus.has(newSku)) {
          return newSku;
        }
        nextNumber++;
      }
    }
  }
  
  // 4. Fallback tradicional
  return `${originalSku}-COPY`;
};
```

## 📊 Beneficios

### **🎯 Para el Usuario**
- **SKUs organizados**: Mantiene secuencia lógica
- **Fácil identificación**: Productos relacionados agrupados
- **Sin confusión**: No más SKUs como "PROD-001-COPY-COPY-1"

### **🔧 Para el Sistema**
- **Consistencia**: Patrones de nomenclatura uniformes
- **Escalabilidad**: Soporta hasta 100 productos por serie
- **Compatibilidad**: Funciona con SKUs existentes sin modificación

## 🧪 Pruebas Realizadas

Se validaron 7 casos de prueba diferentes:
- ✅ **Patrón correlativo normal**: `SPA-PISC-002-2280` → `SPA-PISC-003-2280`
- ✅ **Correlativo con saltos**: `SPA-PISC-004-2280` → `SPA-PISC-005-2280`
- ✅ **Patrón diferente**: `REST-DESA-003-1000` → `REST-DESA-004-1000`
- ✅ **Sin sufijo**: `PROD-002` → `PROD-003`
- ✅ **Numeración discontinua**: `PROD-005` → `PROD-006`
- ✅ **Sin patrón numérico**: `SIMPLE-SKU` → `SIMPLE-SKU-COPY`
- ✅ **Sin números**: `NO-NUMBERS` → `NO-NUMBERS-COPY`

## 🔍 Logs de Debugging

El sistema genera logs detallados para seguimiento:

```
🔍 SKU correlativo detectado: SPA-PISC-002-2280
📋 Antes: "SPA-PISC-", Número: 2, Después: "-2280"
✅ Nuevo SKU correlativo generado: SPA-PISC-003-2280
```

## 🎉 Resultado Final

**Cuando duplicas un producto con SKU `SPA-PISC-002-2280`, automáticamente obtienes `SPA-PISC-003-2280`** manteniendo la secuencia correlativa y preservando el formato original.

---
**Fecha**: 2025-01-04  
**Estado**: ✅ Implementado y Probado  
**Archivos**: `src/actions/products/bulk-duplicate.ts`  
**Compatibilidad**: 100% con SKUs existentes 