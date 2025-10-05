# Estructura de Base de Datos - Sistema de Gestión de Precios

## Descripción
Estructura completa de la base de datos para el sistema de gestión de precios, incluyendo tablas, triggers, funciones y migraciones.

## Tablas Principales

### 1. CategoryProfitConfig
Configuración de márgenes de utilidad por categoría de productos.

```sql
CREATE TABLE "CategoryProfitConfig" (
  "id" BIGSERIAL PRIMARY KEY,
  "categoryId" BIGINT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
  "defaultProfitMargin" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  "minProfitMargin" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  "maxProfitMargin" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  "roundingRule" VARCHAR(20) DEFAULT 'hundreds' CHECK (roundingRule IN ('none', 'tens', 'hundreds', 'thousands')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" BIGINT REFERENCES "User"("id"),
  "updatedBy" BIGINT REFERENCES "User"("id")
);
```

**Campos:**
- `id`: Identificador único
- `categoryId`: Referencia a la categoría
- `defaultProfitMargin`: Margen por defecto (30%)
- `minProfitMargin`: Margen mínimo (10%)
- `maxProfitMargin`: Margen máximo (100%)
- `roundingRule`: Regla de redondeo ('none', 'tens', 'hundreds', 'thousands')
- `isActive`: Estado activo/inactivo
- `createdAt/updatedAt`: Timestamps de auditoría
- `createdBy/updatedBy`: Usuarios que realizaron cambios

### 2. ProductProfitConfig
Configuración específica de márgenes por producto (sobrescribe configuración de categoría).

```sql
CREATE TABLE "ProductProfitConfig" (
  "id" BIGSERIAL PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "profitMargin" DECIMAL(5,2) NOT NULL,
  "roundingRule" VARCHAR(20) DEFAULT 'hundreds' CHECK (roundingRule IN ('none', 'tens', 'hundreds', 'thousands')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" BIGINT REFERENCES "User"("id"),
  "updatedBy" BIGINT REFERENCES "User"("id"),
  UNIQUE("productId")
);
```

**Campos:**
- `id`: Identificador único
- `productId`: Referencia al producto
- `profitMargin`: Margen específico para este producto
- `roundingRule`: Regla de redondeo específica
- `isActive`: Estado activo/inactivo
- `createdAt/updatedAt`: Timestamps de auditoría
- `createdBy/updatedBy`: Usuarios que realizaron cambios

### 3. PriceHistory
Historial completo de cambios de precios para auditoría.

```sql
CREATE TABLE "PriceHistory" (
  "id" BIGSERIAL PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "oldCostPrice" DECIMAL(10,2),
  "newCostPrice" DECIMAL(10,2),
  "oldSalePrice" DECIMAL(10,2),
  "newSalePrice" DECIMAL(10,2),
  "oldFinalPrice" DECIMAL(12,2),
  "newFinalPrice" DECIMAL(12,2),
  "changeReason" VARCHAR(50) NOT NULL,
  "oldProfitMargin" DECIMAL(5,2),
  "newProfitMargin" DECIMAL(5,2),
  "changedBy" BIGINT REFERENCES "User"("id"),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos:**
- `id`: Identificador único
- `productId`: Referencia al producto
- `oldCostPrice/newCostPrice`: Precios de costo antes y después
- `oldSalePrice/newSalePrice`: Precios de venta antes y después
- `oldFinalPrice/newFinalPrice`: Precios finales antes y después
- `changeReason`: Razón del cambio ('margin_adjustment', 'cost_update', etc.)
- `oldProfitMargin/newProfitMargin`: Márgenes antes y después
- `changedBy`: Usuario que realizó el cambio
- `createdAt`: Timestamp del cambio

### 4. PricePromotions
Promociones temporales de precios.

```sql
CREATE TABLE "PricePromotions" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "promotionType" VARCHAR(50) NOT NULL CHECK (promotionType IN ('discount_percentage', 'discount_fixed', 'markup_percentage', 'markup_fixed', 'special_price')),
  "value" DECIMAL(10,2) NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "applicableTo" VARCHAR(50) NOT NULL CHECK (applicableTo IN ('all_products', 'category', 'product', 'supplier')),
  "applicableId" BIGINT,
  "priority" INTEGER DEFAULT 1,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" BIGINT REFERENCES "User"("id"),
  "updatedBy" BIGINT REFERENCES "User"("id")
);
```

### 5. PriceAnalysis
Análisis de precios y recomendaciones.

```sql
CREATE TABLE "PriceAnalysis" (
  "id" BIGSERIAL PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "analysisDate" DATE NOT NULL,
  "costPrice" DECIMAL(10,2) NOT NULL,
  "salePrice" DECIMAL(10,2) NOT NULL,
  "finalPrice" DECIMAL(12,2) NOT NULL,
  "profitMargin" DECIMAL(5,2) NOT NULL,
  "profitAmount" DECIMAL(10,2) NOT NULL,
  "categoryAverageMargin" DECIMAL(5,2),
  "marketPosition" VARCHAR(20) CHECK (marketPosition IN ('below_market', 'market_average', 'above_market')),
  "competitorPrice" DECIMAL(10,2),
  "recommendation" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. PriceRoundingRules
Reglas de redondeo disponibles.

```sql
CREATE TABLE "PriceRoundingRules" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "ruleType" VARCHAR(20) NOT NULL CHECK (ruleType IN ('none', 'tens', 'hundreds', 'thousands')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
```

## Campos en Tabla Product

### Campos Relevantes para Precios
```sql
-- Campos existentes en la tabla Product
"costprice" DECIMAL(10,2),     -- Precio de costo
"saleprice" DECIMAL(10,2),     -- Precio de venta (sin IVA)
"finalPrice" DECIMAL(12,2),    -- Precio final con IVA y redondeo aplicado
"vat" DECIMAL(5,2) DEFAULT 19, -- Porcentaje de IVA
"categoryid" BIGINT,           -- Referencia a categoría (snake_case)
"isPOSEnabled" BOOLEAN DEFAULT false
```

## Triggers y Funciones

### 1. Trigger de Redondeo Automático
```sql
CREATE OR REPLACE FUNCTION update_final_price_with_vat()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  rounding_rule VARCHAR(20) := 'hundreds';
  final_price DECIMAL(12,2);
BEGIN
  -- Obtener regla de redondeo de la categoría
  SELECT cpc."roundingRule" INTO rounding_rule
  FROM "CategoryProfitConfig" cpc
  WHERE cpc."categoryId" = NEW."categoryid"
    AND cpc."isActive" = true;
  
  -- Si no hay configuración, usar por defecto
  IF rounding_rule IS NULL THEN
    rounding_rule := 'hundreds';
  END IF;
  
  -- Calcular precio base con IVA
  final_price := COALESCE(NEW."saleprice", 0) * (1 + COALESCE(NEW."vat", 0)/100);
  
  -- Aplicar regla de redondeo
  CASE rounding_rule
    WHEN 'tens' THEN
      final_price := ROUND(final_price / 10) * 10;
    WHEN 'hundreds' THEN
      final_price := ROUND(final_price / 100) * 100;
    WHEN 'thousands' THEN
      final_price := ROUND(final_price / 1000) * 1000;
    WHEN 'none' THEN
      final_price := ROUND(final_price);
    ELSE
      final_price := ROUND(final_price / 100) * 100;
  END CASE;
  
  NEW."finalPrice" := final_price;
  RETURN NEW;
END;
$$;

-- Trigger que se ejecuta en cada INSERT/UPDATE
CREATE TRIGGER trg_update_final_price_with_vat 
BEFORE INSERT OR UPDATE ON "Product" 
FOR EACH ROW EXECUTE FUNCTION update_final_price_with_vat();
```

### 2. Función de Aplicación de Promociones
```sql
CREATE OR REPLACE FUNCTION apply_promotions_to_price(
  product_id BIGINT,
  base_price DECIMAL(10,2)
) RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  final_price DECIMAL(10,2) := base_price;
  promotion RECORD;
  product_category_id BIGINT;
BEGIN
  -- Obtener categoría del producto
  SELECT "categoryId" INTO product_category_id
  FROM "Product"
  WHERE "id" = product_id;
  
  -- Buscar promociones activas que apliquen al producto
  FOR promotion IN
    SELECT * FROM "PricePromotions"
    WHERE "isActive" = true
      AND "startDate" <= NOW()
      AND "endDate" >= NOW()
      AND (
        "applicableTo" = 'all_products' OR
        ("applicableTo" = 'category' AND "applicableId" = product_category_id) OR
        ("applicableTo" = 'product' AND "applicableId" = product_id)
      )
    ORDER BY "priority" DESC
  LOOP
    -- Aplicar promoción
    CASE promotion."promotionType"
      WHEN 'discount_percentage' THEN
        final_price := final_price * (1 - promotion."value" / 100);
      WHEN 'discount_fixed' THEN
        final_price := final_price - promotion."value";
      WHEN 'markup_percentage' THEN
        final_price := final_price * (1 + promotion."value" / 100);
      WHEN 'markup_fixed' THEN
        final_price := final_price + promotion."value";
      WHEN 'special_price' THEN
        final_price := promotion."value";
    END CASE;
    
    -- Solo aplicar la primera promoción (mayor prioridad)
    EXIT;
  END LOOP;
  
  RETURN GREATEST(final_price, 0); -- No permitir precios negativos
END;
$$;
```

## Índices para Optimización

### Índices Principales
```sql
-- Índices para CategoryProfitConfig
CREATE INDEX idx_category_profit_config_category ON "CategoryProfitConfig"("categoryId");
CREATE INDEX idx_category_profit_config_active ON "CategoryProfitConfig"("isActive");

-- Índices para ProductProfitConfig
CREATE INDEX idx_product_profit_config_product ON "ProductProfitConfig"("productId");
CREATE INDEX idx_product_profit_config_active ON "ProductProfitConfig"("isActive");

-- Índices para PriceHistory
CREATE INDEX idx_price_history_product ON "PriceHistory"("productId");
CREATE INDEX idx_price_history_date ON "PriceHistory"("createdAt");
CREATE INDEX idx_price_history_reason ON "PriceHistory"("changeReason");

-- Índices para PricePromotions
CREATE INDEX idx_price_promotions_dates ON "PricePromotions"("startDate", "endDate");
CREATE INDEX idx_price_promotions_active ON "PricePromotions"("isActive");
CREATE INDEX idx_price_promotions_applicable ON "PricePromotions"("applicableTo", "applicableId");

-- Índices para Product
CREATE INDEX idx_product_category ON "Product"("categoryid");
CREATE INDEX idx_product_cost_price ON "Product"("costprice");
CREATE INDEX idx_product_sale_price ON "Product"("saleprice");
CREATE INDEX idx_product_final_price ON "Product"("finalPrice");
```

## Row Level Security (RLS)

### Políticas de Seguridad
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE "CategoryProfitConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductProfitConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PricePromotions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PriceRoundingRules" ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según necesidades de seguridad)
CREATE POLICY "CategoryProfitConfig_policy" ON "CategoryProfitConfig"
  FOR ALL USING (true);

CREATE POLICY "ProductProfitConfig_policy" ON "ProductProfitConfig"
  FOR ALL USING (true);

CREATE POLICY "PricePromotions_policy" ON "PricePromotions"
  FOR ALL USING (true);

CREATE POLICY "PriceHistory_policy" ON "PriceHistory"
  FOR ALL USING (true);

CREATE POLICY "PriceAnalysis_policy" ON "PriceAnalysis"
  FOR ALL USING (true);

CREATE POLICY "PriceRoundingRules_policy" ON "PriceRoundingRules"
  FOR ALL USING (true);
```

## Datos de Inicialización

### Reglas de Redondeo por Defecto
```sql
INSERT INTO "PriceRoundingRules" ("name", "description", "ruleType", "isActive") VALUES
('Sin Redondeo', 'Mantener precios exactos con decimales', 'none', true),
('Redondeo a Decenas', 'Redondear a la decena más cercana (ej: 1,234 → 1,230)', 'tens', true),
('Redondeo a Centenas', 'Redondear a la centena más cercana (ej: 1,234 → 1,200)', 'hundreds', true),
('Redondeo a Miles', 'Redondear al millar más cercano (ej: 1,234 → 1,000)', 'thousands', true)
ON CONFLICT DO NOTHING;
```

## Migraciones

### Archivos de Migración
- `supabase/migrations/20250122000000_create_price_management_system.sql` - Estructura inicial
- `supabase/migrations/20250123000000_fix_trigger_final_price_vat.sql` - Corrección de trigger
- `supabase/migrations/20250123000001_disable_problematic_trigger.sql` - Deshabilitación de trigger problemático
- `supabase/migrations/20250123000002_fix_rounding_trigger.sql` - Trigger corregido final

### Orden de Aplicación
1. Crear estructura inicial
2. Aplicar correcciones de triggers
3. Deshabilitar triggers problemáticos si es necesario
4. Aplicar trigger final corregido

## Consultas Útiles

### Verificar Configuración de Categoría
```sql
SELECT 
  c.name as categoria,
  cpc."defaultProfitMargin" as margen_por_defecto,
  cpc."roundingRule" as regla_redondeo,
  cpc."isActive" as activo
FROM "Category" c
LEFT JOIN "CategoryProfitConfig" cpc ON cpc."categoryId" = c.id
WHERE c.name = 'Tableros construcción';
```

### Verificar Precios de Productos
```sql
SELECT 
  p.name as producto,
  p."costprice" as costo,
  p."saleprice" as precio_venta,
  p."finalPrice" as precio_final,
  p."vat" as iva
FROM "Product" p
WHERE p."categoryid" = (SELECT id FROM "Category" WHERE name = 'Tableros construcción')
LIMIT 10;
```

### Historial de Cambios de Precios
```sql
SELECT 
  p.name as producto,
  ph."oldSalePrice" as precio_anterior,
  ph."newSalePrice" as precio_nuevo,
  ph."changeReason" as razon,
  ph."createdAt" as fecha_cambio
FROM "PriceHistory" ph
JOIN "Product" p ON p.id = ph."productId"
ORDER BY ph."createdAt" DESC
LIMIT 20;
```

## Mantenimiento

### Limpieza de Datos Históricos
```sql
-- Eliminar historial de precios más antiguo de 1 año
DELETE FROM "PriceHistory" 
WHERE "createdAt" < NOW() - INTERVAL '1 year';
```

### Actualización de Estadísticas
```sql
-- Actualizar estadísticas de las tablas
ANALYZE "CategoryProfitConfig";
ANALYZE "ProductProfitConfig";
ANALYZE "PriceHistory";
ANALYZE "PricePromotions";
ANALYZE "PriceAnalysis";
```

### Verificación de Integridad
```sql
-- Verificar que todos los productos tengan precio final calculado
SELECT COUNT(*) as productos_sin_precio_final
FROM "Product" 
WHERE "finalPrice" IS NULL 
  AND "saleprice" IS NOT NULL;
```
