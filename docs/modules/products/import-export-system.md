# Sistema de Importación y Exportación de Productos (Excel)

## 📋 Descripción General

Sistema completo para importar y exportar productos mediante archivos Excel (.xlsx), permitiendo la creación masiva y actualización de productos existentes. **Incluye una plantilla única con todos los tipos de productos**.

## 🎯 Funcionalidades Implementadas

### ✅ Exportación de Productos
- **Formato**: Excel (.xlsx) nativo
- **Datos exportados**: Todos los campos del producto incluyendo relaciones
- **Nombre archivo**: `productos_YYYY-MM-DD.xlsx`
- **API**: `/api/products/export`

### ✅ Importación de Productos  
- **Formatos soportados**: Excel (.xlsx, .xls) y CSV (compatibilidad)
- **Identificador principal**: SKU (recomendado)
- **Lógica**: Si existe SKU → actualizar, si no existe → crear nuevo
- **Campos soportados**: Todos los campos del producto
- **Relaciones**: Soporta categorías, proveedores y bodegas por nombre o ID

### ✅ Plantilla Excel Completa
- **Una sola plantilla** para todos los tipos de producto
- **3 hojas incluidas**:
  1. **Plantilla Productos**: Ejemplos reales de cada tipo
  2. **Instrucciones**: Descripción detallada de cada campo
  3. **Tipos de Producto**: Explicación de CONSUMIBLE, ALMACENABLE, etc.
- **API**: `/api/products/template`

## 🔧 Componentes del Sistema

### 1. Acciones de Exportación (`src/actions/products/export.ts`)

```typescript
// Obtener datos para exportar
export async function getProductsForExport(): Promise<ProductExportData[]>

// Generar CSV
export async function generateProductsCSV(): Promise<string>
```

### 2. Acciones de Importación (`src/actions/products/import.ts`)

```typescript
// Importar productos desde array
export async function importProducts(products: ProductImportData[]): Promise<ImportResult>

// Parsear CSV a array de productos
export function parseCSV(csvContent: string): ProductImportData[]
```

### 3. Componente UI (`src/components/products/ProductImportExport.tsx`)

- Interfaz completa para importar/exportar
- Manejo de archivos CSV
- Descarga de plantilla
- Resultados detallados de importación

## 📄 Formato del Archivo CSV

### Columnas Requeridas:
- **SKU**: Identificador único (opcional para nuevos productos)
- **Nombre**: Nombre del producto (OBLIGATORIO)

### Columnas Opcionales:
- Descripción, Marca, Precio Costo, Precio Venta, IVA (%)
- Código Barras, Categoría, Proveedor, Bodega
- Stock Actual, Stock Mínimo, Stock Máximo

### Ejemplo de CSV:
```csv
SKU,Nombre,Descripción,Marca,Precio Costo,Precio Venta,IVA (%),Código Barras,Categoría,Proveedor,Stock Actual,Stock Mínimo,Stock Máximo,Bodega
PROD-001,"Monitor 24 pulgadas","Monitor LED 24 pulgadas","Samsung",150.00,199.99,12,"1234567890123","Electrónicos","Proveedor XYZ",50,10,100,"Bodega Principal"
,"Teclado Inalámbrico","Teclado bluetooth","Logitech",25.00,39.99,12,"9876543210987","Accesorios","Distribuidor ABC",30,5,50,"Bodega Secundaria"
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

## 🛠️ Integración en la UI

### Ubicación:
- Página principal de productos: `/configuration/products`
- Sección dedicada antes de la tabla de productos

### Funcionalidades:
- **Exportar**: Descarga inmediata del CSV
- **Importar**: Subida de archivo con validación
- **Plantilla**: Descarga de archivo de ejemplo
- **Resultados**: Vista detallada de la importación

## 📋 Instrucciones de Uso

### Para Exportar:
1. Ir a **Gestión de Productos**
2. Hacer clic en **"📊 Exportar a CSV"**
3. El archivo se descarga automáticamente

### Para Importar:
1. **Opcional**: Descargar plantilla haciendo clic en 📋
2. Preparar archivo CSV con los productos
3. Hacer clic en **"Seleccionar archivo"**
4. Elegir archivo CSV
5. Hacer clic en **"📥 Importar CSV"**  
6. Confirmar la importación
7. Revisar resultados y errores si los hay

## ⚠️ Consideraciones Importantes

### Validaciones:
- **Nombre**: Campo obligatorio
- **SKU**: Debe ser único si se proporciona
- **Relaciones**: Se validan IDs y nombres antes de asignar

### Limitaciones:
- Solo archivos CSV
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
- Permite actualización de stock independiente

### Reportes Detallados:
- Resumen estadístico completo
- Lista de errores por fila
- Mensajes descriptivos de problemas

## 📁 Archivos Relacionados

- `src/actions/products/export.ts` - Lógica de exportación
- `src/actions/products/import.ts` - Lógica de importación  
- `src/components/products/ProductImportExport.tsx` - UI principal
- `src/lib/sku-generator.ts` - Generador automático de SKU
- `docs/modules/products/import-export-system.md` - Esta documentación

---

**Última actualización**: Diciembre 2024  
**Estado**: ✅ Completamente implementado y funcional 