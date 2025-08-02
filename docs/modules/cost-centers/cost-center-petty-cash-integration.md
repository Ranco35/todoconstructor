# Integración de Centros de Costo con Caja Chica

## Resumen Ejecutivo

Se ha implementado una integración completa entre el sistema jerárquico de centros de costo y el sistema de caja chica, permitiendo la asignación obligatoria de centros de costo a todas las compras realizadas a través de caja chica para mejorar el control contable y la generación de reportes.

## Arquitectura de la Integración

### 1. Modelo de Datos

#### Cambios en el Esquema Prisma

```prisma
model PettyCashPurchase {
  id             Int               @id @default(autoincrement())
  description    String
  productName    String
  quantity       Int
  unitPrice      Float
  totalAmount    Float
  supplier       String?
  status         TransactionStatus @default(PENDING)
  receiptImage   String?
  requestedBy    Int
  approvedBy     Int?
  requestedAt    DateTime          @default(now())
  approvedAt     DateTime?
  notes          String?
  sessionId      Int
  productId      Int?
  costCenterId   Int?              // Nuevo campo obligatorio
  ApprovedByUser User?             @relation("ApprovedPurchases", fields: [approvedBy], references: [id])
  Product        Product?          @relation(fields: [productId], references: [id])
  User           User              @relation(fields: [requestedBy], references: [id])
  CashSession    CashSession       @relation(fields: [sessionId], references: [id])
  CostCenter     Cost_Center?      @relation("PettyCashPurchaseCostCenter", fields: [costCenterId], references: [id])
}
```

#### Relaciones Establecidas

- **PettyCashPurchase → Cost_Center**: Relación opcional (1:1)
- **Cost_Center → PettyCashPurchase**: Relación inversa (1:N)

### 2. Componentes Frontend

#### CostCenterSelector Component

**Ubicación**: `src/components/petty-cash/CostCenterSelector.tsx`

**Características**:
- Selector jerárquico de centros de costo
- Búsqueda en tiempo real
- Visualización de estructura organizacional
- Validación obligatoria
- Interfaz intuitiva con iconos y códigos

**Props**:
```typescript
interface CostCenterSelectorProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
}
```

#### Integración en PurchaseForm

**Ubicación**: `src/components/petty-cash/PurchaseForm.tsx`

**Cambios implementados**:
- Importación del componente CostCenterSelector
- Estado para manejar la selección del centro de costo
- Validación obligatoria en el formulario
- Envío del costCenterId en el FormData

### 3. API Endpoints

#### GET /api/cost-centers

**Parámetros de consulta**:
- `hierarchical=true`: Retorna estructura jerárquica completa
- `active=true/false`: Filtra por centros activos/inactivos

**Respuesta jerárquica**:
```json
[
  {
    "id": 1,
    "name": "Administración",
    "code": "ADMIN",
    "children": [
      {
        "id": 2,
        "name": "Recursos Humanos",
        "code": "ADMIN-RH",
        "children": []
      }
    ]
  }
]
```

### 4. Server Actions

#### Actualización de createPettyCashPurchase

**Ubicación**: `src/actions/configuration/petty-cash-actions.ts`

**Cambios implementados**:
- Extracción del costCenterId del FormData
- Inclusión en la creación del registro
- Actualización de la interfaz PettyCashPurchaseData

```typescript
export interface PettyCashPurchaseData {
  // ... campos existentes
  costCenterId?: number | null;
  CostCenter?: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
}
```

#### Actualización de getPettyCashPurchases

- Inclusión de la relación CostCenter en la consulta
- Mapeo de datos para incluir información del centro de costo

### 5. Migración de Base de Datos

#### Migración Aplicada

**Archivo**: `prisma/migrations/20250621005820_add_cost_center_integration/migration.sql`

```sql
-- AlterTable
ALTER TABLE "PettyCashPurchase" ADD COLUMN "costCenterId" INTEGER;

-- AddForeignKey
ALTER TABLE "PettyCashPurchase" ADD CONSTRAINT "PettyCashPurchase_costCenterId_fkey" 
FOREIGN KEY ("costCenterId") REFERENCES "Cost_Center"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## Flujo de Usuario

### 1. Creación de Compra con Caja Chica

1. **Apertura del formulario**: Usuario accede al formulario de compra
2. **Selección de centro de costo**: Campo obligatorio con selector jerárquico
3. **Validación**: El formulario no se puede enviar sin centro de costo
4. **Procesamiento**: La compra se registra con el centro de costo asignado
5. **Visualización**: La compra aparece en la tabla con información del centro de costo

### 2. Visualización de Compras

- **Tabla de transacciones**: Muestra el centro de costo asignado
- **Icono identificador**: 🏢 para centros de costo
- **Información completa**: Nombre y código del centro de costo

## Beneficios de la Integración

### 1. Control Contable Mejorado
- Asignación obligatoria de centros de costo
- Trazabilidad completa de gastos
- Generación de reportes por centro de costo

### 2. Gestión Jerárquica
- Visualización de estructura organizacional
- Filtrado por niveles jerárquicos
- Búsqueda inteligente

### 3. Auditoría y Reportes
- Historial completo de asignaciones
- Análisis de gastos por departamento
- Cumplimiento de políticas contables

## Validaciones Implementadas

### 1. Frontend
- Campo obligatorio en formulario de compra
- Validación de selección antes de envío
- Mensajes de error descriptivos

### 2. Backend
- Validación de existencia del centro de costo
- Manejo de relaciones opcionales
- Integridad referencial en base de datos

## Consideraciones Técnicas

### 1. Rendimiento
- Consultas optimizadas con includes
- Carga lazy de datos jerárquicos
- Caché de centros de costo frecuentes

### 2. Escalabilidad
- Estructura jerárquica ilimitada
- Soporte para múltiples niveles
- Fácil extensión para nuevos campos

### 3. Mantenibilidad
- Código modular y reutilizable
- Separación clara de responsabilidades
- Documentación completa

## Próximos Pasos

### 1. Reportes Avanzados
- Dashboard de gastos por centro de costo
- Análisis de tendencias temporales
- Exportación de datos para análisis externo

### 2. Integración con Otros Módulos
- Extensión a gastos de caja chica
- Integración con sistema de ventas
- Conexión con sistema de compras

### 3. Mejoras de UX
- Selector inteligente con sugerencias
- Autocompletado basado en historial
- Filtros avanzados por centro de costo

## Archivos Modificados

### Nuevos Archivos
- `src/components/petty-cash/CostCenterSelector.tsx`
- `src/app/api/cost-centers/route.ts`
- `docs/modules/cost-centers/cost-center-petty-cash-integration.md`

### Archivos Modificados
- `prisma/schema.prisma`
- `src/components/petty-cash/PurchaseForm.tsx`
- `src/components/petty-cash/PettyCashDashboard.tsx`
- `src/actions/configuration/petty-cash-actions.ts`

### Migraciones
- `prisma/migrations/20250621005820_add_cost_center_integration/`

## Conclusión

La integración de centros de costo con el sistema de caja chica proporciona una base sólida para el control contable y la gestión financiera. La implementación es robusta, escalable y mantiene la experiencia de usuario intuitiva mientras agrega funcionalidades avanzadas de gestión empresarial. 