# Sistema de Gestión de Cajas Históricas

## Descripción General

El sistema de gestión de cajas históricas permite registrar, importar y exportar sesiones de caja de días anteriores, manteniendo un historial completo de saldos y movimientos para auditoría y análisis.

## Características Principales

### 📚 **Entrada Manual de Sesiones**
- **Registro individual**: Ingresa sesiones de caja una por una
- **Validación automática**: Verifica que no existan sesiones duplicadas
- **Campos requeridos**:
  - Número de sesión (formato: S2025-06-20-001)
  - Fecha de la sesión
  - Monto de apertura
  - Monto de cierre
  - Estado (Cerrada/Suspendida)
  - Notas adicionales

### 📥 **Importación desde Excel/CSV**
- **Formatos soportados**: .xlsx, .xls, .csv
- **Estructura esperada**:
  ```
  Número de Sesión,Fecha,Monto Apertura,Monto Cierre,Estado,Notas
  S2025-06-20-001,2025-06-20,50000,48500,CLOSED,Sesión normal
  S2025-06-21-001,2025-06-21,48500,47200,CLOSED,Gastos menores
  ```
- **Procesamiento en lote**: Importa múltiples sesiones de una vez
- **Validación de datos**: Verifica formato y consistencia

### 📤 **Exportación de Datos**
- **Formato CSV**: Descarga todas las sesiones en formato estándar
- **Datos incluidos**:
  - Número de sesión
  - Fechas de apertura y cierre
  - Montos de apertura y cierre
  - Estado de la sesión
  - Cajero responsable
  - Notas y observaciones
- **Archivo con timestamp**: `sesiones_caja_2025-01-15.csv`

## Flujo de Trabajo

### 1. **Acceso al Sistema**
- Botón "📚 Cajas Históricas" en el dashboard de caja chica
- Disponible tanto con sesión activa como sin sesión
- Requiere permisos de administrador o super usuario

### 2. **Entrada Manual**
```
1. Seleccionar pestaña "Entrada Manual"
2. Completar formulario con datos de la sesión
3. Validar información antes de guardar
4. Confirmar creación de sesión histórica
```

### 3. **Importación Masiva**
```
1. Seleccionar pestaña "Importar Excel"
2. Subir archivo con formato correcto
3. Revisar progreso de importación
4. Confirmar sesiones importadas
```

### 4. **Exportación para Análisis**
```
1. Seleccionar pestaña "Exportar Datos"
2. Generar archivo CSV con todas las sesiones
3. Descargar archivo automáticamente
4. Usar para análisis externos o respaldo
```

## Control de Saldos

### 🔄 **Continuidad entre Sesiones**
- **Saldo inicial**: Se registra el monto con el que abrió la caja
- **Saldo final**: Se registra el monto con el que cerró la caja
- **Diferencia**: Se calcula automáticamente (Saldo Final - Saldo Inicial)
- **Trazabilidad**: Cada sesión mantiene referencia a la anterior

### 📊 **Registro por Fechas**
- **Fecha de apertura**: Cuándo se abrió la caja
- **Fecha de cierre**: Cuándo se cerró la caja
- **Duración**: Calculada automáticamente
- **Historial cronológico**: Ordenado por fecha

### 🛡️ **Validaciones de Seguridad**
- **No duplicados**: No se pueden crear sesiones con el mismo número
- **Fechas válidas**: Las fechas deben ser coherentes
- **Montos positivos**: Los montos deben ser números válidos
- **Estados permitidos**: Solo CLOSED o SUSPENDED para sesiones históricas

## Casos de Uso

### 📋 **Migración de Datos**
- Importar sesiones desde sistemas anteriores
- Migrar datos de Excel a la base de datos
- Consolidar información de múltiples fuentes

### 📈 **Análisis y Reportes**
- Exportar datos para análisis en Excel
- Generar reportes de saldos históricos
- Auditoría de movimientos de caja

### 🔍 **Investigación de Discrepancias**
- Revisar saldos de días específicos
- Identificar patrones en diferencias
- Trazar movimientos entre sesiones

## Estructura de Datos

### CashSession (Sesión de Caja)
```typescript
{
  id: number;
  sessionNumber: string;        // S2025-06-20-001
  userId: number;              // Cajero responsable
  cashRegisterId: number;      // Caja registradora
  openingAmount: number;       // Monto de apertura
  closingAmount: number;       // Monto de cierre
  openedAt: Date;             // Fecha/hora de apertura
  closedAt: Date;             // Fecha/hora de cierre
  status: 'OPEN' | 'CLOSED' | 'SUSPENDED';
  notes: string;              // Notas adicionales
}
```

### Archivo de Importación
```csv
Número de Sesión,Fecha,Monto Apertura,Monto Cierre,Estado,Notas
S2025-06-20-001,2025-06-20,50000,48500,CLOSED,Sesión normal
S2025-06-21-001,2025-06-21,48500,47200,CLOSED,Gastos menores
S2025-06-22-001,2025-06-22,47200,45800,CLOSED,Compras urgentes
```

## Permisos y Seguridad

### 👥 **Roles con Acceso**
- **SUPER_USER**: Acceso completo a todas las funciones
- **ADMINISTRADOR**: Acceso completo a todas las funciones
- **JEFE_SECCION**: Acceso de solo lectura
- **USUARIO_FINAL**: Sin acceso

### 🔐 **Validaciones**
- Verificación de permisos antes de cada operación
- Log de todas las operaciones realizadas
- Validación de datos antes de guardar
- Prevención de duplicados

## Integración con el Sistema

### 🔗 **Conexión con Caja Chica**
- Las sesiones históricas aparecen en el historial general
- Se pueden consultar desde la página de sesiones
- Mantienen consistencia con el sistema actual

### 📊 **Reportes Integrados**
- Incluidas en reportes de caja chica
- Aparecen en estadísticas generales
- Disponibles para análisis de tendencias

## Mantenimiento

### 🧹 **Limpieza de Datos**
- Validación automática de integridad
- Detección de sesiones duplicadas
- Corrección de inconsistencias

### 📈 **Optimización**
- Índices en campos de búsqueda frecuente
- Compresión de datos históricos
- Archivo de sesiones muy antiguas

## Troubleshooting

### ❌ **Errores Comunes**
1. **"Ya existe una sesión con ese número"**
   - Solución: Usar un número de sesión único
   
2. **"Formato de archivo no válido"**
   - Solución: Usar archivos .xlsx, .xls o .csv
   
3. **"Error al procesar datos"**
   - Solución: Verificar formato del archivo de importación

### 🔧 **Soporte Técnico**
- Revisar logs del sistema
- Verificar permisos de usuario
- Validar formato de datos de entrada 