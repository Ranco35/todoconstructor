# Referencia Rápida - Consultas SQL para Tabla Product

## 📋 Consultas de Verificación

### 🔍 Verificar Estructura de la Tabla
```sql
-- Ver todas las columnas de Product
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Product'
ORDER BY ordinal_position;
```

### 📊 Estadísticas Básicas
```sql
-- Conteo total de productos
SELECT COUNT(*) as total_productos FROM "Product";

-- Productos por estado
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

---

## 🎯 Consultas por Estado

### ✅ Productos Activos
```sql
-- Todos los productos activos
SELECT id, name, type, saleprice 
FROM "Product" 
WHERE "isActive" = true
ORDER BY name;

-- Productos activos para venta
SELECT id, name, type, saleprice 
FROM "Product" 
WHERE "isActive" = true AND "isForSale" = true
ORDER BY name;

-- Productos activos para POS
SELECT id, name, type, saleprice 
FROM "Product" 
WHERE "isActive" = true AND "isPOSEnabled" = true
ORDER BY name;
```

### ❌ Productos Archivados
```sql
-- Todos los productos archivados
SELECT id, name, type, "updatedAt" 
FROM "Product" 
WHERE "isActive" = false
ORDER BY "updatedAt" DESC;

-- Productos archivados recientemente
SELECT id, name, type, "updatedAt" 
FROM "Product" 
WHERE "isActive" = false 
  AND "updatedAt" >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY "updatedAt" DESC;
```

---

## 💰 Consultas de Precios

### 📈 Productos con Precios
```sql
-- Productos con precio de venta
SELECT id, name, type, saleprice, vat
FROM "Product" 
WHERE saleprice IS NOT NULL AND saleprice > 0
ORDER BY saleprice DESC;

-- Productos sin precio de venta
SELECT id, name, type
FROM "Product" 
WHERE saleprice IS NULL OR saleprice = 0
ORDER BY name;
```

### 🏷️ Productos por Rango de Precio
```sql
-- Productos económicos (< $10.000)
SELECT id, name, type, saleprice
FROM "Product" 
WHERE saleprice < 10000 AND "isActive" = true
ORDER BY saleprice;

-- Productos premium (> $50.000)
SELECT id, name, type, saleprice
FROM "Product" 
WHERE saleprice > 50000 AND "isActive" = true
ORDER BY saleprice DESC;
```

---

## 🔗 Consultas con Relaciones

### 🏪 Productos por Categoría
```sql
SELECT 
    c.name as categoria,
    COUNT(p.id) as productos,
    AVG(p.saleprice) as precio_promedio
FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
WHERE p."isActive" = true
GROUP BY c.id, c.name
ORDER BY productos DESC;
```

### 🚚 Productos por Proveedor
```sql
SELECT 
    s.name as proveedor,
    COUNT(p.id) as productos,
    SUM(p.saleprice) as valor_total
FROM "Product" p
LEFT JOIN "Supplier" s ON p.supplierid = s.id
WHERE p."isActive" = true
GROUP BY s.id, s.name
ORDER BY productos DESC;
```

### 💼 Productos por Centro de Costo
```sql
SELECT 
    cc.name as centro_costo,
    COUNT(p.id) as productos
FROM "Product" p
LEFT JOIN "Cost_Center" cc ON p."defaultCostCenterId" = cc.id
WHERE p."isActive" = true
GROUP BY cc.id, cc.name
ORDER BY productos DESC;
```

---

## 🔧 Consultas de Equipos

### ⚙️ Equipos con Mantenimiento
```sql
-- Equipos que necesitan mantenimiento pronto
SELECT 
    id, name, "nextMaintenance", "operationalStatus"
FROM "Product" 
WHERE "isEquipment" = true 
  AND "nextMaintenance" <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY "nextMaintenance";

-- Equipos fuera de servicio
SELECT 
    id, name, "operationalStatus", "lastMaintenance"
FROM "Product" 
WHERE "isEquipment" = true 
  AND "operationalStatus" != 'OPERATIVO'
ORDER BY name;
```

### 📅 Equipos por Fecha de Compra
```sql
-- Equipos nuevos (último año)
SELECT 
    id, name, "purchaseDate", "warrantyExpiration"
FROM "Product" 
WHERE "isEquipment" = true 
  AND "purchaseDate" >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY "purchaseDate" DESC;
```

---

## 📦 Consultas de Inventario

### 📊 Productos con Stock
```sql
-- Productos con stock en bodegas
SELECT 
    p.id,
    p.name,
    p.type,
    SUM(wp.quantity) as stock_total
FROM "Product" p
JOIN "Warehouse_Product" wp ON p.id = wp."productId"
WHERE p."isActive" = true
GROUP BY p.id, p.name, p.type
HAVING SUM(wp.quantity) > 0
ORDER BY stock_total DESC;
```

### ⚠️ Productos sin Stock
```sql
-- Productos activos sin stock
SELECT 
    p.id,
    p.name,
    p.type
FROM "Product" p
LEFT JOIN "Warehouse_Product" wp ON p.id = wp."productId"
WHERE p."isActive" = true
  AND (wp.quantity IS NULL OR wp.quantity = 0)
ORDER BY p.name;
```

---

## 🛠️ Consultas de Mantenimiento

### 🧹 Limpiar Datos
```sql
-- Productos sin categoría
SELECT id, name, type 
FROM "Product" 
WHERE categoryid IS NULL AND "isActive" = true;

-- Productos sin proveedor
SELECT id, name, type 
FROM "Product" 
WHERE supplierid IS NULL AND "isActive" = true;

-- Productos sin SKU
SELECT id, name, type 
FROM "Product" 
WHERE sku IS NULL OR sku = '';

-- Productos duplicados por nombre
SELECT name, COUNT(*) as cantidad
FROM "Product" 
GROUP BY name
HAVING COUNT(*) > 1;
```

### 📈 Optimización
```sql
-- Productos más vendidos
SELECT 
    p.name,
    p.type,
    p."servicesSold"
FROM "Product" p
WHERE p."isActive" = true
ORDER BY p."servicesSold" DESC
LIMIT 10;

-- Productos sin movimiento reciente
SELECT 
    p.id,
    p.name,
    p."updatedAt"
FROM "Product" p
WHERE p."isActive" = true
  AND p."updatedAt" < CURRENT_DATE - INTERVAL '6 months'
ORDER BY p."updatedAt";
```

---

## 🎯 Consultas Específicas por Tipo

### 🏪 ALMACENABLE
```sql
-- Productos almacenables con stock
SELECT 
    p.id, p.name, p.saleprice,
    SUM(wp.quantity) as stock_total
FROM "Product" p
JOIN "Warehouse_Product" wp ON p.id = wp."productId"
WHERE p.type = 'ALMACENABLE' AND p."isActive" = true
GROUP BY p.id, p.name, p.saleprice
ORDER BY stock_total DESC;
```

### 🔧 INVENTARIO
```sql
-- Equipos de inventario
SELECT 
    id, name, "operationalStatus", "nextMaintenance"
FROM "Product" 
WHERE type = 'INVENTARIO' AND "isActive" = true
ORDER BY name;
```

### 🛍️ SERVICIO
```sql
-- Servicios disponibles
SELECT 
    id, name, saleprice, "servicesSold"
FROM "Product" 
WHERE type = 'SERVICIO' AND "isActive" = true
ORDER BY "servicesSold" DESC;
```

---

## 📊 Consultas de Reportes

### 📈 Resumen Ejecutivo
```sql
SELECT 
    'Total Productos' as metric,
    COUNT(*) as value
FROM "Product"
UNION ALL
SELECT 
    'Productos Activos',
    COUNT(*) 
FROM "Product" 
WHERE "isActive" = true
UNION ALL
SELECT 
    'Productos Archivados',
    COUNT(*) 
FROM "Product" 
WHERE "isActive" = false
UNION ALL
SELECT 
    'Productos para Venta',
    COUNT(*) 
FROM "Product" 
WHERE "isForSale" = true AND "isActive" = true
UNION ALL
SELECT 
    'Productos en POS',
    COUNT(*) 
FROM "Product" 
WHERE "isPOSEnabled" = true AND "isActive" = true;
```

### 💰 Valor Total de Inventario
```sql
SELECT 
    SUM(p.saleprice * COALESCE(wp.quantity, 0)) as valor_total_inventario
FROM "Product" p
LEFT JOIN "Warehouse_Product" wp ON p.id = wp."productId"
WHERE p."isActive" = true;
```

---

## 🔄 Operaciones de Actualización

### 📝 Archivar Productos
```sql
-- Archivar producto específico
UPDATE "Product" 
SET "isActive" = false, "updatedAt" = NOW()
WHERE id = [PRODUCT_ID];

-- Archivar productos sin stock
UPDATE "Product" 
SET "isActive" = false, "updatedAt" = NOW()
WHERE id IN (
    SELECT p.id
    FROM "Product" p
    LEFT JOIN "Warehouse_Product" wp ON p.id = wp."productId"
    WHERE p."isActive" = true
      AND (wp.quantity IS NULL OR wp.quantity = 0)
);
```

### 🔄 Activar Productos
```sql
-- Activar producto específico
UPDATE "Product" 
SET "isActive" = true, "updatedAt" = NOW()
WHERE id = [PRODUCT_ID];

-- Activar productos archivados recientemente
UPDATE "Product" 
SET "isActive" = true, "updatedAt" = NOW()
WHERE "isActive" = false 
  AND "updatedAt" >= CURRENT_DATE - INTERVAL '7 days';
```

---

## 📋 Consultas de Validación

### ✅ Validar Integridad
```sql
-- Productos sin nombre
SELECT id FROM "Product" WHERE name IS NULL OR name = '';

-- Productos sin tipo
SELECT id, name FROM "Product" WHERE type IS NULL;

-- Productos con precios negativos
SELECT id, name, saleprice FROM "Product" WHERE saleprice < 0;

-- Productos con IVA inválido
SELECT id, name, vat FROM "Product" WHERE vat < 0 OR vat > 100;
```

---

**📅 Última actualización**: 2025-01-15  
**🎯 Total de consultas**: 25+ consultas útiles  
**📊 Categorías**: Verificación, Estado, Precios, Relaciones, Equipos, Inventario, Mantenimiento 