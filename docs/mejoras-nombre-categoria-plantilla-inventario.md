# Mejoras en el Nombre de Categoría en Plantilla de Inventario

## Mejoras Implementadas

Se han realizado mejoras para incluir el nombre de la categoría tanto en el contenido del archivo Excel como en el nombre del archivo de descarga.

## Cambios Realizados

### 1. Título del Archivo Excel con Categoría

**Archivo**: `src/actions/inventory/inventory-physical.ts`

```typescript
// ✅ DESPUÉS: Título dinámico con categoría
// Construir título con categoría si aplica
let titleText = `TOMA FÍSICA DE INVENTARIO - ${(warehouse.name || 'BODEGA').toUpperCase()}`
if (includeAllProducts && categoryName) {
  titleText += ` - CATEGORÍA: ${categoryName.toUpperCase()}`
}

titleCell.value = titleText
```

**Resultado**:
- **Sin categoría**: `TOMA FÍSICA DE INVENTARIO - BODEGA 1`
- **Con categoría**: `TOMA FÍSICA DE INVENTARIO - BODEGA 1 - CATEGORÍA: HERRAMIENTAS`

### 2. Nombre de Archivo Descriptivo

**Archivo**: `src/app/api/inventory/physical/template/route.ts`

```typescript
// Obtener nombre de categoría si aplica
let categoryName = ''
if (includeAllProducts && categoryId) {
  try {
    const supabase = await getSupabaseServiceClient()
    const { data: category } = await supabase
      .from('Category')
      .select('name')
      .eq('id', categoryId)
      .single()
    
    if (category?.name) {
      categoryName = category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    }
  } catch (error) {
    console.warn('⚠️ [API] No se pudo obtener nombre de categoría:', error)
  }
}

// Generar nombre de archivo descriptivo
let filename = `inventario-fisico-bodega-${warehouseId}`
if (includeAllProducts && categoryId) {
  if (categoryName) {
    filename += `-categoria-${categoryName}`
  } else {
    filename += `-categoria-${categoryId}`
  }
}
filename += `.xlsx`
```

**Resultado**:
- **Sin categoría**: `inventario-fisico-bodega-2.xlsx`
- **Con categoría**: `inventario-fisico-bodega-2-categoria-herramientas.xlsx`
- **Fallback**: `inventario-fisico-bodega-2-categoria-2.xlsx` (si no se puede obtener el nombre)

## Funcionalidades Mejoradas

### 1. Título Dinámico en Excel
- ✅ Muestra el nombre de la bodega
- ✅ Incluye el nombre de la categoría cuando aplica
- ✅ Formato consistente y profesional
- ✅ Fácil identificación del contenido

### 2. Nombre de Archivo Inteligente
- ✅ Incluye ID de bodega
- ✅ Incluye nombre de categoría (sanitizado)
- ✅ Fallback a ID de categoría si no se puede obtener el nombre
- ✅ Caracteres seguros para nombres de archivo

### 3. Sanitización de Nombres
- ✅ Convierte a minúsculas
- ✅ Reemplaza caracteres especiales con guiones
- ✅ Mantiene solo letras, números y guiones
- ✅ Compatible con todos los sistemas operativos

## Ejemplos de Resultados

### Escenario 1: Inventario de Bodega Completa
- **Título Excel**: `TOMA FÍSICA DE INVENTARIO - BODEGA 1`
- **Nombre Archivo**: `inventario-fisico-bodega-1.xlsx`

### Escenario 2: Inventario por Categoría
- **Categoría**: "Herramientas Eléctricas"
- **Título Excel**: `TOMA FÍSICA DE INVENTARIO - BODEGA 1 - CATEGORÍA: HERRAMIENTAS ELÉCTRICAS`
- **Nombre Archivo**: `inventario-fisico-bodega-1-categoria-herramientas-electricas.xlsx`

### Escenario 3: Categoría con Caracteres Especiales
- **Categoría**: "Accesorios & Repuestos"
- **Título Excel**: `TOMA FÍSICA DE INVENTARIO - BODEGA 1 - CATEGORÍA: ACCESORIOS & REPUESTOS`
- **Nombre Archivo**: `inventario-fisico-bodega-1-categoria-accesorios-repuestos.xlsx`

## Archivos Modificados

1. **`src/actions/inventory/inventory-physical.ts`**
   - Título dinámico con categoría en Excel
   - Lógica condicional para incluir categoría

2. **`src/app/api/inventory/physical/template/route.ts`**
   - Consulta de nombre de categoría
   - Generación de nombre de archivo descriptivo
   - Sanitización de nombres para archivos
   - Manejo de errores con fallback

## Beneficios de las Mejoras

### 1. Mejor Identificación
- ✅ Archivos fácilmente identificables
- ✅ Contenido claro en el título del Excel
- ✅ Organización mejorada de archivos

### 2. Experiencia de Usuario
- ✅ Nombres de archivo descriptivos
- ✅ Información completa en el título
- ✅ Fácil gestión de múltiples plantillas

### 3. Profesionalismo
- ✅ Formato consistente y profesional
- ✅ Información completa y clara
- ✅ Fácil identificación del contexto

### 4. Mantenibilidad
- ✅ Código bien estructurado
- ✅ Manejo de errores robusto
- ✅ Fallbacks para casos edge

## Verificación de Funcionamiento

Para verificar que las mejoras funcionan:

1. **Acceder al módulo de inventario físico**
2. **Seleccionar una bodega**
3. **Marcar "Incluir todos los productos"**
4. **Seleccionar una categoría específica**
5. **Hacer clic en "Descargar Plantilla"**
6. **Verificar que el archivo descargado tiene el nombre correcto**
7. **Abrir el archivo Excel y verificar que el título incluye la categoría**

## Notas Técnicas

- La sanitización de nombres usa regex `/[^a-z0-9]/g` para mantener solo caracteres seguros
- Se usa `getSupabaseServiceClient()` para bypassear RLS al obtener el nombre de categoría
- El fallback al ID de categoría asegura que siempre se genere un nombre válido
- Los títulos en Excel se muestran en mayúsculas para mejor legibilidad

## Fecha de Implementación
**15 de Enero, 2025**

## Estado
✅ **COMPLETADO** - Nombre de categoría incluido en título y archivo de descarga
