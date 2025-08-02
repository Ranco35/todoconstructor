# Integración de Caja Chica con Productos y Categorías del Sistema

## Descripción General

El módulo de caja chica ahora está completamente integrado con el sistema de productos y categorías, permitiendo:

1. **Gastos clasificados por categorías del sistema**
2. **Compras vinculadas a productos existentes**
3. **Actualización automática de inventario**
4. **Trazabilidad completa de transacciones**

---

## 🔗 Integración con Productos

### Compras de Caja Chica

#### Modo: Producto Existente
- **Selector de categorías**: Filtra productos por categoría del sistema
- **Selector de productos**: Muestra productos registrados con información completa
- **Auto-completado**: Llena automáticamente nombre, precio y proveedor
- **Conexión directa**: Vincula la compra al producto específico

#### Modo: Producto Nuevo
- **Registro manual**: Permite crear compras de productos no registrados
- **Flexibilidad**: Ideal para compras urgentes de productos nuevos
- **Preparación**: Facilita la posterior adición al inventario

### Funcionalidades

```typescript
// Estructura de compra conectada
interface PettyCashPurchase {
  productId?: number;           // Conexión con producto existente
  productName: string;          // Nombre del producto
  description: string;          // Descripción de la compra
  quantity: number;             // Cantidad comprada
  unitPrice: number;            // Precio unitario
  totalAmount: number;          // Total calculado
  supplier?: string;            // Proveedor (auto-completado si existe)
}
```

### Beneficios de la Integración

1. **Consistencia de datos**: Mismo producto, misma información
2. **Trazabilidad**: Seguimiento desde compra hasta venta
3. **Actualización automática**: El stock se actualiza al aprobar compras
4. **Informes unificados**: Reportes que conectan caja chica con inventario

---

## 📁 Integración con Categorías

### Gastos Clasificados

#### Categorías del Sistema
- **Reutilización**: Usa las mismas categorías que productos
- **Consistencia**: Clasificación uniforme en todo el sistema
- **Flexibilidad**: Categorías personalizables por empresa

#### Categorías Sugeridas
El sistema muestra sugerencias para categorías comunes:
- Suministros de Oficina
- Transporte
- Alimentación
- Servicios
- Mantenimiento
- Otros Gastos

### Estructura de Datos

```typescript
// Gasto con categoría del sistema
interface PettyCashExpense {
  categoryId?: number;          // Conexión con categoría del sistema
  category?: string;            // Campo legacy (retrocompatibilidad)
  description: string;          // Descripción del gasto
  amount: number;               // Monto del gasto
  Category?: {                  // Relación con categoría
    id: number;
    name: string;
    description?: string;
  };
}
```

---

## 🔄 Flujo de Trabajo Integrado

### 1. Apertura de Sesión
- Usuario con permisos de cajero abre sesión
- Sistema valida permisos y registra inicio

### 2. Registro de Gastos
- **Selección de categoría**: Del sistema de categorías existente
- **Descripción**: Detalle específico del gasto
- **Monto**: Validación contra límites configurados
- **Aprobación**: Automática o manual según monto

### 3. Registro de Compras
- **Producto existente**: 
  - Filtrar por categoría (opcional)
  - Seleccionar producto del sistema
  - Auto-completado de datos
  - Conexión directa productId
- **Producto nuevo**:
  - Registro manual completo
  - Preparación para adición posterior al inventario

### 4. Cierre de Caja
- **Cálculo automático**: Incluye todas las transacciones
- **Validación**: Verifica integridad de datos
- **Actualización de inventario**: Para compras aprobadas de productos existentes

---

## 📊 Reportes y Trazabilidad

### Gastos por Categoría
```sql
SELECT 
  c.name as categoria,
  COUNT(*) as total_gastos,
  SUM(pce.amount) as total_monto
FROM PettyCashExpense pce
LEFT JOIN Category c ON pce.categoryId = c.id
WHERE pce.status = 'APPROVED'
GROUP BY c.name;
```

### Compras por Producto
```sql
SELECT 
  p.name as producto,
  p.sku,
  c.name as categoria,
  COUNT(*) as veces_comprado,
  SUM(pcp.quantity) as cantidad_total,
  SUM(pcp.totalAmount) as monto_total
FROM PettyCashPurchase pcp
LEFT JOIN Product p ON pcp.productId = p.id
LEFT JOIN Category c ON p.categoryid = c.id
WHERE pcp.status = 'APPROVED'
GROUP BY p.id, p.name, p.sku, c.name;
```

### Trazabilidad Completa
```sql
-- Historial completo de un producto
SELECT 
  'COMPRA_CAJA_CHICA' as tipo,
  pcp.requestedAt as fecha,
  pcp.quantity as cantidad,
  pcp.unitPrice as precio_unitario,
  pcp.totalAmount as total
FROM PettyCashPurchase pcp
WHERE pcp.productId = [PRODUCT_ID]
AND pcp.status = 'APPROVED'

UNION ALL

SELECT 
  'VENTA' as tipo,
  s.date as fecha,
  sp.quantity * -1 as cantidad,
  sp.unitPrice as precio_unitario,
  sp.totalPrice as total
FROM Sale_Product sp
JOIN Sale s ON sp.saleId = s.id
WHERE sp.productId = [PRODUCT_ID]

ORDER BY fecha DESC;
```

---

## 🛠️ Componentes Técnicos

### Selectores Reutilizables

#### ProductSelector
```typescript
// Selector de productos con filtros
<ProductSelector
  value={selectedProduct?.id}
  onChange={handleProductSelect}
  categoryFilter={selectedCategory}
  placeholder="Seleccionar producto existente"
/>
```

#### CategorySelector
```typescript
// Selector de categorías del sistema
<CategorySelector
  value={selectedCategory}
  onChange={setSelectedCategory}
  placeholder="Todas las categorías"
/>
```

#### ExpenseCategorySelector
```typescript
// Selector específico para categorías de gastos
<ExpenseCategorySelector
  value={categoryId}
  onChange={setCategoryId}
  required={true}
  placeholder="Seleccionar categoría para el gasto"
/>
```

### Server Actions Actualizadas

```typescript
// Crear gasto con categoría del sistema
createPettyCashExpense(formData: FormData) {
  const categoryId = formData.get('categoryId');
  // ... lógica de creación
}

// Crear compra con producto del sistema
createPettyCashPurchase(formData: FormData) {
  const productId = formData.get('productId');
  // ... lógica de creación y vinculación
}
```

---

## 🔧 Configuración y Migración

### Cambios en Base de Datos

```prisma
// Modelo actualizado de gastos
model PettyCashExpense {
  // ... campos existentes
  categoryId    Int?               // Nueva conexión
  Category      Category?          // Nueva relación
}

// Modelo actualizado de categorías
model Category {
  // ... campos existentes
  PettyCashExpense PettyCashExpense[] // Nueva relación inversa
}
```

### Migración de Datos Legacy

```sql
-- Los gastos existentes mantienen el campo 'category' legacy
-- Los nuevos gastos usan 'categoryId' para conexión con el sistema
UPDATE PettyCashExpense 
SET categoryId = (
  SELECT id FROM Category 
  WHERE name = 'Otros Gastos'
  LIMIT 1
)
WHERE categoryId IS NULL AND category IS NOT NULL;
```

---

## 📈 Beneficios de la Integración

### Para Usuarios
1. **Interfaz unificada**: Mismo aspecto en todo el sistema
2. **Menos errores**: Auto-completado reduce errores de digitación
3. **Búsqueda rápida**: Filtros por categoría facilitan selección
4. **Información completa**: Precios y proveedores pre-cargados

### Para Administradores
1. **Reportes integrados**: Una sola fuente de verdad
2. **Trazabilidad completa**: Desde compra hasta venta
3. **Control de inventario**: Actualización automática
4. **Análisis profundo**: Correlación entre caja chica e inventario

### Para el Sistema
1. **Consistencia de datos**: Eliminación de duplicados
2. **Integridad referencial**: Relaciones claras y validadas
3. **Escalabilidad**: Preparado para crecimiento
4. **Mantenibilidad**: Código más limpio y organizado

---

## 🚀 Próximas Mejoras

### Funcionalidades Futuras
1. **Aprobación automática**: Para productos recurrentes
2. **Sugerencias inteligentes**: Basadas en historial
3. **Alertas de stock**: Cuando compras de caja chica afecten inventario
4. **Integración con proveedores**: Conexión directa con sistema de compras

### Optimizaciones
1. **Caché de productos**: Para mejorar velocidad de carga
2. **Búsqueda avanzada**: Filtros múltiples y búsqueda por texto
3. **Importación masiva**: Para productos desde archivo
4. **API REST**: Para integraciones externas 