# Sistema Integrado de Caja Chica y Cierre de Caja

## Descripción General

El sistema integrado de caja chica y cierre de caja es un módulo completo que permite gestionar gastos menores, compras urgentes y realizar el cierre automático de sesiones de caja de manera eficiente y controlada.

## Características Principales

### 🔄 Flujo Integrado del Día
1. **Apertura de Sesión**: Inicio con monto base de efectivo
2. **Gestión de Ventas**: Registro automático de ventas (efectivo/tarjeta)
3. **Caja Chica**: Control de gastos menores y compras urgentes
4. **Cierre Automático**: Conciliación precisa al final del turno

### 💰 Sistema de Caja Chica
- **Límites Configurables**: $30,000 diarios, $15,000 sin aprobación
- **Categorías de Gastos**: Suministros, transporte, alimentación, servicios, mantenimiento
- **Flujo de Aprobaciones**: Automático para montos menores, manual para montos mayores
- **Integración con Inventario**: Las compras actualizan automáticamente el stock

### 🔒 Cierre de Caja Inteligente
- **Cálculo Automático**: Efectivo esperado vs. efectivo real
- **Tolerancia de Diferencias**: Hasta $1,000 sin aprobación de supervisor
- **Conciliación Completa**: Incluye ventas, gastos y compras del día
- **Reportes Detallados**: Resumen completo de la sesión

## Estructura de la Base de Datos

### Modelos Principales

#### CashSession
```prisma
model CashSession {
  id              Int                    @id @default(autoincrement())
  sessionNumber   String                 @unique // S2025-06-19-001
  userId          Int
  cashRegisterId  Int
  openingAmount   Float
  closingAmount   Float?
  openedAt        DateTime               @default(now())
  closedAt        DateTime?
  status          CashSessionStatus      @default(OPEN)
  notes           String?
}
```

#### PettyCashExpense
```prisma
model PettyCashExpense {
  id            Int                @id @default(autoincrement())
  description   String
  amount        Float
  category      ExpenseCategory
  status        TransactionStatus  @default(PENDING)
  receiptImage  String?
  requestedBy   Int
  approvedBy    Int?
  sessionId     Int
}
```

#### PettyCashPurchase
```prisma
model PettyCashPurchase {
  id            Int                @id @default(autoincrement())
  description   String
  productName   String
  quantity      Int
  unitPrice     Float
  totalAmount   Float
  supplier      String?
  status        TransactionStatus  @default(PENDING)
  sessionId     Int
  productId     Int?
}
```

#### CashClosure
```prisma
model CashClosure {
  id                  Int           @id @default(autoincrement())
  sessionId           Int           @unique
  totalSales          Float
  salesCash           Float
  salesCard           Float
  totalExpenses       Float
  totalPurchases      Float
  expectedCash        Float
  actualCash          Float
  difference          Float
  status              ClosureStatus @default(PENDING)
  supervisorApproval  Boolean       @default(false)
}
```

## Arquitectura de Componentes

### Componentes de React

#### PettyCashDashboard.tsx
- **Propósito**: Componente principal con pestañas (Vista General, Caja Chica, Cierre)
- **Estado**: Maneja la navegación entre pestañas y estados de modales
- **Funcionalidades**: Integra todos los subcomponentes y modales

#### ExpenseForm.tsx
- **Propósito**: Modal para registrar gastos de caja chica
- **Validaciones**: Límites de monto, categorías requeridas
- **Integración**: Server actions para persistencia

#### PurchaseForm.tsx
- **Propósito**: Modal para registrar compras con caja chica
- **Funcionalidades**: Cálculo automático de totales, validación de límites
- **Integración**: Vinculación opcional con productos existentes

#### CashClosureModal.tsx
- **Propósito**: Modal para realizar cierre de caja
- **Cálculos**: Diferencias automáticas, tolerancias configurables
- **Validaciones**: Aprobación automática o manual según diferencias

### Server Actions

#### petty-cash-actions.ts
```typescript
// Gestión de sesiones
export async function createCashSession(formData: FormData)
export async function getCurrentCashSession(cashRegisterId: number)

// Gestión de gastos
export async function createPettyCashExpense(formData: FormData)
export async function approvePettyCashExpense(formData: FormData)
export async function rejectPettyCashExpense(formData: FormData)

// Gestión de compras
export async function createPettyCashPurchase(formData: FormData)
export async function approvePettyCashPurchase(formData: FormData)
export async function rejectPettyCashPurchase(formData: FormData)

// Reportes y resúmenes
export async function getPettyCashSummary(sessionId: number)
```

#### cash-closure-actions.ts
```typescript
// Cierre de caja
export async function getCashClosureSummary(sessionId: number)
export async function createCashClosure(formData: FormData)
export async function approveCashClosure(formData: FormData)
export async function rejectCashClosure(formData: FormData)

// Reportes
export async function getDailyCashReport(date: Date)
```

## Flujos de Trabajo

### 1. Apertura de Sesión
1. Usuario solicita apertura de sesión
2. Sistema genera número de sesión único (S2025-06-19-001)
3. Se registra monto de apertura
4. Sesión queda activa para el usuario

### 2. Registro de Gastos
1. Usuario accede a "Nuevo Gasto"
2. Completa formulario (descripción, monto, categoría)
3. Sistema valida límites disponibles
4. Si monto ≤ $15,000: Aprobación automática
5. Si monto > $15,000: Requiere aprobación de supervisor

### 3. Registro de Compras
1. Usuario accede a "Comprar Productos"
2. Completa datos del producto y proveedor
3. Sistema calcula total automáticamente
4. Aplica misma lógica de aprobación que gastos
5. Una vez aprobado: Actualiza inventario automáticamente

### 4. Cierre de Caja
1. Usuario accede a "Cierre de Caja"
2. Sistema calcula efectivo esperado:
   - Monto apertura + Ventas efectivo - Gastos - Compras
3. Usuario cuenta efectivo real en caja
4. Sistema calcula diferencia
5. Si diferencia ≤ $1,000: Aprobación automática
6. Si diferencia > $1,000: Requiere aprobación de supervisor
7. Sesión se cierra y se genera reporte

## Reglas de Negocio

### Límites y Aprobaciones
- **Límite diario**: $30,000 por usuario por día
- **Límite sin aprobación**: $15,000 por transacción
- **Tolerancia de cierre**: $1,000 de diferencia

### Estados de Transacciones
- **PENDING**: Requiere aprobación
- **APPROVED**: Aprobada y procesada
- **REJECTED**: Rechazada por supervisor

### Estados de Sesiones
- **OPEN**: Sesión activa
- **CLOSED**: Sesión cerrada exitosamente
- **SUSPENDED**: Sesión suspendida (emergencia)

## Integraciones

### Con Sistema de Inventario
- Las compras aprobadas actualizan automáticamente el stock
- Vinculación opcional con productos existentes
- Registro de movimientos de inventario

### Con Sistema de Ventas
- Cálculo automático de ventas del día
- Separación entre efectivo y tarjetas
- Integración en cierre de caja

### Con Sistema de Usuarios
- Control de permisos por rol
- Trazabilidad de acciones por usuario
- Aprobaciones jerárquicas

## Configuración

### Variables de Entorno
```
PETTY_CASH_DAILY_LIMIT=30000
PETTY_CASH_APPROVAL_LIMIT=15000
CASH_CLOSURE_TOLERANCE=1000
```

### Configuración de Roles
- **admin**: Acceso completo, aprobaciones, reportes
- **assistant**: Registro de gastos y compras básicas
- **supervisor**: Aprobaciones, cierre de caja

## Consideraciones de Seguridad

### Auditoría
- Registro completo de todas las transacciones
- Timestamps automáticos
- Trazabilidad de aprobaciones/rechazos

### Validaciones
- Validación de límites en cliente y servidor
- Verificación de permisos por rol
- Prevención de transacciones duplicadas

### Respaldos
- Cierre automático de sesiones antiguas
- Respaldo de datos de cierre
- Logs de auditoría

## Instalación y Despliegue

### 1. Migración de Base de Datos
```bash
npx prisma migrate dev
npx prisma generate
```

### 2. Configuración de Permisos
```typescript
// Agregar permisos en el seeder
await prisma.permission.createMany({
  data: [
    { action: 'petty_cash.create', roleId: assistantRole.id },
    { action: 'petty_cash.approve', roleId: supervisorRole.id },
    { action: 'cash_closure.create', roleId: assistantRole.id },
    { action: 'cash_closure.approve', roleId: supervisorRole.id },
  ]
});
```

### 3. Configuración de Menús
Los menús ya están configurados en `/src/constants/index.ts` para los roles:
- admin: Acceso completo al módulo
- assistant: Acceso básico para registro
- supervisor: Acceso para aprobaciones

## Mantenimiento y Monitoreo

### Tareas Programadas
- Cierre automático de sesiones abandonadas (24h)
- Generación de reportes diarios
- Limpieza de logs antiguos (30 días)

### Métricas a Monitorear
- Número de transacciones por día
- Diferencias promedio en cierres de caja
- Tiempo promedio de aprobaciones
- Utilización de límites por usuario

### Logs Importantes
- Errores en cálculos de cierre
- Transacciones rechazadas
- Diferencias significativas en caja
- Intentos de acceso no autorizado

## Próximas Mejoras

### Funcionalidades Planeadas
- **Reportes Avanzados**: Gráficos y análisis de tendencias
- **Notificaciones**: Push/email para aprobaciones pendientes
- **Integración con ERP**: Sincronización con sistemas contables
- **App Móvil**: Acceso desde dispositivos móviles
- **OCR para Recibos**: Digitalización automática de comprobantes

### Optimizaciones Técnicas
- Cache de cálculos frecuentes
- Paginación en listados grandes
- Compresión de imágenes de recibos
- Backup incremental de datos 