# Importación de Productos con Asignación de Bodegas Múltiples

## Descripción

Se ha implementado una funcionalidad completa para importar productos desde Excel/CSV con asignación automática a múltiples bodegas y gestión de stock por bodega.

## Características Principales

### 1. Asignación Múltiple de Bodegas
- **Columna "Bodegas"**: Lista de bodegas separadas por comas
- **Stock por Bodega**: Columnas específicas para cada bodega con stock, mínimo y máximo
- **Compatibilidad**: Mantiene compatibilidad con el formato anterior de bodega individual

### 2. Formato de Archivo Excel

#### Columnas Nuevas:
- `Bodegas`: Lista de bodegas separadas por comas (ej: "Bodega Principal, Almacén General")
- `Stock [Nombre Bodega]`: Cantidad en esa bodega específica
- `Min [Nombre Bodega]`: Stock mínimo para esa bodega
- `Max [Nombre Bodega]`: Stock máximo para esa bodega

#### Ejemplo de Uso:
```
Bodegas: "Bodega Principal, Almacén General"
Stock Bodega Principal: 30
Min Bodega Principal: 5
Max Bodega Principal: 50
Stock Almacén General: 20
Min Almacén General: 3
Max Almacén General: 30
```

### 3. Lógica de Importación

#### Resolución de Bodegas:
1. **Por Nombre**: Busca bodegas por nombre exacto (case-insensitive)
2. **Fallback**: Si no encuentra la bodega, mantiene la asignación sin ID
3. **Compatibilidad**: Si no hay bodegas múltiples, usa la columna "Bodega" individual

#### Proceso de Asignación:
1. **Verificación**: Comprueba si ya existe la asignación producto-bodega
2. **Creación**: Si no existe, crea nueva asignación con stock específico
3. **Actualización**: Si existe, actualiza stock, mínimo y máximo
4. **Contadores**: Registra el número total de bodegas asignadas

### 4. Componentes Actualizados

#### Parser (`src/lib/import-parsers.ts`):
- Nueva interfaz `WarehouseAssignment`
- Función `resolveWarehouseIds()` para resolver IDs por nombre
- Parseo de columnas dinámicas por bodega

#### Acción de Importación (`src/actions/products/import.ts`):
- Manejo de bodegas múltiples en el proceso de importación
- Estadísticas de bodegas asignadas
- Validación y creación/actualización de asignaciones

#### Plantilla Excel (`src/actions/products/export.ts`):
- Ejemplos con bodegas múltiples
- Instrucciones detalladas sobre el formato
- Columnas de ejemplo para diferentes escenarios

#### Componente UI (`src/components/products/ProductImportExport.tsx`):
- Estadísticas de bodegas asignadas en el resultado
- Instrucciones actualizadas
- Mensajes de confirmación mejorados

## Casos de Uso

### 1. Producto en Una Bodega
```
Bodegas: "Bodega Principal"
Stock Bodega Principal: 100
Min Bodega Principal: 10
Max Bodega Principal: 200
```

### 2. Producto en Múltiples Bodegas
```
Bodegas: "Bodega Principal, Almacén General, Sucursal Norte"
Stock Bodega Principal: 50
Min Bodega Principal: 5
Max Bodega Principal: 100
Stock Almacén General: 30
Min Almacén General: 3
Max Almacén General: 60
Stock Sucursal Norte: 20
Min Sucursal Norte: 2
Max Sucursal Norte: 40
```

### 3. Producto Sin Bodegas (Servicios)
```
Bodegas: (vacío)
```

## Ventajas

1. **Flexibilidad**: Asignación a múltiples bodegas en una sola importación
2. **Eficiencia**: Stock específico por bodega sin necesidad de importaciones separadas
3. **Compatibilidad**: Mantiene funcionamiento con archivos existentes
4. **Validación**: Verifica existencia de bodegas antes de asignar
5. **Estadísticas**: Reporta el número de bodegas asignadas exitosamente

## Consideraciones Técnicas

### Base de Datos:
- Usa la tabla `Warehouse_Product` para las asignaciones
- Campos: `productid`, `warehouseid`, `quantity`, `min_stock`, `max_stock`
- Evita duplicados verificando asignaciones existentes

### Rendimiento:
- Resuelve IDs de bodegas una sola vez al inicio
- Procesa asignaciones en lotes por producto
- Manejo eficiente de errores sin afectar otros productos

### Seguridad:
- Validación de datos antes de la inserción
- Manejo de errores sin comprometer la integridad
- Rollback automático en caso de errores críticos

## Próximas Mejoras

1. **Validación Avanzada**: Verificar que las bodegas existan antes de la importación
2. **Reportes**: Generar reportes de asignaciones fallidas
3. **Interfaz**: Selector visual de bodegas en la interfaz de importación
4. **Plantillas**: Plantillas específicas por tipo de negocio
5. **API**: Endpoint para obtener bodegas disponibles durante la importación 