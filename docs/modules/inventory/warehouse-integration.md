# Integración del Sistema de Bodegas

## Resumen
Documentación sobre cómo el sistema de gestión de bodegas se integra con otros módulos de la aplicación y cómo extender sus funcionalidades.

## Integración con Otros Módulos

### 1. Productos
El sistema de bodegas está estrechamente integrado con el módulo de productos:

#### Relaciones de Base de Datos
```prisma
model Warehouse_Product {
  id          Int       @id @default(autoincrement())
  productId   Int
  warehouseId Int
  createdAt   DateTime  @default(now())
  
  Product     Product   @relation(fields: [productId], references: [id])
  Warehouse   Warehouse @relation(fields: [warehouseId], references: [id])
  
  @@unique([productId, warehouseId])
}
```

#### Funcionalidades Compartidas
- **Ver productos desde bodega**: `/warehouses/[id]/products`
- **Editar producto desde bodega**: Redirección a `/products/edit/[productId]`
- **Asignar/Remover productos**: Server actions bidireccionales

### 2. Inventario
Las bodegas son la base para el sistema de inventario:

#### Relación con Inventarios
```prisma
model Inventory {
  id          Int       @id @default(autoincrement())
  warehouseId Int
  productId   Int
  quantity    Int
  // ... otros campos
  
  Warehouse   Warehouse @relation(fields: [warehouseId], references: [id])
  Product     Product   @relation(fields: [productId], references: [id])
}
```

#### Integración en Dashboard
- **Contador de inventarios** en tabla de bodegas
- **Filtros por bodega** en vista de inventarios
- **Reportes por ubicación** física

### 3. Navegación Global

#### Menú Lateral
```typescript
// src/constants/index.ts
export const NAVIGATION_ITEMS = [
  {
    title: "Inventario",
    items: [
      {
        title: "Bodegas",
        href: "/configuration/inventory",
        subItems: [
          { title: "Ver todas", href: "/warehouses" },
          { title: "Crear bodega", href: "/warehouses/create" }
        ]
      }
    ]
  }
];
```

#### Breadcrumbs
```
Configuración → Inventario → Bodegas → [Acción específica]
```

## Server Actions Reutilizables

### Funciones Exportadas
```typescript
// src/actions/configuration/warehouse-actions.ts

// ✅ Funciones públicas reutilizables
export async function getWarehouses({ page, pageSize })
export async function getWarehouseById(id)
export async function getWarehousesForParent(excludeId)
export async function assignProductToWarehouse(productId, warehouseId)
export async function removeProductFromWarehouse(productId, warehouseId)

// ✅ Funciones para formularios
export async function createWarehouse(formData)
export async function updateWarehouse(id, formData)
export async function deleteWarehouseAction(formData)
export async function removeProductFromWarehouseAction(formData)
```

### Uso en Otros Módulos

#### Desde el módulo de Productos
```typescript
// src/app/products/[id]/page.tsx
import { getWarehouses } from '@/actions/configuration/warehouse-actions';

export default async function ProductPage({ params }) {
  const { data: warehouses } = await getWarehouses({ pageSize: 100 });
  
  return (
    <div>
      <h2>Bodegas donde está este producto:</h2>
      {warehouses.map(warehouse => (
        <div key={warehouse.id}>{warehouse.name}</div>
      ))}
    </div>
  );
}
```

#### Desde el módulo de Inventario
```typescript
// src/app/inventory/page.tsx
import { getWarehousesForParent } from '@/actions/configuration/warehouse-actions';

export default async function InventoryPage() {
  const parentWarehouses = await getWarehousesForParent();
  
  return (
    <select name="warehouseFilter">
      {parentWarehouses.map(warehouse => (
        <option key={warehouse.id} value={warehouse.id}>
          {warehouse.name}
        </option>
      ))}
    </select>
  );
}
```

## Componentes Reutilizables

### 1. Tabla Genérica
```typescript
// src/components/shared/Table.tsx
// ✅ Reutilizable para cualquier entidad
import { Table } from '@/components/shared/Table';

<Table<MyEntityType>
  data={entities}
  columns={columns}
  rowKey="id"
  actions={{
    editLink: (row) => `/edit/${row.id}`,
    deleteAction: deleteAction
  }}
/>
```

### 2. Botones de Acción
```typescript
// src/components/shared/DeleteButton.tsx
// ✅ Reutilizable para cualquier eliminación
import { DeleteButton } from '@/components/shared/DeleteButton';

<DeleteButton
  deleteAction={deleteAction}
  id={entityId}
  confirmMessage="¿Eliminar este elemento?"
/>
```

### 3. Selectores de Bodega
```typescript
// Posible componente futuro
// src/components/shared/WarehouseSelector.tsx
'use client';

export function WarehouseSelector({ 
  onChange, 
  value, 
  excludeIds = [], 
  typeFilter 
}) {
  // Lógica para mostrar selector de bodegas
  // Con filtros por tipo y exclusiones
}
```

## Extensibilidad

### 1. Agregar Nuevos Tipos de Bodega

#### Paso 1: Actualizar Enum
```prisma
// prisma/schema.prisma
enum WarehouseType {
  // ... tipos existentes
  DEVOLUCION    // ✅ Nuevo tipo
  MANTENIMIENTO // ✅ Nuevo tipo
}
```

#### Paso 2: Actualizar Constantes
```typescript
// src/constants/warehouse.ts
export const WAREHOUSE_TYPES = [
  // ... tipos existentes
  { value: 'DEVOLUCION', label: 'Devolución' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
];
```

#### Paso 3: Actualizar UI
```typescript
// src/components/shared/WarehouseTable.tsx
const getBadgeColor = (type) => {
  switch (type) {
    // ... casos existentes
    case 'DEVOLUCION': return 'bg-orange-100 text-orange-800';
    case 'MANTENIMIENTO': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

### 2. Agregar Nuevas Funcionalidades

#### Server Actions Adicionales
```typescript
// src/actions/configuration/warehouse-actions.ts

export async function moveProductBetweenWarehouses(
  productId: number,
  fromWarehouseId: number,
  toWarehouseId: number,
  quantity: number
) {
  // Lógica para transferencias entre bodegas
}

export async function getWarehouseCapacity(warehouseId: number) {
  // Lógica para calcular capacidad
}

export async function getWarehouseReport(warehouseId: number, dateRange: DateRange) {
  // Lógica para generar reportes
}
```

#### Nuevas Páginas
```
src/app/(dashboard)/configuration/inventory/warehouses/
├── reports/
│   └── page.tsx                 # Reportes generales
├── [id]/
│   ├── capacity/
│   │   └── page.tsx            # Gestión de capacidad
│   ├── transfers/
│   │   └── page.tsx            # Transferencias
│   └── settings/
│       └── page.tsx            # Configuración específica
```

### 3. Hooks Personalizados

```typescript
// src/hooks/useWarehouses.ts
'use client';

export function useWarehouses(options = {}) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Lógica para cargar bodegas en cliente
  }, []);
  
  return { warehouses, loading, refetch };
}

// src/hooks/useWarehouseProducts.ts
export function useWarehouseProducts(warehouseId: number) {
  // Lógica para productos de bodega específica
}
```

## APIs para Integraciones Externas

### 1. API Routes (Opcional)
```typescript
// src/app/api/warehouses/route.ts
import { getWarehouses } from '@/actions/configuration/warehouse-actions';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  
  const result = await getWarehouses({ page, pageSize });
  
  return Response.json(result);
}
```

### 2. Webhooks (Futuro)
```typescript
// src/app/api/webhooks/warehouse-events/route.ts
export async function POST(request: Request) {
  const event = await request.json();
  
  switch (event.type) {
    case 'warehouse.created':
      // Notificar sistemas externos
      break;
    case 'product.assigned':
      // Actualizar inventarios externos
      break;
  }
}
```

## Testing

### 1. Tests de Integración
```typescript
// __tests__/integration/warehouse-product.test.ts
describe('Warehouse-Product Integration', () => {
  test('should assign product to warehouse', async () => {
    const result = await assignProductToWarehouse(productId, warehouseId);
    expect(result).toBeDefined();
  });
  
  test('should remove product from warehouse', async () => {
    await removeProductFromWarehouse(productId, warehouseId);
    const products = await getProductsByWarehouse(warehouseId);
    expect(products.data).not.toContainEqual(
      expect.objectContaining({ productId })
    );
  });
});
```

### 2. Tests de Componentes
```typescript
// __tests__/components/WarehouseTable.test.tsx
import { render } from '@testing-library/react';
import { WarehouseTable } from '@/components/shared/WarehouseTable';

test('renders warehouse table with data', () => {
  const mockData = [
    { id: 1, name: 'Bodega Test', type: 'INVENTARIO' }
  ];
  
  render(
    <WarehouseTable 
      data={mockData} 
      deleteAction={jest.fn()} 
    />
  );
  
  expect(screen.getByText('Bodega Test')).toBeInTheDocument();
});
```

## Configuración de Despliegue

### 1. Variables de Entorno
```env
# .env.production
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."

# Configuraciones específicas de bodegas
WAREHOUSE_DEFAULT_PAGE_SIZE=10
WAREHOUSE_MAX_HIERARCHY_DEPTH=5
```

### 2. Migraciones de Base de Datos
```bash
# Comandos para despliegue
npx prisma generate
npx prisma db push
# o
npx prisma migrate deploy
```

### 3. Seeds Iniciales
```typescript
// prisma/seeds/warehouses.ts
export async function seedWarehouses() {
  await prisma.warehouse.createMany({
    data: [
      {
        name: 'Bodega Principal',
        location: 'Planta Central',
        type: 'INVENTARIO',
        description: 'Bodega principal de inventario'
      },
      {
        name: 'Bodega de Ventas',
        location: 'Área de Ventas',
        type: 'VENTA',
        description: 'Productos listos para venta'
      }
    ]
  });
}
```

## Monitoreo y Métricas

### 1. Logs Importantes
- Creación/edición/eliminación de bodegas
- Asignación/remoción de productos
- Errores de validación
- Problemas de performance

### 2. Métricas de Negocio
- Número total de bodegas por tipo
- Utilización de bodegas (productos/capacidad)
- Frecuencia de transferencias
- Tiempo promedio de operaciones

---

**Documentado por**: AI Assistant  
**Fecha**: 2024  
**Versión**: 1.0  
**Sistema**: Completamente integrado 