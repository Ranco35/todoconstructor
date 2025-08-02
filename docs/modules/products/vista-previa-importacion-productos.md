# Vista Previa en Importación de Productos

## Descripción
Se ha implementado una nueva funcionalidad de **vista previa** en el módulo de importación de productos que permite revisar los datos leídos del archivo Excel/CSV antes de proceder con la importación.

## Características Principales

### 🔍 **Vista Previa de Datos**
- **Botón "Vista Previa"**: Nuevo botón amarillo que lee el archivo y muestra los datos
- **Tabla de datos**: Muestra todos los productos encontrados en el archivo
- **Información detallada**: SKU, nombre, tipo, precio, categoría, proveedor, bodegas
- **Contador**: Indica cuántos productos se encontraron en el archivo

### 📊 **Columnas Mostradas**
1. **Fila**: Número de fila en el archivo (empezando desde 2)
2. **SKU**: Código del producto o "Auto-generado" si no tiene
3. **Nombre**: Nombre del producto (truncado si es muy largo)
4. **Tipo**: Badge colorido con el tipo de producto
5. **Precio Venta**: Precio de venta con formato de moneda
6. **Categoría**: Nombre de la categoría
7. **Proveedor**: Nombre del proveedor
8. **Bodegas**: Bodegas asignadas al producto

### 📈 **Análisis de Acciones**
- **🆕 Nuevos**: Productos que se van a crear
- **🔄 Actualizar**: Productos existentes que se van a modificar
- **⏸️ Sin Cambios**: Productos que no se van a tocar
- **📊 Total**: Total de productos en el archivo
- **📋 Detalles**: Lista de productos por cada acción

### 🎨 **Tipos de Producto con Colores**
- 🔵 **CONSUMIBLE**: Azul
- 🟢 **ALMACENABLE**: Verde
- 🟣 **SERVICIO**: Púrpura
- 🟠 **INVENTARIO**: Naranja
- 🩷 **COMBO**: Rosa
- ⚪ **Otros**: Gris

## Flujo de Uso

### 1. **Seleccionar Archivo**
```
📁 Seleccionar archivo Excel (.xlsx, .xls) o CSV
```

### 2. **Vista Previa**
```
👁️ Vista Previa → Lee archivo → Muestra tabla de datos
```

### 3. **Revisar Datos**
- Verificar que los datos se leyeron correctamente
- Revisar tipos de producto, precios, categorías, etc.
- Identificar posibles errores antes de importar
- **Analizar acciones**: Ver cuántos productos se van a crear, actualizar o no cambiar

### 4. **Confirmar Importación**
```
📥 Confirmar Importación → Procesa archivo → Muestra resultados
```

## Archivos Modificados

### `src/components/products/ProductImportExport.tsx`
- ✅ Agregado estado para vista previa (`previewData`, `showPreview`, `previewLoading`)
- ✅ Agregado estado para análisis (`analysis`)
- ✅ Nueva función `handlePreview()` para leer archivo y mostrar datos
- ✅ Nueva función `analyzeProducts()` para analizar acciones
- ✅ Botón "Vista Previa" con icono 👁️
- ✅ Tabla de vista previa con diseño responsive
- ✅ **Análisis de acciones** con contadores y detalles
- ✅ Botones de confirmación y cancelación
- ✅ Integración con el flujo existente de importación

## Beneficios

### 🎯 **Control de Calidad**
- **Prevención de errores**: Revisar datos antes de importar
- **Validación visual**: Verificar tipos, precios y relaciones
- **Detección temprana**: Identificar problemas en el archivo
- **Análisis predictivo**: Saber exactamente qué va a pasar antes de importar

### ⚡ **Eficiencia**
- **Ahorro de tiempo**: No importar archivos con errores
- **Confianza**: Saber exactamente qué se va a importar
- **Transparencia**: Ver todos los datos antes de procesar
- **Planificación**: Anticipar el impacto de la importación

### 🛡️ **Seguridad**
- **Confirmación**: Doble verificación antes de importar
- **Cancelación**: Poder cancelar si hay errores
- **Revisión**: Oportunidad de corregir archivo si es necesario

## Casos de Uso

### ✅ **Escenario Exitoso**
1. Usuario selecciona archivo Excel
2. Hace clic en "Vista Previa"
3. Revisa los datos en la tabla
4. **Analiza las acciones** (nuevos, actualizar, sin cambios)
5. Confirma que todo está correcto
6. Hace clic en "Confirmar Importación"
7. Ve el resultado de la importación

### ⚠️ **Escenario con Errores**
1. Usuario selecciona archivo Excel
2. Hace clic en "Vista Previa"
3. Ve que hay datos incorrectos
4. Hace clic en "Cancelar"
5. Corrige el archivo Excel
6. Repite el proceso

## Compatibilidad

### 📁 **Formatos Soportados**
- ✅ **Excel (.xlsx)**: Formato principal
- ✅ **Excel (.xls)**: Formato legacy
- ✅ **CSV**: Formato de texto plano

### 🔧 **Funcionalidades Mantenidas**
- ✅ Exportación de productos
- ✅ Descarga de plantilla
- ✅ Importación directa (sin vista previa)
- ✅ Manejo de errores
- ✅ Estadísticas de importación

## Instrucciones para el Usuario

### 📋 **Paso a Paso**
1. **Abrir sección**: Hacer clic en "Importar / Exportar Productos"
2. **Seleccionar archivo**: Arrastrar o seleccionar archivo Excel/CSV
3. **Vista previa**: Hacer clic en botón amarillo "👁️ Vista Previa"
4. **Revisar datos**: Examinar la tabla de productos
5. **Confirmar**: Si todo está bien, hacer clic en "📥 Confirmar Importación"
6. **Cancelar**: Si hay errores, hacer clic en "Cancelar" y corregir archivo

### 💡 **Consejos**
- **Revisar tipos**: Verificar que los tipos de producto sean correctos
- **Verificar precios**: Asegurar que los precios tengan formato correcto
- **Comprobar relaciones**: Verificar que categorías y proveedores existan
- **Revisar SKUs**: Confirmar que los SKUs sean únicos o estén vacíos para auto-generación
- **Analizar acciones**: Revisar que el número de productos a crear/actualizar sea el esperado
- **Verificar duplicados**: Asegurar que no haya productos duplicados en el archivo

## Resultado Final

La funcionalidad de vista previa proporciona un **control total** sobre el proceso de importación, permitiendo a los usuarios:

- 🔍 **Ver exactamente** qué datos se van a importar
- 📊 **Analizar acciones** antes de proceder (crear, actualizar, sin cambios)
- ✅ **Confirmar** que todo está correcto antes de proceder
- ❌ **Cancelar** si detectan errores
- 🎯 **Mejorar la precisión** de las importaciones
- ⚡ **Ahorrar tiempo** evitando importaciones fallidas
- 📈 **Planificar** el impacto de la importación

Esta mejora hace que el proceso de importación sea **más seguro, transparente, eficiente y predecible**. 