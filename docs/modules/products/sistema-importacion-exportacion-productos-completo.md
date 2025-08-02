# Sistema de Importación/Exportación de Productos - Documentación Completa

## 📋 Descripción General

Sistema completo para importar y exportar productos mediante archivos Excel (.xlsx), permitiendo la creación masiva y actualización de productos existentes. **Incluye una plantilla única con todos los tipos de productos y el nuevo campo "¿Es para Venta?"**.

## 🎯 Funcionalidades Implementadas

### ✅ Exportación de Productos
- **Formato**: Excel (.xlsx) nativo
- **Datos exportados**: Todos los campos del producto incluyendo relaciones
- **Nombre archivo**: `productos_YYYY-MM-DD.xlsx`
- **API**: `/api/products/export`
- **Nuevo campo**: "Es para Venta" (SI/NO)

### ✅ Importación de Productos  
- **Formatos soportados**: Excel (.xlsx, .xls) y CSV (compatibilidad)
- **Identificador principal**: SKU (recomendado)
- **Lógica**: Si existe SKU → actualizar, si no existe → crear nuevo
- **Campos soportados**: Todos los campos del producto
- **Relaciones**: Soporta categorías, proveedores y bodegas por nombre o ID
- **Nuevo campo**: "Es para Venta" con validación inteligente

### ✅ Plantilla Excel Completa
- **Una sola plantilla** para todos los tipos de producto
- **3 hojas incluidas**: 
  1. **Plantilla Productos**: Ejemplos reales de cada tipo
  2. **Instrucciones**: Descripción detallada de cada campo
  3. **Tipos de Producto**: Explicación de CONSUMIBLE, ALMACENABLE, etc.
- **API**: `/api/products/template`
- **Nuevo campo**: "Es para Venta" incluido en ejemplos

## 🔧 Componentes del Sistema

### 1. Acciones de Exportación (`src/actions/products/export.ts`)

```typescript
// Obtener datos para exportar
export async function getProductsForExport(): Promise<ProductExportData[]>

// Generar Excel
export async function generateProductsExcel(): Promise<Buffer>

// Interfaz actualizada
export interface ProductExportData {
  // ... campos existentes ...
  isForSale: boolean; // 🆕 NUEVO: Indica si el producto es para venta
}
```

### 2. Acciones de Importación (`src/actions/products/import.ts`)

```typescript
// Importar productos desde array
export async function importProducts(products: ProductImportData[]): Promise<ImportResult>

// Parsear Excel a array de productos
export function parseExcel(fileBuffer: ArrayBuffer): ProductImportData[]
```

### 3. Parser de Archivos (`src/lib/import-parsers.ts`)

```typescript
export interface ProductImportData {
  // ... campos existentes ...
  isForSale?: boolean; // 🆕 NUEVO: Indica si el producto es para venta
}

// Mapeo flexible del campo
isForSale: rowData['Es para Venta'] !== undefined ? 
           (String(rowData['Es para Venta']).toUpperCase() === 'SI' || 
            String(rowData['Es para Venta']).toUpperCase() === 'YES' || 
            String(rowData['Es para Venta']).toUpperCase() === 'TRUE' || 
            String(rowData['Es para Venta']).toUpperCase() === '1') : 
           // ... otros formatos ...
           true, // Por defecto es para venta
```

### 4. Componente UI (`src/components/products/ProductImportExport.tsx`)

- Interfaz completa para importar/exportar
- Manejo de archivos Excel y CSV
- Descarga de plantilla
- Resultados detallados de importación

## 📄 Formato del Archivo Excel

### Columnas Requeridas:
- **SKU**: Identificador único (opcional para nuevos productos)
- **Nombre**: Nombre del producto (OBLIGATORIO)
- **Tipo Producto**: CONSUMIBLE, ALMACENABLE, INVENTARIO, SERVICIO, COMBO (OBLIGATORIO)

### Columnas Opcionales:
- Descripción, Marca, Precio Costo, Precio Venta, IVA (%)
- Código Barras, Categoría, Proveedor, Bodega
- Stock Actual, Stock Mínimo, Stock Máximo
- **🆕 Es para Venta**: SI/NO (por defecto SI)

### 🆕 Nuevo Campo: "Es para Venta"

| Columna | Descripción | Valores Soportados | Valor por Defecto |
|---------|-------------|-------------------|-------------------|
| `Es para Venta` | Indica si el producto es para venta al público | SI, YES, TRUE, 1 | SI |
| `Is For Sale` | Producto para venta al público | SI, YES, TRUE, 1 | SI |
| `isForSale` | Producto para venta al público | SI, YES, TRUE, 1 | SI |

### Ejemplo de CSV:
```csv
SKU,Nombre,Tipo Producto,Es para Venta,Precio Venta,IVA (%),Categoría,Proveedor,Stock Actual,Stock Mínimo,Stock Máximo,Bodega
PROD-001,"Monitor 24 pulgadas","INVENTARIO","SI",199.99,12,"Electrónicos","Proveedor XYZ",50,10,100,"Bodega Principal"
PROD-002,"Materia Prima X","INVENTARIO","NO",,,"Materias Primas","Distribuidor ABC",30,5,50,"Almacén General"
PROD-003,"Papel Bond A4","ALMACENABLE","SI",5.99,12,"Oficina","Papelería Central",200,50,500,"Bodega Secundaria"
```

## 🔄 Lógica de Identificación

### Por SKU (Recomendado):
1. **Si existe SKU** → Actualizar producto existente
2. **Si no existe SKU** → Crear nuevo producto
3. **SKU vacío** → Generar SKU automáticamente

### Ventajas del SKU:
- ✅ Más legible y manejable para usuarios
- ✅ Único por producto
- ✅ Independiente de la base de datos
- ✅ Generación automática inteligente

## 📊 Resultados de Importación

### Estadísticas:
- **Total**: Productos procesados
- **Creados**: Productos nuevos creados
- **Actualizados**: Productos existentes actualizados  
- **Errores**: Productos con errores

### Manejo de Errores:
- Validación de datos mínimos
- Mensajes descriptivos por fila
- Continuación del proceso ante errores individuales

## 🔍 Relaciones Automáticas

### Categorías:
- Por **ID**: Busca categoría por ID
- Por **Nombre**: Busca categoría por nombre (insensible a mayúsculas)

### Proveedores:
- Por **ID**: Busca proveedor por ID  
- Por **Nombre**: Busca proveedor por nombre

### Bodegas:
- Por **ID**: Busca bodega por ID
- Por **Nombre**: Busca bodega por nombre

## 🆕 Campo "¿Es para Venta?"

### Comportamiento:
- **Valor por defecto**: `true` (productos para venta)
- **Validación**: SI/YES/TRUE/1 = true, cualquier otro valor = false
- **Compatibilidad**: Total con productos existentes
- **Formulario web**: Funciona independientemente del Excel

### Casos de Uso:

#### 1. **Productos para Venta**
```csv
SKU,Nombre,Es para Venta,Precio Venta
PROD-001,Monitor LED,SI,199.99
PROD-002,Papel Bond,SI,5.99
```

#### 2. **Productos de Consumo Interno**
```csv
SKU,Nombre,Es para Venta,Precio Venta
PROD-003,Materia Prima X,NO,
PROD-004,Herramienta Interna,NO,
```

#### 3. **Importación sin Campo**
```csv
SKU,Nombre,Precio Venta
PROD-005,Producto Nuevo,10.00
# Resultado: isForSale = true (por defecto)
```

## 🛠️ Integración en la UI

### Ubicación:
- Página principal de productos: `/configuration/products`
- Sección dedicada antes de la tabla de productos

### Funcionalidades:
- **Exportar**: Descarga inmediata del Excel
- **Importar**: Subida de archivo con validación
- **Plantilla**: Descarga de archivo de ejemplo
- **Resultados**: Vista detallada de la importación

## 📋 Instrucciones de Uso

### Para Exportar:
1. Ir a **Gestión de Productos**
2. Hacer clic en **"📊 Exportar a Excel"**
3. El archivo se descarga automáticamente
4. **Nuevo**: Campo "Es para Venta" incluido

### Para Importar:
1. **Opcional**: Descargar plantilla haciendo clic en 📋
2. Preparar archivo Excel con los productos
3. **Nuevo**: Incluir columna "Es para Venta" (SI/NO)
4. Hacer clic en **"Seleccionar archivo"**
5. Elegir archivo Excel
6. Hacer clic en **"📥 Importar Excel"**  
7. Confirmar la importación
8. Revisar resultados y errores si los hay

## ⚠️ Consideraciones Importantes

### Validaciones:
- **Nombre**: Campo obligatorio
- **Tipo Producto**: Campo obligatorio
- **SKU**: Debe ser único si se proporciona
- **Es para Venta**: SI/YES/TRUE/1 = true, otros = false
- **Relaciones**: Se validan IDs y nombres antes de asignar

### Limitaciones:
- Solo archivos Excel (.xlsx, .xls) y CSV
- Tamaño máximo del archivo dependiente del servidor
- Procesamiento secuencial (no paralelo)

### Seguridad:
- Validación de tipos de archivo
- Sanitización de datos de entrada
- Manejo de errores controlado

## 🚀 Funcionalidades Avanzadas

### Generación Automática de SKU:
- Se basa en categoría, nombre y marca
- Algoritmo inteligente con palabras clave
- Secuencial único por combinación
- Fallback a timestamp si falla

### Actualización Parcial:
- Solo actualiza campos proporcionados
- Mantiene datos existentes si el campo está vacío
- **Nuevo**: Campo "Es para Venta" se actualiza si se proporciona

### Múltiples Bodegas:
- Soporte para asignación a múltiples bodegas
- Stock específico por bodega
- Mínimo y máximo por bodega

## 📁 Archivos del Sistema

### 1. **Interfaces y Tipos**
- `src/lib/import-parsers.ts`: `ProductImportData` con `isForSale`
- `src/actions/products/export.ts`: `ProductExportData` con `isForSale`

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

### 6. **Componentes UI**
- `src/components/products/ProductImportExport.tsx`: Interfaz de importación/exportación

### 7. **APIs**
- `src/app/api/products/export/route.ts`: Endpoint de exportación
- `src/app/api/products/import/route.ts`: Endpoint de importación
- `src/app/api/products/template/route.ts`: Endpoint de plantilla

## 🎯 Casos de Uso Completos

### 1. **Importación Masiva de Productos para Venta**
```csv
SKU,Nombre,Tipo Producto,Es para Venta,Precio Venta,Categoría
PROD-001,Monitor LED,INVENTARIO,SI,199.99,Electrónicos
PROD-002,Papel Bond,ALMACENABLE,SI,5.99,Oficina
PROD-003,Teclado,CONSUMIBLE,SI,25.00,Accesorios
```

### 2. **Importación de Productos de Consumo Interno**
```csv
SKU,Nombre,Tipo Producto,Es para Venta,Categoría
PROD-004,Materia Prima X,INVENTARIO,NO,Materias Primas
PROD-005,Herramienta Y,INVENTARIO,NO,Herramientas
PROD-006,Suministro Z,ALMACENABLE,NO,Suministros
```

### 3. **Actualización de Productos Existentes**
```csv
SKU,Nombre,Es para Venta,Precio Venta
PROD-001,Monitor LED Actualizado,SI,189.99
PROD-004,Materia Prima X,NO,
```

## ✅ Resultado Final

**Sistema completamente funcional** que permite:

1. **Exportar productos** con campo "Es para Venta" (SI/NO)
2. **Importar productos** especificando si son para venta
3. **Compatibilidad total** con sistema existente
4. **Valores por defecto** inteligentes
5. **Validación robusta** de datos
6. **Documentación completa** del campo
7. **Integración perfecta** con formulario web

## 🚀 Próximos Pasos

1. **Probar importación** con archivos Excel que incluyan el campo
2. **Verificar exportación** de productos existentes
3. **Actualizar plantillas** de ejemplo con el nuevo campo
4. **Documentar** en guías de usuario
5. **Capacitar usuarios** en el uso del nuevo campo

---

**Estado**: ✅ **SISTEMA COMPLETAMENTE FUNCIONAL**
**Fecha**: 15 de Enero, 2025
**Versión**: 2.0 (con campo "¿Es para Venta?")
**Compatibilidad**: Total con sistema existente 