# Sistema de Gestión de Bodegas

## Resumen
Sistema completo de gestión de bodegas implementado en Next.js con funcionalidades CRUD, tipos de bodega, jerarquías padre/hijo y gestión de productos por bodega.

## Características Principales

### 🏢 Gestión de Bodegas
- **Crear** nuevas bodegas con tipos específicos
- **Editar** bodegas existentes 
- **Eliminar** bodegas (con validaciones de seguridad)
- **Listar** bodegas con paginación y contadores
- **Jerarquías** padre/hijo entre bodegas

### 📦 Gestión de Productos por Bodega
- **Ver productos** asignados a cada bodega
- **Editar productos** directamente desde la bodega
- **Remover productos** de bodegas específicas
- **Asignar productos** a bodegas (preparado)

### 🏷️ Tipos de Bodega
- **Venta** - Para productos listos para venta
- **Inventario** - Almacenamiento general
- **Consumo Interno** - Productos de uso interno
- **Producción** - Materias primas y productos en proceso
- **Mermas** - Productos dañados o vencidos
- **Recepción de Mercadería** - Zona de entrada de productos
- **Tránsito** - Productos en movimiento

## Estructura de Archivos

### Server Actions
```
src/actions/configuration/warehouse-actions.ts
├── createWarehouse(formData)
├── updateWarehouse(id, formData)
├── deleteWarehouse(id)
├── deleteWarehouseAction(formData)
├── removeProductFromWarehouseAction(formData)
├── getWarehouses({ page, pageSize })
├── getWarehouseById(id)
├── getProductsByWarehouse(warehouseId, { page, pageSize })
├── assignProductToWarehouse(productId, warehouseId)
├── removeProductFromWarehouse(productId, warehouseId)
└── getWarehousesForParent(excludeId)
```

### Páginas
```
src/app/(dashboard)/configuration/inventory/warehouses/
├── page.tsx                    # Lista principal de bodegas
├── create/page.tsx            # Crear nueva bodega
├── edit/[id]/page.tsx         # Editar bodega existente
└── [id]/products/page.tsx     # Ver productos por bodega
```

### Componentes
```
src/components/shared/
├── Table.tsx                           # Tabla genérica (servidor)
├── WarehouseTable.tsx                  # Tabla específica para bodegas (cliente)
├── DeleteButton.tsx                    # Botón eliminar genérico (cliente)
└── RemoveProductFromWarehouseButton.tsx # Botón remover producto (cliente)
```

### Constantes
```
src/constants/warehouse.ts
└── WAREHOUSE_TYPES              # Tipos de bodega disponibles
```

## Base de Datos

### Esquema Prisma
```prisma
enum WarehouseType {
  VENTA
  INVENTARIO  
  CONSUMO_INTERNO
  PRODUCCION
  MERMAS
  RECEPCION_MERCADERIA
  TRANSITO
}

model Warehouse {
  id            Int             @id @default(autoincrement())
  name          String          @unique
  description   String?
  location      String
  type          WarehouseType   @default(INVENTARIO)
  parentId      Int?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  // Relaciones jerárquicas
  Parent        Warehouse?      @relation("WarehouseHierarchy", fields: [parentId], references: [id])
  Children      Warehouse[]     @relation("WarehouseHierarchy")
  
  // Relaciones de productos e inventario
  Warehouse_Product Warehouse_Product[]
  Inventory         Inventory[]
}
```

### Relaciones
- **Warehouse ↔ Warehouse** (Parent/Children): Jerarquía de bodegas
- **Warehouse ↔ Product**: A través de `Warehouse_Product` (muchos a muchos)
- **Warehouse ↔ Inventory**: Una bodega puede tener múltiples inventarios

## Funcionalidades Detalladas

### 1. CRUD de Bodegas

#### Crear Bodega
- **Ruta**: `/configuration/inventory/warehouses/create`
- **Campos obligatorios**: Nombre, Ubicación, Tipo
- **Campos opcionales**: Descripción, Bodega Padre
- **Validaciones**: 
  - Nombre único
  - Tipo válido del enum
  - Bodega padre existente

#### Editar Bodega
- **Ruta**: `/configuration/inventory/warehouses/edit/[id]`
- **Validaciones adicionales**:
  - No puede ser padre de sí misma
  - Mantiene relaciones existentes

#### Eliminar Bodega
- **Confirmación obligatoria**
- **Validaciones**:
  - No puede eliminar si tiene productos asociados
  - Maneja relaciones padre/hijo automáticamente

### 2. Vista de Lista de Bodegas

#### Tabla Principal
| Columna | Descripción |
|---------|-------------|
| ID | Identificador único |
| Nombre | Nombre de la bodega |
| Tipo | Badge colorido según tipo |
| Ubicación | Dirección física |
| Bodega Padre | Nombre de la bodega padre |
| Hijos | Cantidad de bodegas hijas |
| Productos | Cantidad de productos asignados |
| Ver Productos | Enlace directo a productos |
| Acciones | Editar y Eliminar |

#### Badges de Tipos
- 🟢 **Venta**: Verde (bg-green-100)
- 🔵 **Inventario**: Azul (bg-blue-100)  
- 🟣 **Producción**: Púrpura (bg-purple-100)
- 🔴 **Mermas**: Rojo (bg-red-100)
- ⚪ **Otros**: Gris (bg-gray-100)

### 3. Gestión de Productos por Bodega

#### Vista de Productos
- **Ruta**: `/configuration/inventory/warehouses/[id]/products`
- **Información mostrada**:
  - Datos del producto (nombre, código, categoría, proveedor)
  - Stock actual
  - Precio de venta
  - Acciones disponibles

#### Acciones de Producto
- **✏️ Editar producto**: Redirige a `/configuration/products/edit/[productId]`
- **🗑️ Remover de bodega**: Elimina relación producto-bodega
- **Confirmación personalizada**: Muestra nombre del producto

## Arquitectura Técnica

### Separación Server/Client Components

#### Server Components
- **Páginas principales**: Manejan datos y server actions
- **Table.tsx**: Componente genérico para tablas
- **Lógica de negocio**: En server actions

#### Client Components  
- **WarehouseTable.tsx**: Tabla específica con lógica compleja
- **DeleteButton.tsx**: Manejo de confirmaciones
- **RemoveProductFromWarehouseButton.tsx**: Acciones específicas

### Server Actions

#### Patrón de Implementación
```typescript
export async function actionName(formData: FormData) {
  // 1. Validación de datos de entrada
  const data = validateInput(formData);
  
  // 2. Lógica de base de datos
  try {
    await prisma.operation(data);
  } catch (error) {
    // Manejo específico de errores Prisma
    handlePrismaError(error);
  }
  
  // 3. Revalidación y redirect (FUERA del try-catch)
  revalidatePath('/target/path');
  redirect('/success/path');
}
```

#### Manejo de Errores
- **P2002**: Violación de restricción única
- **P2025**: Registro no encontrado  
- **P2003**: Error de clave foránea
- **Logging detallado** para debugging

### Componentes de UI

#### Botones de Acción
```typescript
// Botón estándar
<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
  Acción
</button>

// Botón de eliminar
<button className="text-red-600 hover:text-red-900">
  🗑️ Eliminar
</button>
```

#### Confirmaciones
```typescript
onClick={(e) => {
  if (!window.confirm('¿Estás seguro?')) {
    e.preventDefault();
  }
}}
```

## Navegación y Rutas

### Flujo Principal
```
/configuration/inventory/warehouses
├── /create                     # Crear bodega
├── /edit/[id]                 # Editar bodega
├── /[id]/products             # Ver productos
└── ?page=X&pageSize=Y         # Paginación
```

### Enlaces de Navegación
- **Menú lateral**: "Bodegas" en sección Inventario
- **Breadcrumbs**: Configuración → Inventario → Bodegas
- **Botones contextuales**: Crear, Editar, Ver productos

## Paginación

### Implementación
- **Parámetros URL**: `page` y `pageSize`
- **Valores por defecto**: página 1, 10 elementos
- **Información mostrada**: "Mostrando X de Y elementos"
- **Controles**: Anterior/Siguiente con validaciones

### Server Actions con Paginación
```typescript
export async function getWarehouses({ page = 1, pageSize = 10 }) {
  const skip = (page - 1) * pageSize;
  
  const [data, totalCount] = await prisma.$transaction([
    prisma.warehouse.findMany({ skip, take: pageSize }),
    prisma.warehouse.count()
  ]);
  
  return { data, totalCount, page, pageSize };
}
```

## Validaciones

### Frontend
- **Campos requeridos**: HTML5 required
- **Tipos de input**: apropiados para cada campo
- **Confirmaciones**: Para acciones destructivas

### Backend
- **Validación de tipos**: WarehouseType enum
- **IDs válidos**: parseInt con validación NaN
- **Datos obligatorios**: Verificación de presencia
- **Relaciones**: Validación de existencia

## Resolución de Problemas

### Errores Comunes Resueltos

#### 1. Error NEXT_REDIRECT
**Problema**: Server actions con redirect capturados en try-catch
**Solución**: Mover redirect fuera del try-catch

#### 2. Error "Functions cannot be passed to Client Components"
**Problema**: Server actions pasadas a componentes cliente
**Solución**: Separar lógica en componentes específicos

#### 3. Error de tipos TypeScript
**Problema**: `T[keyof T]` no asignable a `string | number`
**Solución**: Cast explícito `String(value)`

### Debugging
- **Logging detallado** en server actions
- **Validación de datos** en cada paso
- **Manejo específico** de errores Prisma

## Extensiones Futuras

### Funcionalidades Pendientes
- **Asignar productos a bodegas**: Implementar interfaz
- **Reportes de inventario**: Dashboards y métricas
- **Movimientos entre bodegas**: Transferencias
- **Historial de cambios**: Auditoría de operaciones

### Mejoras Técnicas
- **Búsqueda y filtros**: En tablas
- **Ordenamiento**: Por columnas
- **Exportación**: PDF/Excel
- **Notificaciones**: Toast messages

## Testing

### Funcionalidades Probadas
- ✅ Crear bodega con todos los tipos
- ✅ Editar bodega manteniendo relaciones
- ✅ Eliminar bodega con validaciones
- ✅ Ver productos por bodega
- ✅ Editar producto desde bodega
- ✅ Remover producto de bodega
- ✅ Navegación completa
- ✅ Paginación funcional
- ✅ Confirmaciones de usuario

### Casos de Prueba
1. **Flujo completo**: Crear → Editar → Ver productos → Eliminar
2. **Validaciones**: Campos requeridos y restricciones
3. **Errores**: Manejo de casos excepcionales
4. **Navegación**: Todos los enlaces funcionan
5. **Responsive**: Interfaz adaptable

---

**Sistema implementado por**: AI Assistant  
**Fecha**: 2024  
**Versión**: 1.0  
**Estado**: ✅ Completamente funcional 