# Sistema de Importación/Exportación Excel para Caja Chica

## 📋 Resumen

Se ha implementado un sistema completo de importación y exportación de transacciones históricas de caja chica usando archivos Excel. Este sistema reemplaza el método manual anterior y proporciona una solución más eficiente y escalable para gestionar transacciones de días anteriores.

## 🎯 Características Principales

### 1. Plantilla Excel Inteligente
- **Descarga automática** de plantilla con instrucciones detalladas
- **Lista de categorías** disponibles en el sistema
- **Lista de centros de costo** disponibles
- **Ejemplos de datos** para cada tipo de transacción
- **Validaciones** y formatos predefinidos

### 2. Importación Masiva
- **Soporte para múltiples formatos**: .xlsx, .xls, .csv
- **Validación automática** de datos
- **Procesamiento en lotes** con barra de progreso
- **Reporte de errores** detallado
- **Rollback automático** en caso de errores

### 3. Exportación Completa
- **Todas las transacciones** en formato Excel
- **Datos estructurados** con relaciones
- **Información completa** de cada transacción
- **Filtros por sesión** (opcional)

## 📁 Estructura de Archivos

```
src/
├── actions/configuration/
│   └── petty-cash-import-export.ts    # Funciones principales
├── components/petty-cash/
│   └── HistoricalCashManagementModal.tsx  # Modal actualizado
└── supabase/migrations/
    └── 20250627_add_status_to_petty_cash_tables.sql  # Migración de status
```

## 🔧 Funcionalidades Implementadas

### Generación de Plantilla
```typescript
export async function generatePettyCashTemplate()
```
- Crea un archivo Excel con 4 hojas:
  1. **Instrucciones**: Guía completa de uso
  2. **Categorías**: Lista de categorías disponibles
  3. **Centros de Costo**: Lista de centros de costo
  4. **Plantilla**: Formato para datos

### Importación de Transacciones
```typescript
export async function importPettyCashTransactions(file: File)
```
- Procesa archivos Excel/CSV
- Valida formato y datos
- Crea transacciones en la base de datos
- Retorna reporte detallado

### Exportación de Datos
```typescript
export async function exportPettyCashTransactions(sessionId?: number)
```
- Exporta todas las transacciones
- Incluye relaciones con usuarios, categorías, etc.
- Formato Excel estructurado

## 📊 Estructura de la Plantilla

### Campos Obligatorios
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sessionId` | number | ID de la sesión de caja |
| `transactionType` | text | 'expense', 'income', 'purchase' |
| `description` | text | Descripción de la transacción |
| `amount` | number | Monto de la transacción |
| `date` | date | Fecha (YYYY-MM-DD) |

### Campos Opcionales
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `categoryId` | number | ID de la categoría |
| `costCenterId` | number | ID del centro de costo |
| `paymentMethod` | text | 'cash', 'transfer', 'card', 'other' |
| `affectsPhysicalCash` | boolean | Si afecta caja física |
| `notes` | text | Notas adicionales |

## 🎨 Interfaz de Usuario

### Modal de Gestión Histórica
El modal se divide en 3 pestañas principales:

#### 1. 📋 Descargar Plantilla
- Botón para descargar plantilla Excel
- Información sobre contenido de la plantilla
- Instrucciones de uso

#### 2. 📥 Importar Excel
- Drag & drop para archivos
- Validación de formato
- Barra de progreso durante importación
- Reporte de resultados

#### 3. 📤 Exportar Datos
- Exportación de todas las transacciones
- Información sobre datos incluidos
- Descarga automática

## 🔄 Flujo de Trabajo

### Para Usuario Final
1. **Descargar plantilla** desde la pestaña "Descargar Plantilla"
2. **Completar datos** en la hoja "Plantilla" del Excel
3. **Guardar archivo** con datos completados
4. **Subir archivo** en la pestaña "Importar Excel"
5. **Revisar resultados** del proceso de importación

### Para Administradores
1. **Exportar datos** existentes para análisis
2. **Crear respaldos** de transacciones
3. **Auditar movimientos** en formato Excel
4. **Generar reportes** personalizados

## 🛡️ Validaciones y Seguridad

### Validaciones de Datos
- **Formato de fecha** correcto (YYYY-MM-DD)
- **Montos positivos** y numéricos
- **IDs válidos** para sesiones, categorías, centros de costo
- **Tipos de transacción** permitidos
- **Campos obligatorios** completos

### Seguridad
- **Autenticación** requerida para todas las operaciones
- **Validación de usuario** actual
- **Rollback automático** en errores
- **Logs de auditoría** para todas las operaciones

## 📈 Ventajas del Nuevo Sistema

### Comparado con el Sistema Anterior
| Aspecto | Sistema Anterior | Nuevo Sistema |
|---------|------------------|---------------|
| **Entrada de datos** | Manual, una por una | Masiva, por lotes |
| **Velocidad** | Lenta, propensa a errores | Rápida, validada |
| **Escalabilidad** | Limitada | Ilimitada |
| **Auditoría** | Difícil de rastrear | Trazabilidad completa |
| **Mantenimiento** | Código complejo | Código modular |

### Beneficios Específicos
1. **Eficiencia**: Importar 100 transacciones en segundos vs. horas manualmente
2. **Precisión**: Validaciones automáticas reducen errores
3. **Flexibilidad**: Formato Excel familiar para usuarios
4. **Trazabilidad**: Logs completos de todas las operaciones
5. **Escalabilidad**: Maneja cualquier volumen de datos

## 🔧 Configuración Técnica

### Dependencias
```json
{
  "xlsx": "^0.18.5"
}
```

### Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Migraciones Aplicadas
```sql
-- Agregar columna status a PettyCashExpense
ALTER TABLE "PettyCashExpense"
ADD COLUMN "status" text NOT NULL DEFAULT 'approved';

-- Agregar columna status a PettyCashPurchase  
ALTER TABLE "PettyCashPurchase"
ADD COLUMN "status" text NOT NULL DEFAULT 'approved';

-- Agregar columna userId a PettyCashExpense
ALTER TABLE "PettyCashExpense"
ADD COLUMN "userId" uuid REFERENCES "User"("id");

-- Agregar columna userId a PettyCashPurchase  
ALTER TABLE "PettyCashPurchase"
ADD COLUMN "userId" uuid REFERENCES "User"("id");
```

## 🚀 Uso del Sistema

### Ejemplo de Plantilla Completada
```csv
sessionId,transactionType,description,amount,date,categoryId,costCenterId,paymentMethod,affectsPhysicalCash,notes
15,expense,Compra de papelería,50000,2025-06-20,1,2,cash,true,Nota de ejemplo
15,income,Venta en efectivo,25000,2025-06-20,,,cash,true,Ingreso directo a caja
15,purchase,Compra de productos,100000,2025-06-20,3,1,transfer,false,Compra con transferencia
```

### Tipos de Transacción Soportados
1. **expense**: Gastos de caja chica
2. **income**: Ingresos directos a caja
3. **purchase**: Compras de productos

## 📝 Notas de Implementación

### Cambios en la Base de Datos
- Se agregó columna `status` a ambas tablas de transacciones
- Se agregó columna `userId` para trazabilidad
- Se mantuvieron restricciones de integridad referencial

### Compatibilidad
- **Hacia atrás**: Compatible con datos existentes
- **Hacia adelante**: Preparado para futuras expansiones
- **Migración**: Automática y sin pérdida de datos

### Rendimiento
- **Importación**: Procesamiento en lotes optimizado
- **Exportación**: Consultas eficientes con joins
- **Memoria**: Manejo eficiente de archivos grandes

## 🔮 Próximas Mejoras

### Funcionalidades Planificadas
1. **Validación en tiempo real** durante la edición de Excel
2. **Plantillas específicas** por tipo de negocio
3. **Importación programada** automática
4. **Sincronización** con sistemas externos
5. **Reportes automáticos** post-importación

### Optimizaciones Técnicas
1. **Procesamiento paralelo** para archivos grandes
2. **Compresión** de archivos exportados
3. **Cache** de datos de referencia
4. **Validación previa** antes de importación

## 📞 Soporte

### Problemas Comunes
1. **Error de formato**: Verificar que el archivo sea Excel válido
2. **Datos faltantes**: Completar campos obligatorios
3. **IDs inválidos**: Verificar que existan en el sistema
4. **Errores de conexión**: Verificar conectividad a Supabase

### Contacto
Para soporte técnico o reportar problemas, contactar al equipo de desarrollo.

---

**Fecha de Implementación**: 27 de Junio, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Completado y Funcional 