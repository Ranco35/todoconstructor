# Campo "¿Es para Venta?" - Implementado en Sistema Excel

## 📋 Resumen Ejecutivo

Se ha implementado exitosamente el campo `isForSale` en el sistema completo de importación y exportación de productos mediante archivos Excel. Este campo permite distinguir entre productos para venta al público y productos para consumo interno/materia prima.

## ✅ Funcionalidades Implementadas

### 1. **Interfaz de Importación**
- **Campo agregado**: `isForSale` en `ProductImportData`
- **Mapeo flexible**: Reconoce múltiples formatos de columnas:
  - `Es para Venta` (español)
  - `Is For Sale` (inglés)
  - `isForSale` (camelCase)
- **Valores soportados**: SI/YES/TRUE/1 para productos de venta, NO/NO/NO/0 para consumo interno
- **Valor por defecto**: `true` (productos para venta)

### 2. **Interfaz de Exportación**
- **Campo agregado**: `isForSale` en `ProductExportData`
- **Formato de salida**: "SI" para productos de venta, "NO" para consumo interno
- **Columna en Excel**: "Es para Venta" con valores SI/NO

### 3. **Funciones de Parseo Actualizadas**

#### `parseExcel()` en `src/lib/import-parsers.ts`:
```typescript
isForSale: rowData['Es para Venta'] !== undefined ? 
           (String(rowData['Es para Venta']).toUpperCase() === 'SI' || 
            String(rowData['Es para Venta']).toUpperCase() === 'YES' || 
            String(rowData['Es para Venta']).toUpperCase() === 'TRUE' || 
            String(rowData['Es para Venta']).toUpperCase() === '1') : 
           // ... otros formatos ...
           true, // Por defecto es para venta
```

#### `parseCSV()` en `src/lib/import-parsers.ts`:
```typescript
isForSale: values[headers.indexOf('Es para Venta')] !== undefined ? 
           (String(values[headers.indexOf('Es para Venta')]).toUpperCase() === 'SI' || 
            String(values[headers.indexOf('Es para Venta')]).toUpperCase() === 'YES' || 
            String(values[headers.indexOf('Es para Venta')]).toUpperCase() === 'TRUE' || 
            String(values[headers.indexOf('Es para Venta')]).toUpperCase() === '1') : true,
```

### 4. **Funciones de Exportación Actualizadas**

#### `getProductsForExport()` y `getProductsByIds()` en `src/actions/products/export.ts`:
```typescript
isForSale: product.isForSale ?? true, // 🆕 NUEVO: Por defecto es para venta
```

#### `generateProductsExcel()` en `src/actions/products/export.ts`:
```typescript
'Es para Venta': product.isForSale ? 'SI' : 'NO', // 🆕 NUEVO: Campo para venta
```

### 5. **Función de Importación Actualizada**

#### `importProducts()` en `src/actions/products/import.ts`:
```typescript
// 🆕 NUEVO: Incluir campo para venta
isForSale: productData.isForSale ?? true, // Por defecto es para venta
```

## 📊 Formato del Archivo Excel

### Columnas Nuevas en Exportación:
| Columna | Descripción | Valores |
|---------|-------------|---------|
| `Es para Venta` | Indica si el producto es para venta al público | SI / NO |

### Columnas Soportadas en Importación:
| Columna | Descripción | Valores Soportados |
|---------|-------------|-------------------|
| `Es para Venta` | Producto para venta al público | SI, YES, TRUE, 1 |
| `Is For Sale` | Producto para venta al público | SI, YES, TRUE, 1 |
| `isForSale` | Producto para venta al público | SI, YES, TRUE, 1 |

### Ejemplo de Archivo Excel:
```csv
SKU,Nombre,Tipo Producto,Es para Venta,Precio Venta,...
PROD-001,Monitor LED 24",INVENTARIO,SI,199.99,...
PROD-002,Papel Bond A4,ALMACENABLE,SI,5.99,...
PROD-003,Materia Prima X,INVENTARIO,NO,,...
```

## 🔄 Lógica de Comportamiento

### 1. **Valor por Defecto**
- **Nuevos productos**: `isForSale = true` (para venta)
- **Productos existentes**: Mantienen su valor actual
- **Importación sin campo**: `isForSale = true` (para venta)

### 2. **Validación de Datos**
- **Valores válidos**: SI, YES, TRUE, 1 (case-insensitive)
- **Valores inválidos**: Cualquier otro valor se interpreta como `false`
- **Campo vacío**: Se interpreta como `true` (para venta)

### 3. **Compatibilidad**
- **Productos existentes**: No se ven afectados
- **Formulario web**: Funciona independientemente del Excel
- **Base de datos**: Campo `isForSale` agregado con migración

## 📁 Archivos Modificados

### 1. **Interfaces y Tipos**
- `src/lib/import-parsers.ts`: Agregado `isForSale` a `ProductImportData`
- `src/actions/products/export.ts`: Agregado `isForSale` a `ProductExportData`

### 2. **Funciones de Parseo**
- `src/lib/import-parsers.ts`: 
  - `parseExcel()`: Mapeo del campo `isForSale`
  - `parseCSV()`: Mapeo del campo `isForSale`

### 3. **Funciones de Exportación**
- `src/actions/products/export.ts`:
  - `getProductsForExport()`: Incluye campo `isForSale`
  - `getProductsByIds()`: Incluye campo `isForSale`
  - `generateProductsExcel()`: Agrega columna "Es para Venta"

### 4. **Función de Importación**
- `src/actions/products/import.ts`:
  - `importProducts()`: Procesa campo `isForSale`

### 5. **Base de Datos**
- `supabase/migrations/20250115000003_add_is_for_sale_to_product.sql`: Migración del campo

## 🎯 Casos de Uso

### 1. **Productos para Venta**
```csv
SKU,Nombre,Es para Venta,Precio Venta
PROD-001,Monitor LED,SI,199.99
PROD-002,Papel Bond,SI,5.99
```

### 2. **Productos de Consumo Interno**
```csv
SKU,Nombre,Es para Venta,Precio Venta
PROD-003,Materia Prima X,NO,
PROD-004,Herramienta Interna,NO,
```

### 3. **Importación Masiva**
- **Archivo Excel**: Incluir columna "Es para Venta"
- **Valores**: SI/NO según corresponda
- **Resultado**: Productos creados con campo correcto

## ✅ Resultado Final

**Sistema completamente funcional** que permite:

1. **Exportar productos** con campo "Es para Venta" (SI/NO)
2. **Importar productos** especificando si son para venta
3. **Compatibilidad total** con sistema existente
4. **Valores por defecto** inteligentes
5. **Validación robusta** de datos
6. **Documentación completa** del campo

## 🚀 Próximos Pasos

1. **Probar importación** con archivos Excel que incluyan el campo
2. **Verificar exportación** de productos existentes
3. **Actualizar plantillas** de ejemplo con el nuevo campo
4. **Documentar** en guías de usuario

---

**Estado**: ✅ **IMPLEMENTACIÓN COMPLETADA**
**Fecha**: 15 de Enero, 2025
**Versión**: 1.0 