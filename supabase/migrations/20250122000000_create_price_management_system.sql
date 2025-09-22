-- ============================================
-- MÓDULO COMPLETO DE GESTIÓN DE PRECIOS
-- ============================================
-- Fecha: 2025-01-22
-- Descripción: Sistema completo para ajuste de precios basado en costos,
--              utilidades por categorías, promociones temporales y análisis de precios

-- ============================================
-- 1. TABLA DE CONFIGURACIÓN DE UTILIDADES POR CATEGORÍA
-- ============================================

CREATE TABLE IF NOT EXISTS "CategoryProfitConfig" (
  "id" BIGSERIAL PRIMARY KEY,
  "categoryId" BIGINT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
  "defaultProfitMargin" DECIMAL(5,2) NOT NULL DEFAULT 30.00, -- % de utilidad por defecto
  "minProfitMargin" DECIMAL(5,2) NOT NULL DEFAULT 10.00,     -- % mínimo de utilidad
  "maxProfitMargin" DECIMAL(5,2) NOT NULL DEFAULT 100.00,    -- % máximo de utilidad
  "roundingRule" VARCHAR(20) DEFAULT 'hundreds' CHECK (roundingRule IN ('none', 'tens', 'hundreds', 'thousands')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" BIGINT REFERENCES "User"("id"),
  "updatedBy" BIGINT REFERENCES "User"("id")
);

-- ============================================
-- 2. TABLA DE CONFIGURACIÓN DE UTILIDADES POR PRODUCTO ESPECÍFICO
-- ============================================

CREATE TABLE IF NOT EXISTS "ProductProfitConfig" (
  "id" BIGSERIAL PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "profitMargin" DECIMAL(5,2) NOT NULL, -- % de utilidad específico para este producto
  "roundingRule" VARCHAR(20) DEFAULT 'hundreds' CHECK (roundingRule IN ('none', 'tens', 'hundreds', 'thousands')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" BIGINT REFERENCES "User"("id"),
  "updatedBy" BIGINT REFERENCES "User"("id"),
  UNIQUE("productId")
);

-- ============================================
-- 3. TABLA DE PROMOCIONES TEMPORALES
-- ============================================

CREATE TABLE IF NOT EXISTS "PricePromotions" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "promotionType" VARCHAR(50) NOT NULL CHECK (promotionType IN ('discount_percentage', 'discount_fixed', 'markup_percentage', 'markup_fixed', 'special_price')),
  "value" DECIMAL(10,2) NOT NULL, -- Valor del descuento/aumento
  "appliesTo" VARCHAR(50) NOT NULL CHECK (appliesTo IN ('all_products', 'categories', 'specific_products', 'suppliers')),
  "targetIds" INTEGER[], -- IDs de categorías, productos o proveedores
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "priority" INTEGER DEFAULT 0, -- Prioridad para aplicar múltiples promociones
  "maxUsage" INTEGER, -- Límite de usos (opcional)
  "currentUsage" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdBy" BIGINT REFERENCES "User"("id"),
  "updatedBy" BIGINT REFERENCES "User"("id")
);

-- ============================================
-- 4. TABLA DE HISTORIAL DE CAMBIOS DE PRECIOS
-- ============================================

CREATE TABLE IF NOT EXISTS "PriceHistory" (
  "id" BIGSERIAL PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
  "oldCostPrice" DECIMAL(10,2),
  "newCostPrice" DECIMAL(10,2),
  "oldSalePrice" DECIMAL(10,2),
  "newSalePrice" DECIMAL(10,2),
  "oldFinalPrice" DECIMAL(12,2),
  "newFinalPrice" DECIMAL(12,2),
  "changeReason" VARCHAR(100), -- 'cost_update', 'margin_adjustment', 'promotion', 'manual'
  "promotionId" BIGINT REFERENCES "PricePromotions"("id"),
  "profitMarginBefore" DECIMAL(5,2),
  "profitMarginAfter" DECIMAL(5,2),
  "changedAt" TIMESTAMPTZ DEFAULT NOW(),
  "changedBy" BIGINT REFERENCES "User"("id")
);

-- ============================================
-- 5. TABLA DE ANÁLISIS DE PRECIOS
-- ============================================

CREATE TABLE IF NOT EXISTS "PriceAnalysis" (
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

-- ============================================
-- 6. TABLA DE CONFIGURACIÓN DE REDONDEO
-- ============================================

CREATE TABLE IF NOT EXISTS "PriceRoundingRules" (
  "id" BIGSERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "ruleType" VARCHAR(20) NOT NULL CHECK (ruleType IN ('none', 'tens', 'hundreds', 'thousands', 'custom')),
  "customValue" INTEGER, -- Para reglas personalizadas
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para CategoryProfitConfig
CREATE INDEX IF NOT EXISTS "idx_category_profit_config_category" ON "CategoryProfitConfig"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_category_profit_config_active" ON "CategoryProfitConfig"("isActive") WHERE "isActive" = true;

-- Índices para ProductProfitConfig
CREATE INDEX IF NOT EXISTS "idx_product_profit_config_product" ON "ProductProfitConfig"("productId");
CREATE INDEX IF NOT EXISTS "idx_product_profit_config_active" ON "ProductProfitConfig"("isActive") WHERE "isActive" = true;

-- Índices para PricePromotions
CREATE INDEX IF NOT EXISTS "idx_price_promotions_dates" ON "PricePromotions"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "idx_price_promotions_active" ON "PricePromotions"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "idx_price_promotions_priority" ON "PricePromotions"("priority", "isActive");

-- Índices para PriceHistory
CREATE INDEX IF NOT EXISTS "idx_price_history_product" ON "PriceHistory"("productId");
CREATE INDEX IF NOT EXISTS "idx_price_history_date" ON "PriceHistory"("changedAt");
CREATE INDEX IF NOT EXISTS "idx_price_history_reason" ON "PriceHistory"("changeReason");

-- Índices para PriceAnalysis
CREATE INDEX IF NOT EXISTS "idx_price_analysis_product" ON "PriceAnalysis"("productId");
CREATE INDEX IF NOT EXISTS "idx_price_analysis_date" ON "PriceAnalysis"("analysisDate");

-- ============================================
-- 8. FUNCIONES PARA CÁLCULO DE PRECIOS
-- ============================================

-- Función para calcular precio de venta basado en costo y margen
CREATE OR REPLACE FUNCTION calculate_sale_price_from_cost(
  cost_price DECIMAL(10,2),
  profit_margin DECIMAL(5,2),
  rounding_rule VARCHAR(20) DEFAULT 'hundreds'
)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  calculated_price DECIMAL(10,2);
  rounded_price DECIMAL(10,2);
BEGIN
  -- Calcular precio con margen
  calculated_price := cost_price * (1 + profit_margin / 100);
  
  -- Aplicar regla de redondeo
  CASE rounding_rule
    WHEN 'tens' THEN
      rounded_price := ROUND(calculated_price, -1);
    WHEN 'hundreds' THEN
      rounded_price := ROUND(calculated_price, -2);
    WHEN 'thousands' THEN
      rounded_price := ROUND(calculated_price, -3);
    WHEN 'none' THEN
      rounded_price := ROUND(calculated_price, 2);
    ELSE
      rounded_price := ROUND(calculated_price, -2); -- Default: hundreds
  END CASE;
  
  RETURN rounded_price;
END;
$$;

-- Función para obtener margen de utilidad por categoría
CREATE OR REPLACE FUNCTION get_category_profit_margin(category_id BIGINT)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  margin DECIMAL(5,2);
BEGIN
  SELECT "defaultProfitMargin" INTO margin
  FROM "CategoryProfitConfig"
  WHERE "categoryId" = category_id AND "isActive" = true;
  
  -- Si no hay configuración específica, retornar margen por defecto
  IF margin IS NULL THEN
    margin := 30.00; -- 30% por defecto
  END IF;
  
  RETURN margin;
END;
$$;

-- Función para obtener margen de utilidad por producto
CREATE OR REPLACE FUNCTION get_product_profit_margin(product_id BIGINT)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  product_margin DECIMAL(5,2);
  category_margin DECIMAL(5,2);
  product_category_id BIGINT;
BEGIN
  -- Buscar margen específico del producto
  SELECT "profitMargin" INTO product_margin
  FROM "ProductProfitConfig"
  WHERE "productId" = product_id AND "isActive" = true;
  
  -- Si no hay margen específico, usar el de la categoría
  IF product_margin IS NULL THEN
    SELECT "categoryId" INTO product_category_id
    FROM "Product"
    WHERE "id" = product_id;
    
    category_margin := get_category_profit_margin(product_category_id);
    product_margin := category_margin;
  END IF;
  
  RETURN product_margin;
END;
$$;

-- Función para aplicar promociones activas
CREATE OR REPLACE FUNCTION apply_active_promotions(
  product_id BIGINT,
  base_price DECIMAL(10,2),
  check_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS DECIMAL(10,2)
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
      AND check_date BETWEEN "startDate" AND "endDate"
      AND (
        "appliesTo" = 'all_products' OR
        ("appliesTo" = 'categories' AND product_category_id = ANY("targetIds")) OR
        ("appliesTo" = 'specific_products' AND product_id = ANY("targetIds"))
      )
    ORDER BY "priority" DESC, "id" DESC
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

-- ============================================
-- 9. TRIGGERS PARA AUTOMATIZACIÓN
-- ============================================

-- Trigger para registrar cambios de precios
CREATE OR REPLACE FUNCTION log_price_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo registrar si hay cambios en precios
  IF (OLD."costprice" IS DISTINCT FROM NEW."costprice") OR 
     (OLD."saleprice" IS DISTINCT FROM NEW."saleprice") OR
     (OLD."final_price_with_vat" IS DISTINCT FROM NEW."final_price_with_vat") THEN
    
    INSERT INTO "PriceHistory" (
      "productId",
      "oldCostPrice",
      "newCostPrice",
      "oldSalePrice",
      "newSalePrice",
      "oldFinalPrice",
      "newFinalPrice",
      "changeReason",
      "profitMarginBefore",
      "profitMarginAfter",
      "changedBy"
    ) VALUES (
      NEW."id",
      OLD."costprice",
      NEW."costprice",
      OLD."saleprice",
      NEW."saleprice",
      OLD."final_price_with_vat",
      NEW."final_price_with_vat",
      'manual_update',
      CASE 
        WHEN OLD."costprice" > 0 THEN ((OLD."saleprice" - OLD."costprice") / OLD."costprice") * 100
        ELSE NULL
      END,
      CASE 
        WHEN NEW."costprice" > 0 THEN ((NEW."saleprice" - NEW."costprice") / NEW."costprice") * 100
        ELSE NULL
      END,
      NULL -- TODO: Obtener del contexto de usuario
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_price_changes
  AFTER UPDATE ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION log_price_changes();

-- ============================================
-- 10. DATOS INICIALES
-- ============================================

-- Insertar reglas de redondeo por defecto
INSERT INTO "PriceRoundingRules" ("name", "description", "ruleType", "isActive") VALUES
('Sin Redondeo', 'Mantener precios exactos con decimales', 'none', true),
('Redondeo a Decenas', 'Redondear a la decena más cercana (ej: 1,234 → 1,230)', 'tens', true),
('Redondeo a Centenas', 'Redondear a la centena más cercana (ej: 1,234 → 1,200)', 'hundreds', true),
('Redondeo a Miles', 'Redondear al millar más cercano (ej: 1,234 → 1,000)', 'thousands', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 11. RLS (Row Level Security)
-- ============================================

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

-- ============================================
-- 12. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE "CategoryProfitConfig" IS 'Configuración de márgenes de utilidad por categoría de productos';
COMMENT ON TABLE "ProductProfitConfig" IS 'Configuración de márgenes de utilidad específicos por producto';
COMMENT ON TABLE "PricePromotions" IS 'Promociones temporales de precios (descuentos, aumentos, precios especiales)';
COMMENT ON TABLE "PriceHistory" IS 'Historial de todos los cambios de precios para auditoría';
COMMENT ON TABLE "PriceAnalysis" IS 'Análisis de precios y recomendaciones de mercado';
COMMENT ON TABLE "PriceRoundingRules" IS 'Reglas de redondeo para precios';

COMMENT ON FUNCTION calculate_sale_price_from_cost IS 'Calcula precio de venta basado en costo y margen de utilidad';
COMMENT ON FUNCTION get_category_profit_margin IS 'Obtiene el margen de utilidad configurado para una categoría';
COMMENT ON FUNCTION get_product_profit_margin IS 'Obtiene el margen de utilidad para un producto específico';
COMMENT ON FUNCTION apply_active_promotions IS 'Aplica promociones activas a un precio base';
