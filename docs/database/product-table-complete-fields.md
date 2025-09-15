# Tabla Product - Documentación Completa de Campos

## 📋 Resumen
La tabla `Product` es el núcleo del sistema de inventario y gestión de productos. Contiene todos los campos necesarios para gestionar productos de diferentes tipos (Almacenable, Consumible, Servicio, Inventario, Combo).

---

## 🏗️ Estructura Completa de la Tabla

### 📊 Información Básica
- **Nombre**: `Product`
- **Esquema**: `public`
- **Tipo**: Tabla principal de productos
- **Registros**: ~400+ productos actuales

---

## 📝 Campos de la Tabla Product

### 🔑 Campos de Identificación

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | `bigserial` | ❌ NO | `auto_increment` | **Clave primaria** - ID único del producto |
| `name` | `text` | ❌ NO | - | **Nombre del producto** - Obligatorio |
| `sku` | `text` | ✅ SÍ | - | **Código SKU** - Código único del producto |
| `barcode` | `text` | ✅ SÍ | - | **Código de barras** - Para escáneres |

### 📄 Información Descriptiva

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `description` | `text` | ✅ SÍ | - | **Descripción detallada** del producto |
| `brand` | `text` | ✅ SÍ | - | **Marca** del producto |
| `image` | `text` | ✅ SÍ | - | **URL de imagen** del producto |

### 💰 Información de Precios

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `costprice` | `numeric(10,2)` | ✅ SÍ | - | **Precio de costo** - Precio de compra al proveedor |
| `saleprice` | `numeric(10,2)` | ✅ SÍ | - | **Precio de venta neto** - Sin IVA |
| `vat` | `numeric(5,2)` | ✅ SÍ | - | **Porcentaje de IVA** - Ej: 19.00 |
| `finalPrice` | `numeric(10,2)` | ✅ SÍ | - | **Precio final congelado** - Con IVA incluido |
| `final_price_with_vat` | `numeric(12,2)` | ✅ SÍ | - | **Precio final con IVA** - Calculado automáticamente |

### 🔗 Relaciones y Referencias

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `categoryid` | `bigint` | ✅ SÍ | - | **ID de categoría** - Referencia a tabla `Category` |
| `supplierid` | `bigint` | ✅ SÍ | - | **ID de proveedor** - Referencia a tabla `Supplier` |
| `defaultCostCenterId` | `bigint` | ✅ SÍ | - | **ID de centro de costo** - Referencia a tabla `Cost_Center` |

### 🏷️ Información de Proveedor

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `supplierCode` | `text` | ✅ SÍ | - | **Código del proveedor** - Código interno del proveedor |

### 📦 Información de Unidades

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `unit` | `text` | ✅ SÍ | `'Pieza'` | **Unidad de medida** - Ej: Pieza, Kg, Litro |
| `salesunitid` | `integer` | ❌ NO | `1` | **ID unidad de venta** - Referencia a tabla de unidades |
| `purchaseunitid` | `integer` | ❌ NO | `1` | **ID unidad de compra** - Referencia a tabla de unidades |

### 🎯 Configuración de Producto

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `type` | `character varying(20)` | ❌ NO | `'ALMACENABLE'` | **Tipo de producto** - ALMACENABLE, CONSUMIBLE, SERVICIO, INVENTARIO, COMBO |
| `isForSale` | `boolean` | ❌ NO | `true` | **¿Es para venta?** - TRUE = venta al público, FALSE = consumo interno |
| `isActive` | `boolean` | ❌ NO | `true` | **Estado activo** - TRUE = activo, FALSE = archivado |
| `isPOSEnabled` | `boolean` | ✅ SÍ | `false` | **Habilitado en POS** - TRUE = aparece en punto de venta |
| `isEquipment` | `boolean` | ✅ SÍ | `false` | **¿Es equipo?** - TRUE = equipos/máquinas |

### 📊 Métricas y Contadores

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `servicesSold` | `integer` | ✅ SÍ | `0` | **Servicios vendidos** - Contador de servicios prestados |

### 🔧 Información de Equipos (para `isEquipment = true`)

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `model` | `text` | ✅ SÍ | - | **Modelo del equipo** |
| `serialNumber` | `text` | ✅ SÍ | - | **Número de serie** |
| `purchaseDate` | `date` | ✅ SÍ | - | **Fecha de compra** |
| `warrantyExpiration` | `date` | ✅ SÍ | - | **Fecha de vencimiento de garantía** |
| `usefulLife` | `integer` | ✅ SÍ | - | **Vida útil en años** |
| `maintenanceInterval` | `integer` | ✅ SÍ | - | **Intervalo de mantenimiento en días** |
| `lastMaintenance` | `date` | ✅ SÍ | - | **Última fecha de mantenimiento** |
| `nextMaintenance` | `date` | ✅ SÍ | - | **Próxima fecha de mantenimiento** |
| `maintenanceCost` | `numeric` | ✅ SÍ | - | **Costo de mantenimiento** |
| `maintenanceProvider` | `text` | ✅ SÍ | - | **Proveedor de mantenimiento** |
| `currentLocation` | `text` | ✅ SÍ | - | **Ubicación actual** |
| `responsiblePerson` | `text` | ✅ SÍ | - | **Persona responsable** |
| `operationalStatus` | `text` | ✅ SÍ | `'OPERATIVO'` | **Estado operacional** - OPERATIVO, MANTENIMIENTO, FUERA_SERVICIO |

### ⏰ Campos de Auditoría

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `createdAt` | `timestamp with time zone` | ✅ SÍ | `now()` | **Fecha de creación** |
| `updatedAt` | `timestamp with time zone` | ✅ SÍ | `now()` | **Fecha de última actualización** |

---

## 🔗 Relaciones y Constraints

### Claves Foráneas
```sql
-- Relación con categorías
CONSTRAINT Product_categoryid_fkey 
FOREIGN KEY (categoryid) REFERENCES "Category" (id)

-- Relación con proveedores  
CONSTRAINT Product_supplierid_fkey 
FOREIGN KEY (supplierid) REFERENCES "Supplier" (id)

-- Relación con centros de costo
CONSTRAINT Product_defaultCostCenterId_fkey 
FOREIGN KEY ("defaultCostCenterId") REFERENCES "Cost_Center" (id)
```

### Índices Optimizados
```sql
-- Índices para performance
CREATE INDEX idx_product_category ON "Product" (categoryid)
CREATE INDEX idx_product_supplier ON "Product" (supplierid)
CREATE INDEX idx_product_cost_center ON "Product" ("defaultCostCenterId")
CREATE INDEX idx_product_type ON "Product" (type)
CREATE INDEX idx_product_is_equipment ON "Product" ("isEquipment")
CREATE INDEX idx_product_pos_enabled ON "Product" ("isPOSEnabled")
CREATE INDEX idx_product_is_for_sale ON "Product" ("isForSale")
CREATE INDEX idx_product_services_sold ON "Product" ("servicesSold")
CREATE INDEX idx_product_unit ON "Product" (unit)
CREATE INDEX idx_product_sales_unit ON "Product" (salesunitid)
CREATE INDEX idx_product_purchase_unit ON "Product" (purchaseunitid)
```

---

## 🎯 Tipos de Producto Soportados

### 1. **ALMACENABLE** (Default)
- Productos que se almacenan en bodegas
- Tienen stock y movimiento de inventario
- Ejemplos: Cloro, Antigrasa, Bolsas

### 2. **CONSUMIBLE**
- Productos que se consumen rápidamente
- Pueden tener stock pero se agotan rápido
- Ejemplos: Productos de limpieza, alimentos

### 3. **SERVICIO**
- Servicios prestados, no productos físicos
- No tienen stock físico
- Ejemplos: Masajes, tratamientos spa

### 4. **INVENTARIO**
- Equipos y máquinas
- Tienen información de mantenimiento
- Ejemplos: Salero, equipos de cocina

### 5. **COMBO**
- Productos compuestos por otros productos
- Tienen componentes asociados
- Ejemplos: Paquetes turísticos, combos de servicios

---

## 🔄 Estados del Producto

### Estado Activo (`isActive`)
- **TRUE**: Producto disponible para ventas, reservas, POS
- **FALSE**: Producto archivado, no aparece en ventas

### Estado de Venta (`isForSale`)
- **TRUE**: Producto para venta al público
- **FALSE**: Producto para consumo interno/materia prima

### Estado POS (`isPOSEnabled`)
- **TRUE**: Aparece en punto de venta
- **FALSE**: No aparece en POS

---

## 📊 Consultas Útiles

### Verificar Productos por Estado
```sql
-- Productos activos vs archivados
SELECT 
  CASE WHEN "isActive" THEN 'Activo' ELSE 'Archivado' END as estado,
  COUNT(*) as cantidad
FROM "Product" 
GROUP BY "isActive";

-- Productos por tipo
SELECT 
  type,
  COUNT(*) as cantidad
FROM "Product" 
GROUP BY type
ORDER BY cantidad DESC;
```

### Productos para Diferentes Usos
```sql
-- Productos para venta al público
SELECT name, type, saleprice 
FROM "Product" 
WHERE "isForSale" = true AND "isActive" = true;

-- Productos para POS
SELECT name, type, saleprice 
FROM "Product" 
WHERE "isPOSEnabled" = true AND "isActive" = true;

-- Equipos con mantenimiento próximo
SELECT name, "nextMaintenance", "operationalStatus"
FROM "Product" 
WHERE "isEquipment" = true 
  AND "nextMaintenance" <= CURRENT_DATE + INTERVAL '30 days';
```

---

## 🛠️ Operaciones Comunes

### Archivar un Producto
```sql
UPDATE "Product" 
SET "isActive" = false 
WHERE id = [PRODUCT_ID];
```

### Activar un Producto Archivado
```sql
UPDATE "Product" 
SET "isActive" = true 
WHERE id = [PRODUCT_ID];
```

### Cambiar Precio de Venta
```sql
UPDATE "Product" 
SET saleprice = [NUEVO_PRECIO] 
WHERE id = [PRODUCT_ID];
```

### Actualizar Stock (vía Warehouse_Product)
```sql
UPDATE "Warehouse_Product" 
SET quantity = [NUEVA_CANTIDAD] 
WHERE "productId" = [PRODUCT_ID] 
  AND "warehouseId" = [BODEGA_ID];
```

---

## 📈 Métricas y Reportes

### Productos Más Vendidos
```sql
SELECT 
  p.name,
  p.type,
  p."servicesSold"
FROM "Product" p
WHERE p."isActive" = true
ORDER BY p."servicesSold" DESC
LIMIT 10;
```

### Productos por Proveedor
```sql
SELECT 
  s.name as proveedor,
  COUNT(p.id) as productos
FROM "Product" p
JOIN "Supplier" s ON p.supplierid = s.id
WHERE p."isActive" = true
GROUP BY s.id, s.name
ORDER BY productos DESC;
```

---

## ✅ Validaciones Importantes

### Campos Obligatorios
- `name` - Nombre del producto
- `type` - Tipo de producto
- `isForSale` - Si es para venta
- `isActive` - Estado activo
- `salesunitid` - Unidad de venta
- `purchaseunitid` - Unidad de compra

### Validaciones de Negocio
- Productos para venta (`isForSale = true`) deben tener `saleprice`
- Equipos (`isEquipment = true`) deben tener información de mantenimiento
- Productos archivados (`isActive = false`) no aparecen en ventas

---

## 🔧 Mantenimiento

### Limpiar Productos Huérfanos
```sql
-- Productos sin categoría
SELECT id, name FROM "Product" 
WHERE categoryid IS NULL AND "isActive" = true;

-- Productos sin proveedor
SELECT id, name FROM "Product" 
WHERE supplierid IS NULL AND "isActive" = true;
```

### Optimizar Índices
```sql
-- Reindexar tabla
REINDEX TABLE "Product";

-- Analizar estadísticas
ANALYZE "Product";
```

---

**Última actualización**: 2025-01-15  
**Versión**: 1.0.0  
**Total de campos**: 35 campos  
**Campos obligatorios**: 6 campos 