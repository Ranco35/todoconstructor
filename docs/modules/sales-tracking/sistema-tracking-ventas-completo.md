# Sistema de Tracking de Ventas - Documentación Completa

## 📋 Resumen Ejecutivo

Se ha implementado exitosamente un **sistema completo de tracking de ventas** que permite diferenciar y analizar ventas individuales vs ventas por paquetes. El sistema mejora la tabla existente `product_sales_tracking` y añade vistas automatizadas, funciones optimizadas y políticas de seguridad.

### 🎯 Objetivos Logrados
- ✅ **Diferenciación clara** entre ventas individuales (`direct`) y ventas por paquetes (`package`)
- ✅ **Reportes automatizados** con vistas SQL optimizadas
- ✅ **Análisis por período** con funciones especializadas
- ✅ **Seguridad por roles** con políticas RLS
- ✅ **Storage configurado** para imágenes de productos y clientes

---

## 🗄️ Estructura de Base de Datos

### Tabla Principal: `product_sales_tracking`

La tabla existente fue mejorada con nuevos campos:

```sql
-- Estructura completa de la tabla
CREATE TABLE product_sales_tracking (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sale_type VARCHAR(20) NOT NULL CHECK (sale_type IN ('direct', 'package')),
    package_id BIGINT REFERENCES packages_modular(id) ON DELETE SET NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    customer_info JSONB,
    reservation_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Campos agregados por el sistema mejorado:
    user_id UUID REFERENCES "User"(id) ON DELETE SET NULL,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Campos Clave

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sale_type` | VARCHAR(20) | `'direct'` = venta individual, `'package'` = venta por paquete |
| `product_id` | BIGINT | Referencia al producto vendido |
| `package_id` | BIGINT | ID del paquete si es venta tipo package |
| `user_id` | UUID | Usuario que registró la venta |
| `reservation_id` | BIGINT | Reserva asociada a la venta |
| `customer_info` | JSONB | Información adicional del cliente |

### Índices Optimizados

```sql
-- Índices para consultas rápidas
CREATE INDEX idx_product_sales_user_id ON product_sales_tracking(user_id);
CREATE INDEX idx_product_sales_reservation_id ON product_sales_tracking(reservation_id);
CREATE INDEX idx_product_sales_composite_extended ON product_sales_tracking(sale_type, sale_date, product_id);
```

---

## 📊 Vistas Automatizadas

### 1. `enhanced_sales_by_type`
**Propósito:** Estadísticas generales por tipo de venta

```sql
SELECT * FROM enhanced_sales_by_type;
```

**Campos disponibles:**
- `sale_type`: Tipo de venta (direct/package)
- `total_sales`: Número total de ventas
- `total_quantity`: Cantidad total vendida
- `total_revenue`: Revenue total
- `avg_sale_amount`: Promedio por venta
- `percentage_of_total`: Porcentaje del total
- `first_sale` / `last_sale`: Fechas de primera y última venta

### 2. `enhanced_top_products_by_sales`
**Propósito:** Productos más vendidos ordenados por revenue

```sql
SELECT * FROM enhanced_top_products_by_sales LIMIT 10;
```

**Campos disponibles:**
- `product_id`, `product_name`, `product_sku`
- `category_name`: Categoría del producto
- `total_sales`: Número de ventas
- `total_quantity_sold`: Cantidad total vendida
- `total_revenue`: Revenue generado
- `sale_types`: Tipos de venta (direct, package, o ambos)

### 3. `enhanced_sales_by_category`
**Propósito:** Análisis de rendimiento por categoría

```sql
SELECT * FROM enhanced_sales_by_category;
```

**Campos disponibles:**
- `category_id`, `category_name`
- `total_sales`: Ventas totales de la categoría
- `total_revenue`: Revenue de la categoría
- `unique_products_sold`: Productos únicos vendidos
- `avg_sale_amount`: Promedio por venta

### 4. `enhanced_package_analysis`
**Propósito:** Análisis temporal de paquetes vs directas

```sql
SELECT * FROM enhanced_package_analysis 
WHERE month >= '2024-01-01'::date;
```

**Campos disponibles:**
- `month`: Mes agrupado
- `sale_type`: Tipo de venta
- `sales_count`: Número de ventas
- `revenue`: Revenue del mes
- `unique_products`: Productos únicos vendidos

---

## ⚙️ Funciones Especializadas

### 1. `get_enhanced_sales_stats_for_period(start_date, end_date)`
**Propósito:** Estadísticas completas de un período

```sql
-- Ejemplo: Estadísticas de enero 2024
SELECT * FROM get_enhanced_sales_stats_for_period('2024-01-01', '2024-01-31');
```

**Parámetros:**
- `start_date` (DATE): Fecha de inicio
- `end_date` (DATE): Fecha de fin

**Retorna:**
- `total_sales`, `total_revenue`: Totales generales
- `direct_sales`, `package_sales`: Ventas por tipo
- `direct_revenue`, `package_revenue`: Revenue por tipo
- `avg_direct_sale`, `avg_package_sale`: Promedios por tipo
- `top_category`, `top_product`: Mejores performers
- `unique_products`, `unique_categories`: Diversidad

### 2. `get_enhanced_top_products_for_period(start_date, end_date, limit_count)`
**Propósito:** Top productos en período específico

```sql
-- Top 5 productos del último mes
SELECT * FROM get_enhanced_top_products_for_period(
    '2024-12-01', 
    '2024-12-31', 
    5
);
```

**Parámetros:**
- `start_date` (DATE): Fecha de inicio
- `end_date` (DATE): Fecha de fin
- `limit_count` (INTEGER): Número de productos a retornar (default: 10)

### 3. `register_enhanced_product_sale(...)`
**Propósito:** Registrar nueva venta con validaciones

```sql
-- Registrar venta directa
SELECT register_enhanced_product_sale(
    123,                    -- product_id
    'direct',               -- sale_type
    NULL,                   -- package_id (null para directas)
    2,                      -- quantity
    15000.00,              -- unit_price (opcional, usa precio del producto si es NULL)
    '{"cliente": "Juan"}',  -- customer_info (JSONB opcional)
    456,                    -- reservation_id (opcional)
    NULL,                   -- user_id (usa auth.uid() si es NULL)
    'Venta de prueba'       -- notes (opcional)
);
```

**Parámetros:**
- `p_product_id` (BIGINT): ID del producto **[REQUERIDO]**
- `p_sale_type` (VARCHAR): 'direct' o 'package' **[REQUERIDO]**
- `p_package_id` (BIGINT): ID del paquete (solo para type='package')
- `p_quantity` (DECIMAL): Cantidad vendida (default: 1)
- `p_unit_price` (DECIMAL): Precio unitario (usa precio del producto si es NULL)
- `p_customer_info` (JSONB): Información adicional del cliente
- `p_reservation_id` (BIGINT): ID de reserva asociada
- `p_user_id` (UUID): Usuario que registra (usa usuario actual si es NULL)
- `p_notes` (TEXT): Notas adicionales

**Retorna:** ID de la venta creada

---

## 🔒 Políticas de Seguridad (RLS)

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **ADMINISTRADOR** | Acceso completo: crear, leer, actualizar, eliminar todas las ventas |
| **JEFE_SECCION** | Leer todas las ventas, crear nuevas ventas |
| **USUARIO_FINAL** | Solo leer sus propias ventas |

### Políticas Implementadas

```sql
-- Administradores: acceso completo
"Administradores pueden gestionar todas las ventas"

-- Jefes de sección: lectura general + creación
"Jefes de sección pueden ver ventas mejorada"
"Jefes de sección pueden crear ventas mejorada"

-- Usuarios: solo sus propias ventas
"Usuarios pueden ver sus propias ventas mejorada"
```

---

## 🗂️ Storage Buckets

### Buckets Configurados

| Bucket | Propósito | Límite | Tipos Permitidos |
|--------|-----------|--------|------------------|
| `client-images` | Imágenes de clientes | 5MB | jpg, jpeg, png, gif, webp |
| `product-images` | Imágenes de productos | 5MB | jpg, jpeg, png, gif, webp |

### Políticas de Storage

- **Lectura:** Pública para todos los buckets
- **Escritura:** Solo usuarios autenticados
- **Actualización/Eliminación:** Solo usuarios autenticados

---

## 💻 Guía de Integración Frontend

### 1. Obtener Estadísticas Generales

```typescript
// actions/sales/analytics.ts
export async function getSalesOverview() {
  const { data, error } = await supabase
    .from('enhanced_sales_by_type')
    .select('*');
    
  if (error) throw error;
  return data;
}
```

### 2. Top Productos

```typescript
export async function getTopProducts(limit = 10) {
  const { data, error } = await supabase
    .from('enhanced_top_products_by_sales')
    .select('*')
    .limit(limit);
    
  if (error) throw error;
  return data;
}
```

### 3. Análisis por Período

```typescript
export async function getSalesStats(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .rpc('get_enhanced_sales_stats_for_period', {
      start_date: startDate,
      end_date: endDate
    });
    
  if (error) throw error;
  return data;
}
```

### 4. Registrar Nueva Venta

```typescript
export async function registerSale(saleData: {
  productId: number;
  saleType: 'direct' | 'package';
  quantity: number;
  unitPrice?: number;
  packageId?: number;
  reservationId?: number;
  customerInfo?: any;
  notes?: string;
}) {
  const { data, error } = await supabase
    .rpc('register_enhanced_product_sale', {
      p_product_id: saleData.productId,
      p_sale_type: saleData.saleType,
      p_quantity: saleData.quantity,
      p_unit_price: saleData.unitPrice,
      p_package_id: saleData.packageId,
      p_reservation_id: saleData.reservationId,
      p_customer_info: saleData.customerInfo,
      p_notes: saleData.notes
    });
    
  if (error) throw error;
  return data;
}
```

---

## 🎯 Casos de Uso Prácticos

### Caso 1: Dashboard de Ventas

```sql
-- Resumen del día actual
SELECT * FROM get_enhanced_sales_stats_for_period(
    CURRENT_DATE, 
    CURRENT_DATE
);

-- Top 5 productos del mes
SELECT * FROM get_enhanced_top_products_for_period(
    DATE_TRUNC('month', CURRENT_DATE)::date,
    CURRENT_DATE,
    5
);
```

### Caso 2: Reporte Mensual

```sql
-- Análisis del mes anterior
WITH last_month AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date AS start_date,
        (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::date AS end_date
)
SELECT * FROM get_enhanced_sales_stats_for_period(
    (SELECT start_date FROM last_month),
    (SELECT end_date FROM last_month)
);
```

### Caso 3: Comparación de Tipos de Venta

```sql
-- Ver rendimiento por tipo
SELECT 
    sale_type,
    total_revenue,
    total_sales,
    avg_sale_amount,
    percentage_of_total
FROM enhanced_sales_by_type
ORDER BY total_revenue DESC;
```

### Caso 4: Análisis de Categorías

```sql
-- Categorías más rentables
SELECT 
    category_name,
    total_revenue,
    unique_products_sold,
    avg_sale_amount
FROM enhanced_sales_by_category
ORDER BY total_revenue DESC
LIMIT 5;
```

---

## 🔧 Ejemplos de Registro de Ventas

### Venta Individual (Directa)

```sql
-- Cliente compra 2 entradas a piscina termal
SELECT register_enhanced_product_sale(
    45,                             -- ID producto "Piscina Termal Adulto"
    'direct',                       -- Venta directa
    NULL,                          -- Sin paquete
    2,                             -- 2 entradas
    12000.00,                      -- $12,000 c/u
    '{"cliente": "María González", "telefono": "+56912345678"}',
    NULL,                          -- Sin reserva previa
    NULL,                          -- Usuario actual
    'Venta directa en recepción'
);
```

### Venta por Paquete

```sql
-- Cliente compra paquete spa completo
SELECT register_enhanced_product_sale(
    67,                             -- ID producto incluido en el paquete
    'package',                      -- Venta por paquete
    15,                            -- ID del paquete "Spa Relax"
    1,                             -- 1 paquete
    85000.00,                      -- Precio total del paquete
    '{"cliente": "Carlos López", "duracion": "día completo"}',
    234,                           -- Reserva ID 234
    NULL,                          -- Usuario actual
    'Paquete spa con almuerzo incluido'
);
```

---

## 📈 Métricas y KPIs Disponibles

### KPIs Principales

1. **Revenue Total:** `SUM(total_amount)`
2. **Ventas Totales:** `COUNT(*)`
3. **Ticket Promedio:** `AVG(total_amount)`
4. **Mix de Ventas:** Porcentaje direct vs package
5. **Productos Top:** Por revenue y por cantidad
6. **Categorías Top:** Por performance
7. **Tendencia Temporal:** Ventas por mes/semana/día

### Consultas para Dashboards

```sql
-- KPIs del día actual
SELECT 
    COUNT(*) as ventas_hoy,
    SUM(total_amount) as revenue_hoy,
    AVG(total_amount) as ticket_promedio,
    COUNT(DISTINCT product_id) as productos_vendidos
FROM product_sales_tracking 
WHERE sale_date = CURRENT_DATE;

-- Comparación mes actual vs anterior
WITH current_month AS (
    SELECT SUM(total_amount) as revenue
    FROM product_sales_tracking 
    WHERE sale_date >= DATE_TRUNC('month', CURRENT_DATE)
),
previous_month AS (
    SELECT SUM(total_amount) as revenue
    FROM product_sales_tracking 
    WHERE sale_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND sale_date < DATE_TRUNC('month', CURRENT_DATE)
)
SELECT 
    c.revenue as revenue_actual,
    p.revenue as revenue_anterior,
    ROUND(((c.revenue - p.revenue) / p.revenue * 100), 2) as crecimiento_porcentaje
FROM current_month c, previous_month p;
```

---

## 🛠️ Troubleshooting

### Problemas Comunes

#### 1. Error: "relation does not exist"
**Causa:** La vista o función no existe
**Solución:** Verificar que el SQL de migración se ejecutó correctamente

```sql
-- Verificar vistas existentes
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'enhanced_%';
```

#### 2. Error: "permission denied"
**Causa:** Políticas RLS bloqueando acceso
**Solución:** Verificar rol del usuario

```sql
-- Verificar rol del usuario actual
SELECT u.name, r."roleName" 
FROM "User" u 
JOIN "Role" r ON u."roleId" = r.id 
WHERE u.id = auth.uid();
```

#### 3. Datos vacíos en vistas
**Causa:** No hay ventas registradas
**Solución:** Registrar ventas de prueba

```sql
-- Registrar venta de prueba
SELECT register_enhanced_product_sale(
    (SELECT id FROM "Product" LIMIT 1),  -- Primer producto disponible
    'direct',
    NULL,
    1,
    10000.00,
    '{"test": true}',
    NULL,
    NULL,
    'Venta de prueba para testing'
);
```

### Verificaciones de Sistema

```sql
-- 1. Verificar estructura de tabla
\d product_sales_tracking

-- 2. Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'product_sales_tracking';

-- 3. Verificar políticas RLS
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'product_sales_tracking';

-- 4. Verificar storage buckets
SELECT * FROM storage.buckets 
WHERE name IN ('client-images', 'product-images');
```

---

## 🚀 Próximos Pasos

### Mejoras Sugeridas

1. **Dashboard Interactivo:** Crear componentes React para visualizar las métricas
2. **Alertas Automáticas:** Configurar notificaciones para ventas importantes
3. **Exportación:** Añadir funciones para exportar reportes a Excel/PDF
4. **Análisis Predictivo:** Implementar forecasting básico
5. **Integración Odoo:** Sincronizar ventas con sistema ERP

### Componentes Frontend Pendientes

1. **SalesOverviewDashboard.tsx:** Dashboard principal con KPIs
2. **TopProductsChart.tsx:** Gráfico de productos más vendidos
3. **SalesTypeComparison.tsx:** Comparación direct vs package
4. **SalesRegistrationForm.tsx:** Formulario para registrar ventas
5. **SalesReportsExporter.tsx:** Exportador de reportes

---

## 📝 Changelog

### v1.0.0 (2025-01-14)
- ✅ Sistema base implementado
- ✅ 4 vistas automatizadas creadas
- ✅ 3 funciones especializadas implementadas
- ✅ Políticas RLS por roles configuradas
- ✅ Storage buckets configurados
- ✅ Documentación completa

---

## 👥 Contacto y Soporte

Para dudas o mejoras del sistema:
1. Verificar troubleshooting en esta documentación
2. Revisar logs en Supabase Dashboard
3. Consultar con el equipo de desarrollo

**Última actualización:** 14 de enero de 2025
**Versión del sistema:** 1.0.0 