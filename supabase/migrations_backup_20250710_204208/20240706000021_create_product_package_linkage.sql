-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Sistema de Vinculación de Productos Principales a Paquetes
-- Fecha: 2025-01-01
-- Descripción: Conecta productos de la tabla Product con paquetes modulares
-- ═══════════════════════════════════════════════════════════════

-- 1. TABLA DE VINCULACIÓN PRODUCT <-> PAQUETES MODULARES
CREATE TABLE IF NOT EXISTS product_package_linkage (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  package_id BIGINT NOT NULL REFERENCES packages_modular(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  quantity_per_person DECIMAL(3,2) DEFAULT 1.0, -- Para tracking de consumo
  cost_percentage DECIMAL(5,2) DEFAULT 100.0,   -- % del costo que va al producto
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(product_id, package_id)
);

-- 2. TABLA DE TRACKING DE VENTAS
CREATE TABLE IF NOT EXISTS product_sales_tracking (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_type VARCHAR(20) NOT NULL CHECK (sale_type IN ('direct', 'package')),
  package_id BIGINT REFERENCES packages_modular(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  customer_info JSONB,           -- Info del cliente/reserva
  reservation_id BIGINT,         -- ID de reserva si aplica
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. CREAR ÍNDICES PARA CONSULTAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_product_sales_product_date ON product_sales_tracking(product_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_product_sales_type ON product_sales_tracking(sale_type);
CREATE INDEX IF NOT EXISTS idx_product_sales_package ON product_sales_tracking(package_id);

-- 4. VISTA PARA ESTADÍSTICAS CONSOLIDADAS
CREATE OR REPLACE VIEW product_sales_summary AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.sku,
  c.name as category_name,
  
  -- Estadísticas totales
  COALESCE(SUM(pst.quantity), 0) as total_quantity_sold,
  COALESCE(SUM(pst.total_amount), 0) as total_revenue,
  
  -- Ventas directas
  COALESCE(SUM(CASE WHEN pst.sale_type = 'direct' THEN pst.quantity ELSE 0 END), 0) as direct_sales_quantity,
  COALESCE(SUM(CASE WHEN pst.sale_type = 'direct' THEN pst.total_amount ELSE 0 END), 0) as direct_sales_revenue,
  
  -- Ventas por paquetes
  COALESCE(SUM(CASE WHEN pst.sale_type = 'package' THEN pst.quantity ELSE 0 END), 0) as package_sales_quantity,
  COALESCE(SUM(CASE WHEN pst.sale_type = 'package' THEN pst.total_amount ELSE 0 END), 0) as package_sales_revenue,
  
  -- Paquetes asociados
  COUNT(DISTINCT ppl.package_id) as linked_packages_count,
  
  -- Fechas
  MIN(pst.sale_date) as first_sale_date,
  MAX(pst.sale_date) as last_sale_date,
  
  -- Precio actual
  p.saleprice as current_price

FROM "Product" p
LEFT JOIN "Category" c ON p.categoryid = c.id
LEFT JOIN product_sales_tracking pst ON p.id = pst.product_id
LEFT JOIN product_package_linkage ppl ON p.id = ppl.product_id
WHERE p.saleprice IS NOT NULL AND p.saleprice > 0
GROUP BY p.id, p.name, p.sku, c.name, p.saleprice;

-- 5. FUNCIÓN PARA REGISTRAR VENTA AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION register_product_sale(
  p_product_id BIGINT,
  p_sale_type VARCHAR(20),
  p_package_id BIGINT DEFAULT NULL,
  p_quantity DECIMAL(10,2) DEFAULT 1,
  p_unit_price DECIMAL(10,2) DEFAULT NULL,
  p_customer_info JSONB DEFAULT NULL,
  p_reservation_id BIGINT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
  v_unit_price DECIMAL(10,2);
  v_total_amount DECIMAL(10,2);
  v_sale_id BIGINT;
BEGIN
  -- Obtener precio si no se especifica
  IF p_unit_price IS NULL THEN
    SELECT saleprice INTO v_unit_price FROM "Product" WHERE id = p_product_id;
  ELSE
    v_unit_price := p_unit_price;
  END IF;
  
  v_total_amount := p_quantity * v_unit_price;
  
  -- Insertar registro de venta
  INSERT INTO product_sales_tracking (
    product_id, sale_type, package_id, quantity, 
    unit_price, total_amount, customer_info, reservation_id
  ) VALUES (
    p_product_id, p_sale_type, p_package_id, p_quantity,
    v_unit_price, v_total_amount, p_customer_info, p_reservation_id
  ) RETURNING id INTO v_sale_id;
  
  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql;

-- 6. RLS POLICIES (Row Level Security)
ALTER TABLE product_package_linkage ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sales_tracking ENABLE ROW LEVEL SECURITY;

-- Policy para lectura (todos los usuarios autenticados)
CREATE POLICY "Allow read product_package_linkage" ON product_package_linkage
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read product_sales_tracking" ON product_sales_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy para escritura (usuarios autenticados)
CREATE POLICY "Allow insert product_package_linkage" ON product_package_linkage
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow insert product_sales_tracking" ON product_sales_tracking
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy para actualización (usuarios autenticados)
CREATE POLICY "Allow update product_package_linkage" ON product_package_linkage
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE product_package_linkage IS 'Vincula productos principales con paquetes modulares para tracking de ventas';
COMMENT ON TABLE product_sales_tracking IS 'Rastrea todas las ventas de productos (directas y por paquetes)';
COMMENT ON VIEW product_sales_summary IS 'Vista consolidada de estadísticas de ventas por producto';
COMMENT ON FUNCTION register_product_sale IS 'Función para registrar automáticamente ventas de productos';

-- 8. INSERTAR DATOS DE EJEMPLO (OPCIONAL)
-- Estos datos se pueden eliminar en producción
INSERT INTO product_package_linkage (product_id, package_id, is_included, sort_order)
SELECT p.id, pm.id, true, 1
FROM "Product" p
JOIN "Category" c ON p.categoryid = c.id
CROSS JOIN packages_modular pm
WHERE c.name ILIKE '%spa%' 
  AND pm.code = 'SPA_RELAX'
  AND NOT EXISTS (
    SELECT 1 FROM product_package_linkage 
    WHERE product_id = p.id AND package_id = pm.id
  )
LIMIT 3; 