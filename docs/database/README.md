# 📚 Documentación de Base de Datos - Índice Maestro

## 📋 Resumen
Este directorio contiene toda la documentación técnica relacionada con la base de datos del sistema Admintermas. Incluye estructuras de tablas, consultas SQL, migraciones y guías de uso.

---

## 📁 Estructura de Documentación

### 🗂️ Tablas Principales
- **[Product Table](./product-table-complete-fields.md)** - Documentación completa de la tabla Product
- **[Product Queries](./product-queries-reference.md)** - Referencia rápida de consultas SQL para Product

### 🔧 Migraciones y Scripts
- **[Migrations](./../supabase/migrations/)** - Todas las migraciones de Supabase
- **[Scripts SQL](./../scripts/)** - Scripts de mantenimiento y utilidades

### 📊 Consultas y Reportes
- **[SQL Queries](./product-queries-reference.md)** - Consultas SQL útiles
- **[Database Maintenance](./../docs/modules/)** - Guías de mantenimiento

---

## 🎯 Tabla Product - Documentación Principal

### 📝 Estructura Completa
La tabla `Product` es el núcleo del sistema con **35 campos** organizados en categorías:

#### 🔑 Campos de Identificación (4 campos)
- `id` - Clave primaria
- `name` - Nombre del producto
- `sku` - Código SKU único
- `barcode` - Código de barras

#### 💰 Campos de Precios (5 campos)
- `costprice` - Precio de costo
- `saleprice` - Precio de venta neto
- `vat` - Porcentaje de IVA
- `finalPrice` - Precio final congelado
- `final_price_with_vat` - Precio final con IVA

#### 🔗 Campos de Relaciones (3 campos)
- `categoryid` - Referencia a Category
- `supplierid` - Referencia a Supplier
- `defaultCostCenterId` - Referencia a Cost_Center

#### 🎯 Campos de Configuración (5 campos)
- `type` - Tipo de producto (ALMACENABLE, CONSUMIBLE, etc.)
- `isForSale` - ¿Es para venta al público?
- `isActive` - Estado activo/archivado
- `isPOSEnabled` - ¿Aparece en POS?
- `isEquipment` - ¿Es equipo/máquina?

#### 📦 Campos de Unidades (3 campos)
- `unit` - Unidad de medida
- `salesunitid` - ID unidad de venta
- `purchaseunitid` - ID unidad de compra

#### 🔧 Campos de Equipos (12 campos)
- `model` - Modelo del equipo
- `serialNumber` - Número de serie
- `purchaseDate` - Fecha de compra
- `warrantyExpiration` - Vencimiento de garantía
- `usefulLife` - Vida útil en años
- `maintenanceInterval` - Intervalo de mantenimiento
- `lastMaintenance` - Última fecha de mantenimiento
- `nextMaintenance` - Próxima fecha de mantenimiento
- `maintenanceCost` - Costo de mantenimiento
- `maintenanceProvider` - Proveedor de mantenimiento
- `currentLocation` - Ubicación actual
- `responsiblePerson` - Persona responsable
- `operationalStatus` - Estado operacional

#### ⏰ Campos de Auditoría (2 campos)
- `createdAt` - Fecha de creación
- `updatedAt` - Fecha de última actualización

#### 📊 Campos de Métricas (1 campo)
- `servicesSold` - Contador de servicios vendidos

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

## 📊 Consultas Más Utilizadas

### 🔍 Verificación de Estructura
```sql
-- Ver todas las columnas de Product
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'Product'
ORDER BY ordinal_position;
```

### 📈 Estadísticas Básicas
```sql
-- Productos por estado
SELECT 
    CASE WHEN "isActive" THEN 'Activo' ELSE 'Archivado' END as estado,
    COUNT(*) as cantidad
FROM "Product" 
GROUP BY "isActive";
```

### 🎯 Productos Activos para Venta
```sql
-- Productos activos para venta al público
SELECT id, name, type, saleprice 
FROM "Product" 
WHERE "isActive" = true AND "isForSale" = true
ORDER BY name;
```

### 📦 Productos con Stock
```sql
-- Productos con stock en bodegas
SELECT 
    p.id, p.name, p.type,
    SUM(wp.quantity) as stock_total
FROM "Product" p
JOIN "Warehouse_Product" wp ON p.id = wp."productId"
WHERE p."isActive" = true
GROUP BY p.id, p.name, p.type
HAVING SUM(wp.quantity) > 0
ORDER BY stock_total DESC;
```

---

## 🛠️ Operaciones Comunes

### Archivar un Producto
```sql
UPDATE "Product" 
SET "isActive" = false, "updatedAt" = NOW()
WHERE id = [PRODUCT_ID];
```

### Activar un Producto
```sql
UPDATE "Product" 
SET "isActive" = true, "updatedAt" = NOW()
WHERE id = [PRODUCT_ID];
```

### Cambiar Precio de Venta
```sql
UPDATE "Product" 
SET saleprice = [NUEVO_PRECIO], "updatedAt" = NOW()
WHERE id = [PRODUCT_ID];
```

---

## 🔗 Relaciones Importantes

### Claves Foráneas
- `categoryid` → `Category.id`
- `supplierid` → `Supplier.id`
- `defaultCostCenterId` → `Cost_Center.id`

### Tablas Relacionadas
- `Warehouse_Product` - Stock por bodega
- `Sale_Product` - Productos en ventas
- `Reservation_Product` - Productos en reservas
- `Product_Component` - Componentes de combos

---

## 📋 Validaciones Importantes

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

## 📈 Métricas y Reportes

### Resumen Ejecutivo
```sql
SELECT 
    'Total Productos' as metric, COUNT(*) as value FROM "Product"
UNION ALL
SELECT 'Productos Activos', COUNT(*) FROM "Product" WHERE "isActive" = true
UNION ALL
SELECT 'Productos Archivados', COUNT(*) FROM "Product" WHERE "isActive" = false
UNION ALL
SELECT 'Productos para Venta', COUNT(*) FROM "Product" WHERE "isForSale" = true AND "isActive" = true
UNION ALL
SELECT 'Productos en POS', COUNT(*) FROM "Product" WHERE "isPOSEnabled" = true AND "isActive" = true;
```

### Valor Total de Inventario
```sql
SELECT 
    SUM(p.saleprice * COALESCE(wp.quantity, 0)) as valor_total_inventario
FROM "Product" p
LEFT JOIN "Warehouse_Product" wp ON p.id = wp."productId"
WHERE p."isActive" = true;
```

---

## 🔧 Mantenimiento

### Limpiar Datos
```sql
-- Productos sin categoría
SELECT id, name, type FROM "Product" WHERE categoryid IS NULL AND "isActive" = true;

-- Productos sin proveedor
SELECT id, name, type FROM "Product" WHERE supplierid IS NULL AND "isActive" = true;

-- Productos sin SKU
SELECT id, name, type FROM "Product" WHERE sku IS NULL OR sku = '';
```

### Optimizar Performance
```sql
-- Reindexar tabla
REINDEX TABLE "Product";

-- Analizar estadísticas
ANALYZE "Product";
```

---

## 📚 Documentación Relacionada

### 🗂️ Módulos del Sistema
- **[Productos](./../modules/products/)** - Gestión de productos
- **[Inventario](./../modules/inventory/)** - Control de stock
- **[Ventas](./../modules/sales/)** - Sistema de ventas
- **[Compras](./../modules/purchases/)** - Gestión de compras

### 🔧 Herramientas
- **[Supabase CLI](./../supabase/)** - Configuración y migraciones
- **[Scripts SQL](./../scripts/)** - Utilidades de mantenimiento
- **[Troubleshooting](./../troubleshooting/)** - Solución de problemas

---

## 📞 Soporte

### 🔍 Para Problemas Técnicos
1. **Verificar estructura**: Usar consultas de verificación
2. **Revisar logs**: Consultar console.log para debugging
3. **Validar datos**: Ejecutar consultas de validación
4. **Documentación**: Consultar archivos específicos

### 📋 Para Nuevas Funcionalidades
1. **Revisar documentación existente**
2. **Crear migraciones apropiadas**
3. **Actualizar tipos e interfaces**
4. **Documentar cambios**

---

**📅 Última actualización**: 2025-01-15  
**🎯 Versión**: 1.0.0  
**📊 Total de campos Product**: 35 campos  
**📋 Documentos**: 3 archivos principales  
**🔗 Relaciones**: 3 tablas principales relacionadas 