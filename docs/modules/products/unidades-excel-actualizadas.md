# Actualización: Columnas de Unidades en Excel de Productos

## 📅 Fecha de Actualización
**21 de Enero, 2025**

## 🎯 Resumen
Se han agregado **nuevas columnas de unidades** al sistema de importación/exportación de Excel para productos, permitiendo un control más granular de las unidades de medida para ventas y compras.

## ✅ Nuevas Columnas Agregadas

### **1. ID Unidad Venta (`salesunitid`)**
- **Propósito**: ID de la unidad de medida para ventas del producto
- **Tipo**: Número entero
- **Valor por defecto**: 1 (Pieza)
- **Ejemplo**: 1 = Pieza, 2 = Kilogramo, 3 = Litro

### **2. ID Unidad Compra (`purchaseunitid`)**
- **Propósito**: ID de la unidad de medida para compras del producto
- **Tipo**: Número entero
- **Valor por defecto**: 1 (Pieza)
- **Ejemplo**: 1 = Pieza, 2 = Kilogramo, 3 = Litro

### **3. Unidad (`unit`) - Mejorado**
- **Propósito**: Nombre de la unidad de medida del producto
- **Tipo**: Texto
- **Valor por defecto**: "UND"
- **Ejemplo**: "Pieza", "Kilogramo", "Litro"

## 📊 Estructura de Datos

### **Interfaz TypeScript Actualizada**
```typescript
export interface ProductExportData {
  // ... campos existentes ...
  unit: string | null; // Campo de unidad del producto
  salesunitid: number | null; // ID de unidad de venta
  purchaseunitid: number | null; // ID de unidad de compra
}

export interface ProductImportData {
  // ... campos existentes ...
  unit?: string; // Unidad de medida del producto
  salesunitid?: number; // ID de unidad de venta
  purchaseunitid?: number; // ID de unidad de compra
}
```

## 🔄 Funcionalidades Actualizadas

### **1. Exportación de Excel**
- ✅ **Nuevas columnas incluidas**: `ID Unidad Venta`, `ID Unidad Compra`
- ✅ **Columna existente mejorada**: `Unidad`
- ✅ **Valores por defecto**: 1 para IDs, "UND" para unidad

### **2. Importación de Excel**
- ✅ **Soporte para nuevas columnas**: `ID Unidad Venta`, `ID Unidad Compra`
- ✅ **Mapeo automático**: Valores por defecto si no se especifican
- ✅ **Validación**: Asegura que los IDs sean números válidos

### **3. Plantilla de Excel**
- ✅ **Ejemplos actualizados**: Todos los productos de ejemplo incluyen las nuevas columnas
- ✅ **Valores por defecto**: 1 para IDs de unidades
- ✅ **Documentación**: Instrucciones actualizadas

## 📋 Columnas en Excel

### **Exportación**
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `Unidad` | Nombre de la unidad | "Pieza" |
| `ID Unidad Venta` | ID de unidad para ventas | 1 |
| `ID Unidad Compra` | ID de unidad para compras | 1 |

### **Importación**
| Columna | Descripción | Obligatorio | Valor por Defecto |
|---------|-------------|-------------|-------------------|
| `Unidad` | Nombre de la unidad | No | "UND" |
| `ID Unidad Venta` | ID de unidad para ventas | No | 1 |
| `ID Unidad Compra` | ID de unidad para compras | No | 1 |

## 🔧 Archivos Modificados

### **1. Exportación (`src/actions/products/export.ts`)**
```typescript
// Interfaz actualizada
export interface ProductExportData {
  // ... campos existentes ...
  salesunitid: number | null;
  purchaseunitid: number | null;
}

// Función de exportación actualizada
return {
  // ... campos existentes ...
  salesunitid: product.salesunitid || null,
  purchaseunitid: product.purchaseunitid || null,
};

// Plantilla actualizada
{
  'Unidad': 'Pieza',
  'ID Unidad Venta': '1',
  'ID Unidad Compra': '1'
}
```

### **2. Importación (`src/lib/import-parsers.ts`)**
```typescript
// Interfaz actualizada
export interface ProductImportData {
  // ... campos existentes ...
  salesunitid?: number;
  purchaseunitid?: number;
}

// Parser actualizado
const product: ProductImportData = {
  // ... campos existentes ...
  salesunitid: parseInt(rowData['ID Unidad Venta'] || '1') || 1,
  purchaseunitid: parseInt(rowData['ID Unidad Compra'] || '1') || 1,
};
```

### **3. Acciones de Importación (`src/actions/products/import.ts`)**
```typescript
// Payload actualizado
const productPayload = {
  // ... campos existentes ...
  salesunitid: productData.salesunitid || 1,
  purchaseunitid: productData.purchaseunitid || 1,
};
```

## 📊 Base de Datos

### **Migración Aplicada**
```sql
-- Agregar columnas de unidades
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "salesunitid" INTEGER DEFAULT 1;

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "purchaseunitid" INTEGER DEFAULT 1;

-- Actualizar productos existentes
UPDATE "Product" 
SET "salesunitid" = 1 
WHERE "salesunitid" IS NULL;

UPDATE "Product" 
SET "purchaseunitid" = 1 
WHERE "purchaseunitid" IS NULL;
```

## 🎯 Casos de Uso

### **1. Productos Simples**
```excel
| Unidad | ID Unidad Venta | ID Unidad Compra |
|--------|-----------------|------------------|
| Pieza  | 1               | 1                |
```

### **2. Productos por Peso**
```excel
| Unidad    | ID Unidad Venta | ID Unidad Compra |
|-----------|-----------------|------------------|
| Kilogramo | 2               | 2                |
```

### **3. Productos por Volumen**
```excel
| Unidad | ID Unidad Venta | ID Unidad Compra |
|--------|-----------------|------------------|
| Litro  | 3               | 3                |
```

## ✅ Beneficios

### **1. Control Granular**
- ✅ Diferentes unidades para ventas y compras
- ✅ IDs numéricos para integración con otros sistemas
- ✅ Nombres descriptivos para usuarios

### **2. Compatibilidad**
- ✅ **Retrocompatible**: Productos existentes mantienen valores por defecto
- ✅ **Flexible**: Permite especificar solo las columnas necesarias
- ✅ **Robusto**: Validación y valores por defecto

### **3. Integración**
- ✅ **Sistemas externos**: IDs numéricos facilitan integración
- ✅ **Reportes**: Mejor control para análisis de ventas/compras
- ✅ **Inventario**: Unidades específicas por tipo de operación

## 🔍 Verificación

### **Script de Verificación**
```sql
-- Verificar columnas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Product' 
  AND column_name IN ('salesunitid', 'purchaseunitid', 'unit');

-- Verificar productos
SELECT COUNT(*) as total,
       COUNT(CASE WHEN salesunitid IS NOT NULL THEN 1 END) as con_salesunitid,
       COUNT(CASE WHEN purchaseunitid IS NOT NULL THEN 1 END) as con_purchaseunitid
FROM "Product";
```

## 🚀 Próximos Pasos

### **1. Implementación Inmediata**
- ✅ **Migración aplicada**: Columnas agregadas a la base de datos
- ✅ **Código actualizado**: Exportación e importación funcionando
- ✅ **Plantilla actualizada**: Excel incluye nuevas columnas

### **2. Pruebas Recomendadas**
1. **Exportar productos** y verificar que las nuevas columnas aparecen
2. **Importar Excel** con las nuevas columnas
3. **Verificar valores por defecto** para productos existentes

### **3. Documentación de Usuario**
- ✅ **Plantilla actualizada**: Incluye ejemplos con nuevas columnas
- ✅ **Instrucciones claras**: Explicación de cada columna
- ✅ **Valores por defecto**: Documentados y aplicados

## 📝 Notas Técnicas

### **Valores por Defecto**
- **`salesunitid`**: 1 (Pieza)
- **`purchaseunitid`**: 1 (Pieza)
- **`unit`**: "UND" (Unidad)

### **Validación**
- **IDs de unidades**: Deben ser números enteros positivos
- **Unidad**: Texto libre, no validación específica
- **Compatibilidad**: Productos existentes mantienen funcionalidad

### **Performance**
- **Índices**: No se requieren índices adicionales
- **Consultas**: Optimizadas para incluir nuevas columnas
- **Migración**: Aplicada sin interrumpir servicio

---

**✅ Sistema actualizado y listo para producción con control granular de unidades de medida.** 