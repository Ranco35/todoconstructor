-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Tabla de Componentes de Productos Combo
-- Fecha: 2025-01-09
-- Descripción: Sistema de gestión de componentes para productos tipo COMBO
-- ═══════════════════════════════════════════════════════════════

-- 1. TABLA DE COMPONENTES DE PRODUCTOS COMBO
CREATE TABLE IF NOT EXISTS product_components (
  id BIGSERIAL PRIMARY KEY,
  combo_product_id BIGINT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  component_product_id BIGINT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Restricciones
  CONSTRAINT unique_combo_component UNIQUE(combo_product_id, component_product_id),
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT positive_price CHECK (unit_price >= 0)
);

-- 2. ÍNDICES PARA OPTIMIZAR CONSULTAS
CREATE INDEX IF NOT EXISTS idx_product_components_combo_id ON product_components(combo_product_id);
CREATE INDEX IF NOT EXISTS idx_product_components_component_id ON product_components(component_product_id);

-- 3. FUNCIÓN PARA CREAR TABLA SI NO EXISTE (PARA COMPATIBILIDAD)
CREATE OR REPLACE FUNCTION create_product_components_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- La tabla ya existe, no hacer nada
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER PARA ACTUALIZAR UPDATED_AT
CREATE OR REPLACE FUNCTION update_product_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_components_updated_at
BEFORE UPDATE ON product_components
FOR EACH ROW EXECUTE FUNCTION update_product_components_updated_at();

-- 5. FUNCIÓN PARA OBTENER COMPONENTES DE UN COMBO
CREATE OR REPLACE FUNCTION get_combo_components(combo_id BIGINT)
RETURNS TABLE (
  component_id BIGINT,
  component_name TEXT,
  component_sku TEXT,
  quantity DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  subtotal DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    pc.quantity,
    pc.unit_price,
    (pc.quantity * pc.unit_price) as subtotal
  FROM product_components pc
  JOIN "Product" p ON pc.component_product_id = p.id
  WHERE pc.combo_product_id = combo_id
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNCIÓN PARA CALCULAR PRECIO TOTAL DE COMPONENTES
CREATE OR REPLACE FUNCTION calculate_combo_total_price(combo_id BIGINT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total_price DECIMAL(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO total_price
  FROM product_components
  WHERE combo_product_id = combo_id;
  
  RETURN total_price;
END;
$$ LANGUAGE plpgsql;

-- 7. POLÍTICAS RLS (Row Level Security)
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

-- Política para usuarios autenticados
CREATE POLICY "Users can view product components" ON product_components
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert product components" ON product_components
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update product components" ON product_components
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete product components" ON product_components
FOR DELETE USING (auth.role() = 'authenticated');

-- 8. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE product_components IS 'Tabla que almacena los componentes de productos tipo COMBO';
COMMENT ON COLUMN product_components.combo_product_id IS 'ID del producto combo principal';
COMMENT ON COLUMN product_components.component_product_id IS 'ID del producto componente';
COMMENT ON COLUMN product_components.quantity IS 'Cantidad del componente en el combo';
COMMENT ON COLUMN product_components.unit_price IS 'Precio unitario del componente en el combo';

-- 9. TRIGGER PARA VALIDAR TIPOS DE PRODUCTOS
CREATE OR REPLACE FUNCTION validate_combo_component_types()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que el producto combo sea de tipo COMBO
  IF NOT EXISTS (
    SELECT 1 FROM "Product" 
    WHERE id = NEW.combo_product_id AND type = 'COMBO'
  ) THEN
    RAISE EXCEPTION 'El producto principal debe ser de tipo COMBO';
  END IF;
  
  -- Validar que el componente no sea de tipo COMBO (evitar combos anidados)
  IF EXISTS (
    SELECT 1 FROM "Product" 
    WHERE id = NEW.component_product_id AND type = 'COMBO'
  ) THEN
    RAISE EXCEPTION 'Un componente no puede ser de tipo COMBO';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_combo_component_types
BEFORE INSERT OR UPDATE ON product_components
FOR EACH ROW EXECUTE FUNCTION validate_combo_component_types();

-- 10. FUNCIÓN PARA VERIFICAR STOCK DISPONIBLE DE COMPONENTES
CREATE OR REPLACE FUNCTION check_combo_stock_availability(combo_id BIGINT, requested_quantity INTEGER DEFAULT 1)
RETURNS TABLE (
  component_id BIGINT,
  component_name TEXT,
  required_quantity DECIMAL(10,2),
  available_stock DECIMAL(10,2),
  sufficient_stock BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    (pc.quantity * requested_quantity) as required_quantity,
    COALESCE(wp.quantity, 0) as available_stock,
    (COALESCE(wp.quantity, 0) >= (pc.quantity * requested_quantity)) as sufficient_stock
  FROM product_components pc
  JOIN "Product" p ON pc.component_product_id = p.id
  LEFT JOIN "Warehouse_Product" wp ON wp."productId" = p.id
  WHERE pc.combo_product_id = combo_id;
END;
$$ LANGUAGE plpgsql; 