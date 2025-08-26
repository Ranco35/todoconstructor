# Formato de Plantilla Excel para Inventario Físico

## Descripción General

La plantilla Excel para inventario físico ha sido actualizada para coincidir exactamente con el formato mostrado en el diseño original, incluyendo todas las columnas necesarias y el formato visual apropiado.

## Estructura del Archivo Excel

### Encabezado del Documento

```
TOMA FÍSICA DE INVENTARIO - [NOMBRE DE BODEGA]

Filtros: Categoría: [Nombre de categoría] (si aplica)
Fecha de generación: DD/MM/YYYY HH:MM
```

### Columnas de la Plantilla

| # | Columna | Descripción | Tipo | Editable |
|---|---------|-------------|------|----------|
| 1 | **SKU** | Código único del producto | Texto | No |
| 2 | **Bodega** | Nombre de la bodega | Texto | No |
| 3 | **Nombre Producto** | Nombre completo del producto | Texto | No |
| 4 | **Marca** | Marca del producto | Texto | No |
| 5 | **Descripción** | Descripción detallada | Texto | No |
| 6 | **Código Proveedor** | Código del proveedor | Texto | No |
| 7 | **Imagen** | Estado de imagen del producto | Texto | No |
| 8 | **Cantidad Actual** | Stock actual en el sistema | Número | No |
| 9 | **Cantidad Real (Conteo Físico)** | **STOCK CONTADO** | Número | **SÍ** |

### Columnas Editables

Solo la columna **"Cantidad Real (Conteo Físico)"** debe ser completada por el usuario durante la toma de inventario.

## Proceso de Uso

### 1. Generación de la Plantilla

```typescript
// Endpoint para generar plantilla
POST /api/inventory/physical/template

// Parámetros
{
  "warehouseId": number,      // ID de la bodega (requerido)
  "categoryId": number,       // ID de categoría (opcional)
  "includeAllProducts": boolean // Incluir todos los productos (opcional)
}
```

### 2. Completado de la Plantilla

El usuario debe:
1. **NO modificar** ninguna columna excepto "Cantidad Real (Conteo Físico)"
2. **Ingresar** el stock físico contado en la columna correspondiente
3. **Dejar vacío** si no se encontró el producto durante el conteo
4. **Usar números enteros** positivos únicamente

### 3. Ejemplo de Uso

```excel
SKU          | Bodega  | Nombre Producto    | Marca   | Descripción       | Código Proveedor | Imagen     | Cantidad Actual | Cantidad Real (Conteo Físico)
-------------|---------|-------------------|---------|-------------------|------------------|------------|-----------------|-----------------------------
VAJ-INV-0005 | Comedor | Cuchara café Alt. | Provence| Cuchara café Alt. |                  | Sin imagen | 0               | 55
VAJ-INV-0003 | Comedor | Cuchara Cafe Wolf | Wolfen  | Cuchara Cafe Wolf | INT1-2470        | Sin imagen | 0               | 33
VAJ-INV-0020 | Comedor | Cuchara de Cafe   | Jenny   | Cuchara de Cafe   |                  | Sin imagen | 0               | 44
```

## Validaciones del Parser

### Reconocimiento de Columnas

El parser reconoce las siguientes variaciones para la columna de conteo:

- `Cantidad Real (Conteo Físico)` ✅ **Principal**
- `cantidad real (conteo físico)` ✅ 
- `Stock contado` ✅ 
- `stock contado` ✅
- `Stock Contado` ✅
- `STOCK CONTADO` ✅
- `Cantidad Real` ✅
- `cantidad real` ✅
- `inventarioContado` ✅
- `contado` ✅

### Validaciones de Datos

1. **SKU Obligatorio**: Todos los productos deben tener SKU
2. **Cantidad Numérica**: Solo se aceptan números enteros
3. **Cantidad Positiva**: No se permiten valores negativos
4. **Producto Existente**: El SKU debe existir en la base de datos
5. **Asignación a Bodega**: El producto debe estar asignado a la bodega

## Información Adicional Incluida

### Datos del Producto

- **Marca**: Marca del producto (si está disponible)
- **Descripción**: Descripción detallada del producto
- **Código Proveedor**: Código interno del proveedor
- **Estado de Imagen**: Indica si el producto tiene imagen asociada

### Metadatos

- **Fecha de Generación**: Timestamp de cuándo se generó la plantilla
- **Filtros Aplicados**: Si se filtró por categoría, se muestra en el encabezado
- **Nombre de Bodega**: Claramente identificado en el título

## Configuración de Columnas

### Anchos Optimizados

```typescript
const columnWidths = [
  { wch: 15 }, // SKU
  { wch: 12 }, // Bodega
  { wch: 25 }, // Nombre Producto
  { wch: 12 }, // Marca
  { wch: 20 }, // Descripción
  { wch: 15 }, // Código Proveedor
  { wch: 12 }, // Imagen
  { wch: 12 }, // Cantidad Actual
  { wch: 20 }  // Cantidad Real (Conteo Físico)
]
```

### Formato Visual

- **Título**: Fila 1 con el nombre de la bodega en mayúsculas
- **Filtros**: Información de filtros aplicados (si corresponde)
- **Fecha**: Timestamp de generación
- **Headers**: Fila de encabezados con nombres descriptivos
- **Datos**: Filas de productos con toda la información relevante

## Nombre de Archivo

El archivo se genera con nombres descriptivos:

- **Con categoría**: `inventario-fisico-[bodega]-[categoria].xlsx`
- **Sin categoría**: `inventario-fisico-[bodega].xlsx`

Ejemplos:
- `inventario-fisico-comedor-vajilla.xlsx`
- `inventario-fisico-almacen-general.xlsx`

## Beneficios del Nuevo Formato

1. **Información Completa**: Todos los datos del producto visibles
2. **Identificación Clara**: Fácil identificación de productos durante el conteo
3. **Trazabilidad**: Información de proveedor y categorización
4. **Profesional**: Formato consistente y bien estructurado
5. **Flexibilidad**: Compatible con múltiples variaciones de nombres de columnas

## Consideraciones Técnicas

### Rendimiento

- Optimizado para manejar grandes volúmenes de productos
- Consultas eficientes con joins necesarios
- Formato de archivo compacto

### Compatibilidad

- Compatible con Excel 2010 y versiones superiores
- Funciona en LibreOffice Calc y Google Sheets
- Formato XLSX estándar

### Seguridad

- Solo se exportan productos asignados a la bodega específica
- Información sensible de precios no incluida
- Validación de permisos en el backend 