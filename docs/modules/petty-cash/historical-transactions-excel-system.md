# Sistema de Transacciones Históricas por Excel - Caja Chica

## 📋 Resumen Ejecutivo

Sistema completo de gestión de transacciones históricas de caja chica **exclusivamente mediante archivos Excel**, eliminando el ingreso manual. Incluye plantillas con instrucciones, validaciones automáticas, barra de progreso y reportes detallados.

## 🎯 Características Principales

### ✅ Funcionalidades Implementadas

1. **Importación/Exportación Excel Completa**
   - Plantillas con instrucciones detalladas
   - Validaciones automáticas de datos
   - Barra de progreso en tiempo real
   - Reporte detallado de errores
   - Soporte para múltiples tipos de transacciones

2. **Tipos de Transacciones Soportados**
   - **Gastos**: Desembolsos de caja chica
   - **Ingresos Directos**: Dinero que entra a caja
   - **Compras**: Adquisiciones de productos/servicios

3. **Validaciones Automáticas**
   - Formato de fechas
   - Montos numéricos válidos
   - Categorías y centros de costo existentes
   - Sesiones de caja válidas
   - Campos obligatorios

## 📊 Estructura de Datos

### Tablas de Base de Datos

```sql
-- Tabla de Gastos
PettyCashExpense {
  id: number (PK)
  sessionId: number (FK -> CashSession)
  amount: number
  description: string
  category: string
  costCenterId: number (FK -> CostCenter)
  receiptNumber: string
  createdAt: timestamp
  status: string ('pending', 'approved', 'rejected')
  userId: number (FK -> User)
}

-- Tabla de Compras
PettyCashPurchase {
  id: number (PK)
  sessionId: number (FK -> CashSession)
  quantity: number
  productId: number (FK -> Product)
  unitPrice: number
  supplierId: number (FK -> Supplier)
  createdAt: timestamp
  status: string ('pending', 'approved', 'rejected')
  userId: number (FK -> User)
}

-- Tabla de Ingresos Directos
PettyCashIncome {
  id: number (PK)
  sessionId: number (FK -> CashSession)
  amount: number
  description: string
  category: string
  paymentMethod: string
  notes: string
  createdAt: timestamp
}
```

## 🔧 Componentes del Sistema

### 1. Modal de Gestión Histórica
**Archivo**: `src/components/petty-cash/HistoricalTransactionsModal.tsx`

### 2. Funciones de Importación/Exportación
**Archivo**: `src/actions/configuration/petty-cash-actions.ts`

### 3. Parser de Datos Excel
**Archivo**: `src/lib/import-parsers.ts`

## 📁 Estructura de Plantillas Excel

### Plantilla de Gastos
```
| Fecha       | Monto | Descripción | Categoría | Centro de Costo | N° Recibo |
|-------------|-------|-------------|-----------|-----------------|-----------|
| 2024-01-15  | 50000 | Combustible | Transporte | Mantenimiento   | R001      |
```

### Plantilla de Compras
```
| Fecha       | Cantidad | Producto | Precio Unitario | Proveedor |
|-------------|----------|----------|-----------------|-----------|
| 2024-01-15  | 10       | Papel    | 5000           | OfficeMax |
```

### Plantilla de Ingresos
```
| Fecha       | Monto | Descripción | Categoría | Método de Pago |
|-------------|-------|-------------|-----------|----------------|
| 2024-01-15  | 100000| Reembolso  | Reembolso | Efectivo       |
```

## 🚀 Migraciones Aplicadas

### Migración de Status
```sql
-- Agregar columna status a PettyCashExpense
ALTER TABLE "PettyCashExpense" 
ADD COLUMN "status" TEXT DEFAULT 'pending';

-- Agregar columna status a PettyCashPurchase
ALTER TABLE "PettyCashPurchase" 
ADD COLUMN "status" TEXT DEFAULT 'pending';
```

### Migración de UserId
```sql
-- Agregar columna userId a PettyCashExpense
ALTER TABLE "PettyCashExpense" 
ADD COLUMN "userId" BIGINT REFERENCES "User"("id");

-- Agregar columna userId a PettyCashPurchase
ALTER TABLE "PettyCashPurchase" 
ADD COLUMN "userId" BIGINT REFERENCES "User"("id");
```

## 🎯 Estado Actual del Sistema

### ✅ Completado
- [x] Sistema de importación/exportación Excel
- [x] Validaciones automáticas
- [x] Interfaz de usuario mejorada
- [x] Migraciones de base de datos
- [x] Corrección de errores de importación
- [x] Sistema de transacciones históricas

### 🔄 En Funcionamiento
- [x] Modal de gestión histórica
- [x] Plantillas Excel con instrucciones
- [x] Barra de progreso y reportes
- [x] Validaciones de seguridad
- [x] Integración con sistema de caja chica

## 📝 Instrucciones de Uso

### Para Administradores

1. **Acceder al Sistema**
   - Ir a Dashboard → Caja Chica
   - Hacer clic en "Gestionar Histórico"

2. **Importar Transacciones**
   - Descargar plantilla Excel
   - Llenar datos según formato
   - Subir archivo al sistema
   - Revisar reporte de errores

3. **Exportar Transacciones**
   - Seleccionar sesión de caja
   - Hacer clic en "Exportar"
   - Descargar archivo Excel

---

**Fecha de Implementación**: Enero 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Completado y Funcionando 